import { BigNumber } from "ethers";

export interface CreatePoolInput {
  assetToken: string;
  assetInitialSupply: BigNumber;
  usdcToken: string;
  usdcInitialSupply: BigNumber;
  initialSpotPrice: BigNumber;
  delta: BigNumber;
  protocolFeeMultiplier: BigNumber;
  tradeFeeMultiplier: BigNumber;
  publicSaleDuration: BigNumber;
  publicSalePrice: BigNumber;
}

export interface PlantyConfig {
  plantyToken: {
    name: string;
    symbol: string;
    plantManagerSupply: BigNumber;
    adminSupply: BigNumber;
  };
  createPoolConfig?: Omit<CreatePoolInput, "assetToken" | "usdcToken">;
  network?: {
    gasLimit: number;
  };
}
