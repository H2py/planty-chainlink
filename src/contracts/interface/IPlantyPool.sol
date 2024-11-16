pragma solidity ^0.8.17;

interface IPlantyPool {
    struct CreatePoolInput {
        address assetToken;
        uint256 assetInitialSupply;
        address usdcToken;
        uint256 usdcInitialSupply;
        uint256 initialSpotPrice;
        uint256 delta;
        uint256 protocolFeeMultiplier;
        uint256 tradeFeeMultiplier;
        uint256 publicSaleDuration;
        uint256 publicSalePrice;
    }

    function configurePublicSale(uint256 duration, uint256 price) external;

    function buyAssetDuringPublicSale(uint256 numItems) external;

    function sellAssetDuringPublicSale(uint256 numItems) external;

    function buyAsset(uint256 numItems) external;

    function sellAsset(uint256 numItems) external;

    function getBuyInfo(
        uint256 plantyTokenAmount
    ) external view returns (uint256 inputValue, uint256 newSpotPrice, uint256 tradeFee, uint256 protocolFee);

    function getSellInfo(
        uint256 plantyTokenAmount
    ) external view returns (uint256 outputValue, uint256 newSpotPrice, uint256 tradeFee, uint256 protocolFee);

    function addLiquidity(uint256 assetAmount, uint256 usdcAmount) external;
}
