// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./common/utils/FixedPointMathLib.sol";
import "./interface/IPlantyPool.sol";
import "hardhat/console.sol";

contract PlantyPool is IPlantyPool, Ownable, ReentrancyGuard {
    using FixedPointMathLib for uint256;

    IERC20 public assetToken; // 실물 자산 토큰
    IERC20 public usdcToken; // USDC 토큰
    uint256 public reserveAsset; // 풀 내의 실물 자산 토큰의 수량
    uint256 public reserveUSDC; // 풀 내의 USDC 수량

    uint256 public spotPrice; // 현재 거래되는 Spot Price
    uint256 public delta; // 가격 변화량 (Delta)
    uint256 public protocolFeeMultiplier; // 프로토콜 수수료 비율
    uint256 public tradeFeeMultiplier; // 거래 수수료 비율

    event Swapped(address indexed user, uint256 assetAmount, uint256 usdcAmount, bool isBuying);
    event LiquidityAdded(address indexed user, uint256 assetAmount, uint256 usdcAmount);
    event PublicSaleConfigured(uint256 endTime, uint256 price);
    event PublicSalePurchase(address indexed user, uint256 assetAmount, uint256 usdcAmount);
    event PublicSaleSell(address indexed user, uint256 assetAmount, uint256 usdcAmount);

    modifier onlyDuringPublicSale() {
        require(isPublicSaleActive && block.timestamp < publicSaleEndTime, "Not in public sale period");
        _;
    }

    modifier onlyAfterPublicSale() {
        require(!isPublicSaleActive || block.timestamp >= publicSaleEndTime, "Public sale is active");
        _;
    }

    // Public Sale 관련 변수
    bool public isPublicSaleActive;
    uint256 public publicSaleEndTime;
    uint256 public publicSalePrice; // Public Sale 시 assetToken의 지정가

    constructor(address admin, CreatePoolInput memory params) {
        assetToken = IERC20(params.assetToken);
        usdcToken = IERC20(params.usdcToken);
        spotPrice = params.initialSpotPrice;
        delta = params.delta;
        protocolFeeMultiplier = params.protocolFeeMultiplier;
        tradeFeeMultiplier = params.tradeFeeMultiplier;

        // Public Sale 설정
        publicSaleEndTime = block.timestamp + params.publicSaleDuration;
        publicSalePrice = params.publicSalePrice;
        isPublicSaleActive = true;

        transferOwnership(admin);

        emit PublicSaleConfigured(publicSaleEndTime, publicSalePrice);
    }

    // Public Sale 설정 함수 (admin만 실행 가능)
    function configurePublicSale(uint256 duration, uint256 price) public onlyOwner {
        publicSaleEndTime = block.timestamp + duration;
        publicSalePrice = price;
        isPublicSaleActive = true;

        emit PublicSaleConfigured(publicSaleEndTime, publicSalePrice);
    }

    // Public Sale 동안의 지정가 구매
    function buyAssetDuringPublicSale(uint256 numItems) external nonReentrant onlyDuringPublicSale {
        require(numItems > 0, "Must buy at least one item");
        require(numItems <= reserveAsset, "Insufficient asset liquidity");

        uint256 totalCost = (numItems * publicSalePrice) / 1e18;

        reserveUSDC += totalCost;
        reserveAsset -= numItems;

        require(usdcToken.transferFrom(msg.sender, address(this), totalCost), "USDC transfer failed");
        require(assetToken.balanceOf(address(this)) >= numItems, "Insufficient asset liquidity");
        assetToken.transfer(msg.sender, numItems);

        emit PublicSalePurchase(msg.sender, numItems, totalCost);
    }

    // Public Sale 동안의 지정가 판매
    function sellAssetDuringPublicSale(uint256 numItems) external nonReentrant onlyDuringPublicSale {
        require(numItems > 0, "Must sell at least one item");
        uint256 totalRevenue = (numItems * publicSalePrice) / 1e18;

        // 외부 호출 전에 상태 변경 (Check-Effect-Interaction)
        reserveAsset += numItems;
        reserveUSDC -= totalRevenue;

        require(assetToken.transferFrom(msg.sender, address(this), numItems), "Asset transfer failed");
        require(usdcToken.balanceOf(address(this)) >= totalRevenue, "Insufficient USDC liquidity");
        usdcToken.transfer(msg.sender, totalRevenue);

        emit PublicSaleSell(msg.sender, numItems, totalRevenue);
    }

    function buyAsset(uint256 plantyTokenAmount) external nonReentrant onlyAfterPublicSale {
        // 일반적인 구매 로직 (Public Sale 이후)
        require(plantyTokenAmount > 0, "Must buy at least one item");
        (uint256 inputValue, uint256 newSpotPrice, , ) = getBuyInfo(plantyTokenAmount);

        reserveUSDC += inputValue;
        reserveAsset -= plantyTokenAmount;
        spotPrice = newSpotPrice;

        require(usdcToken.transferFrom(msg.sender, address(this), inputValue), "USDC transfer failed");
        require(assetToken.balanceOf(address(this)) >= plantyTokenAmount, "Insufficient asset liquidity");
        assetToken.transfer(msg.sender, plantyTokenAmount);

        emit Swapped(msg.sender, plantyTokenAmount, inputValue, true);
    }

    function sellAsset(uint256 plantyTokenAmount) external nonReentrant onlyAfterPublicSale {
        // 일반적인 판매 로직 (Public Sale 이후)
        require(plantyTokenAmount > 0, "Must sell at least one item");
        (uint256 outputValue, uint256 newSpotPrice, , ) = getSellInfo(plantyTokenAmount);

        reserveAsset += plantyTokenAmount;
        reserveUSDC -= outputValue;
        spotPrice = newSpotPrice;

        require(assetToken.transferFrom(msg.sender, address(this), plantyTokenAmount), "Asset transfer failed");
        require(usdcToken.balanceOf(address(this)) >= outputValue, "Insufficient USDC liquidity");
        usdcToken.transfer(msg.sender, outputValue);

        emit Swapped(msg.sender, plantyTokenAmount, outputValue, false);
    }

    function getBuyInfo(
        uint256 plantyTokenAmount
    ) public view returns (uint256 inputValue, uint256 newSpotPrice, uint256 tradeFee, uint256 protocolFee) {
        require(plantyTokenAmount > 0, "Invalid number of items");

        uint256 buyAmount = (plantyTokenAmount * spotPrice) / 1e18;
        uint256 increment = (((plantyTokenAmount * (plantyTokenAmount - 1)) / 1e18) * delta) / 1e18 / 2;

        newSpotPrice = spotPrice + increment;

        protocolFee = buyAmount.mulWadUp(protocolFeeMultiplier);
        tradeFee = buyAmount.mulWadUp(tradeFeeMultiplier);
        inputValue = buyAmount + tradeFee + protocolFee;
    }

    function getSellInfo(
        uint256 usdcAmount
    ) public view returns (uint256 outputValue, uint256 newSpotPrice, uint256 tradeFee, uint256 protocolFee) {
        require(usdcAmount > 0, "Invalid number of items");

        uint256 sellAmount = (usdcAmount * 1e18) / spotPrice;
        uint256 decrement = (((usdcAmount * (usdcAmount + 1)) / 1e18) * delta) / 1e18 / 2;

        uint256 decrementPlantyTokenAmount = (decrement * 1e18) / spotPrice;
        newSpotPrice = spotPrice - decrementPlantyTokenAmount;

        protocolFee = sellAmount.mulWadUp(protocolFeeMultiplier);
        tradeFee = sellAmount.mulWadUp(tradeFeeMultiplier);
        outputValue = sellAmount - tradeFee - protocolFee;
    }

    function addLiquidity(uint256 assetAmount, uint256 usdcAmount) external {
        require(assetAmount > 0 && usdcAmount > 0 && (usdcAmount * spotPrice) / 1e18 == assetAmount, "Invalid amounts");

        reserveAsset += assetAmount;
        reserveUSDC += usdcAmount;

        assetToken.transferFrom(msg.sender, address(this), assetAmount);
        usdcToken.transferFrom(msg.sender, address(this), usdcAmount);

        emit LiquidityAdded(msg.sender, assetAmount, usdcAmount);
    }
}
