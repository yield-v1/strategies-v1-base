import {BaseAddresses} from "../../../../scripts/addresses/BaseAddresses";
import {DeployerUtilsLocal} from "../../../../scripts/deploy/DeployerUtilsLocal";
import {
  MaiStablecoinPipe,
  MaiStablecoinPipe__factory,
  StrategyMaiBal,
  StrategyMaiBal__factory
} from "../../../../typechain";
import {TokenUtils} from "../../../TokenUtils";
import {utils} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

export class MBUtils {
  public static getSlotsInfo(underlying: string): { stablecoinAddress: string, priceSlotIndex: string } {
    underlying = underlying.toLowerCase();
    let stablecoinAddress: string;
    /* How to find slot index? go to https://web3playground.io/ , use code below and set contractAddress to stablecoinAddress
          find ethPriceSource() address at the list, and use its hexadecimal index.
          !Index must have no leading zeros (0xf, but no 0x0f) https://github.com/nomiclabs/hardhat/issues/1700

      async function main() {
        let contractAddress = '0x7CbF49E4214C7200AF986bc4aACF7bc79dd9C19a'
      for (let index = 0; index < 40; index++){
       console.log(`0x${index.toString(16)} /t` +
         await web3.eth.getStorageAt(contractAddress, index))
      }
      */
    const priceSlotIndex = '0xf';  // default slot for almost all tokens used crosschainQiStablecoinSlim
    if (underlying === BaseAddresses.cxDOGE_TOKEN) {
      stablecoinAddress = BaseAddresses.cxDOGE_MAI_VAULT;

    } else if (underlying === BaseAddresses.cxADA_TOKEN) {
      stablecoinAddress = BaseAddresses.cxADA_MAI_VAULT;

    } else if (underlying === BaseAddresses.cxETH_TOKEN) {
      stablecoinAddress = BaseAddresses.cxETH_MAI_VAULT;
      // priceSlotIndex = '0xf' // different from default slot. Param must have no leading zeros https://github.com/nomiclabs/hardhat/issues/1700

    } else {
      throw new Error('Unknown underlying ' + underlying);
    }
    return {
      "stablecoinAddress": stablecoinAddress,
      "priceSlotIndex": priceSlotIndex,
    }
  }

  public static async refuelMAI(signer: SignerWithAddress, strategy: string) {
    const strCtr = StrategyMaiBal__factory.connect(strategy, signer);
    const maiStbPipe = await strCtr.pipes(0);
    const maiStbPipeCtr = MaiStablecoinPipe__factory.connect(maiStbPipe, signer);
    const stablecoin = await maiStbPipeCtr.stablecoin()
    await TokenUtils.getToken(BaseAddresses.miMATIC_TOKEN, stablecoin, utils.parseUnits('1000000'));
  }
}
