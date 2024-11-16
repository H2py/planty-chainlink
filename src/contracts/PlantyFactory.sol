// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./PlantyPool.sol";
import "./interface/IPlantyPool.sol";
import "hardhat/console.sol";

contract PlantyFactory {
    /// @notice 풀 정보 저장
    PlantyPool[] public pools;
    address public admin;

    event PoolCreated(address indexed poolAddress, address indexed creator, uint256 initialSpotPrice, uint256 delta);

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    /// @notice 관리자 권한 부여 함수
    // function setAdmin(address admin) external onlyAdmin {
    //     transferOwnership(admin);
    // }

    /// @notice 풀 생성 함수
    function createPool(IPlantyPool.CreatePoolInput memory params) external onlyAdmin returns (address) {
        PlantyPool newPool = new PlantyPool(msg.sender, params);
        pools.push(newPool);

        // 초기 공급 토큰 전송
        IERC20(params.assetToken).transferFrom(msg.sender, address(this), params.assetInitialSupply);
        IERC20(params.usdcToken).transferFrom(msg.sender, address(this), params.usdcInitialSupply);
        IERC20(params.assetToken).approve(address(newPool), params.assetInitialSupply);
        IERC20(params.usdcToken).approve(address(newPool), params.usdcInitialSupply);

        newPool.addLiquidity(params.assetInitialSupply, params.usdcInitialSupply);

        emit PoolCreated(address(newPool), msg.sender, params.initialSpotPrice, params.delta);
        return address(newPool);
    }

    /// @notice 특정 풀의 정보 확인 함수
    function getPoolInfo(
        address poolAddress
    )
        external
        view
        returns (
            uint256 spotPrice,
            uint256 delta,
            uint256 protocolFeeMultiplier,
            uint256 tradeFeeMultiplier,
            uint256 reserveAsset,
            uint256 reserveUSDC
        )
    {
        PlantyPool pool = PlantyPool(poolAddress);
        return (
            pool.spotPrice(),
            pool.delta(),
            pool.protocolFeeMultiplier(),
            pool.tradeFeeMultiplier(),
            pool.reserveAsset(),
            pool.reserveUSDC()
        );
    }

    /// @notice 모든 풀의 정보를 확인하는 함수
    function getAllPoolsInfo()
        external
        view
        returns (
            address[] memory poolAddresses,
            uint256[] memory spotPrices,
            uint256[] memory deltas,
            uint256[] memory protocolFeeMultipliers,
            uint256[] memory tradeFeeMultipliers,
            uint256[] memory reserveAssets,
            uint256[] memory reserveUSDCs
        )
    {
        uint256 poolCount = pools.length;
        poolAddresses = new address[](poolCount);
        spotPrices = new uint256[](poolCount);
        deltas = new uint256[](poolCount);
        protocolFeeMultipliers = new uint256[](poolCount);
        tradeFeeMultipliers = new uint256[](poolCount);
        reserveAssets = new uint256[](poolCount);
        reserveUSDCs = new uint256[](poolCount);

        for (uint256 i = 0; i < poolCount; i++) {
            PlantyPool pool = pools[i];
            poolAddresses[i] = address(pool);
            spotPrices[i] = pool.spotPrice();
            deltas[i] = pool.delta();
            protocolFeeMultipliers[i] = pool.protocolFeeMultiplier();
            tradeFeeMultipliers[i] = pool.tradeFeeMultiplier();
            reserveAssets[i] = pool.reserveAsset();
            reserveUSDCs[i] = pool.reserveUSDC();
        }
    }

    /// @notice 모든 풀의 주소 반환 함수
    function getAllPools() external view returns (PlantyPool[] memory) {
        return pools;
    }
}
