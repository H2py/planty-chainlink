import { localInfo, CreatePoolInput } from "@constants";
import { faker } from "@faker-js/faker";
import { BigNumber, ethers } from "ethers";

export const mockCreatePoolInput = (data?: Partial<CreatePoolInput>): CreatePoolInput => {
  const assetInitialSupply = localInfo.plantyToken.adminSupply; // 90000
  const usdcInitialSupply = ethers.utils.parseEther("10000");
  const initialSpotPrice = ethers.utils.parseEther("9");

  return {
    assetToken: faker.finance.ethereumAddress(),
    assetInitialSupply,
    usdcToken: faker.finance.ethereumAddress(),
    usdcInitialSupply,
    initialSpotPrice,
    delta: BigNumber.from(faker.datatype.number()),
    protocolFeeMultiplier: ethers.utils.parseEther(faker.datatype.float({ min: 0.01, max: 0.1 }).toString()),
    tradeFeeMultiplier: ethers.utils.parseEther(faker.datatype.float({ min: 0.01, max: 0.1 }).toString()),
    publicSaleDuration: BigNumber.from(faker.datatype.number()),
    publicSalePrice: initialSpotPrice,
    ...data,
  };
};
