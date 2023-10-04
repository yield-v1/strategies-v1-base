import {BaseAddresses} from "../../../../scripts/addresses/BaseAddresses";
import {DeployerUtilsLocal} from "../../../../scripts/deploy/DeployerUtilsLocal";
import {
  MaiStablecoinPipe, MaiStablecoinPipe__factory,
  StrategyAaveMaiBal,
  StrategyAaveMaiBal__factory
} from "../../../../typechain";
import {TokenUtils} from "../../../TokenUtils";
import {utils} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

export class AMBUtils {
  public static getSlotsInfo(underlying: string): { stablecoinAddress: string, priceSlotIndex: string, camToken: string } {
    underlying = underlying.toLowerCase();
    let stablecoinAddress: string;
    /* How to find slot index? go to https://web3playground.io/ , use code below and set contractAddress to stablecoinAddress
          find ethPriceSource() address at the list, and use its index.
          !Do not forget to convert decimal index to hexadecimal
          !Index must have no leading zeros (0xf, but no 0x0f) https://github.com/nomiclabs/hardhat/issues/1700

          async function main() {
            let contractAddress = '0x578375c3af7d61586c2C3A7BA87d2eEd640EFA40'
            for (let index = 0; index < 40; index++){
            console.log(`[${index}]` +
              await web3.eth.getStorageAt(contractAddress, index))
            }
          }
      */
    let priceSlotIndex = '0x10';  // default slot for almost all tokens
    let camToken: string;
    if (underlying === BaseAddresses.WMATIC_TOKEN) {
      camToken = BaseAddresses.camWMATIC_TOKEN;
      stablecoinAddress = '0x88d84a85A87ED12B8f098e8953B322fF789fCD1a'; // camWMATIC MAI Vault (cMVT)
    } else if (underlying === BaseAddresses.WMATIC_TOKEN) {
      camToken = BaseAddresses.camWMATIC_TOKEN;
      stablecoinAddress = '0x88d84a85A87ED12B8f098e8953B322fF789fCD1a'; // camWMATIC MAI Vault (cMVT)

    } else if (underlying === BaseAddresses.AAVE_TOKEN) {
      camToken = BaseAddresses.camAAVE_TOKEN;
      stablecoinAddress = '0x578375c3af7d61586c2C3A7BA87d2eEd640EFA40'; // camAAVE MAI Vault (camAMVT)

    } else if (underlying === BaseAddresses.DAI_TOKEN) {
      camToken = BaseAddresses.camDAI_TOKEN;
      stablecoinAddress = '0xD2FE44055b5C874feE029119f70336447c8e8827';  // camDAI MAI Vault (camDAIMVT)
      priceSlotIndex = '0xf' // different from default slot. Param must have no leading zeros https://github.com/nomiclabs/hardhat/issues/1700

    } else if (underlying === BaseAddresses.WETH_TOKEN) {
      camToken = BaseAddresses.camWETH_TOKEN;
      stablecoinAddress = '0x11A33631a5B5349AF3F165d2B7901A4d67e561ad'; // camWETH MAI Vault (camWEMVT)

    } else if (underlying === BaseAddresses.WBTC_TOKEN) {
      camToken = BaseAddresses.camWBTC_TOKEN;
      stablecoinAddress = '0x7dDA5e1A389E0C1892CaF55940F5fcE6588a9ae0'; // camWBTC MAI Vault (camWBMVT)
    } else {
      throw new Error('Unknown underlying ' + underlying);
    }
    return {
      "stablecoinAddress": stablecoinAddress,
      "priceSlotIndex": priceSlotIndex,
      "camToken": camToken,
    }
  }

  public static async refuelMAI(signer: SignerWithAddress, strategy: string) {
    const strCtr = StrategyAaveMaiBal__factory.connect(strategy, signer);
    const maiStbPipe = await strCtr.pipes(2);
    const maiStbPipeCtr = MaiStablecoinPipe__factory.connect(maiStbPipe, signer);
    const stablecoin = await maiStbPipeCtr.stablecoin()
    await TokenUtils.getToken(BaseAddresses.miMATIC_TOKEN, stablecoin, utils.parseUnits('1000000'));
  }
}
