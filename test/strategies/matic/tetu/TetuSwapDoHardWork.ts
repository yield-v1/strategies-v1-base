import {DoHardWorkLoopBase} from "../../DoHardWorkLoopBase";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {
  IERC20__factory,
  ITetuSwapPair__factory,
  StrategyTetuSelfFarm__factory
} from "../../../../typechain";
import {TokenUtils} from "../../../TokenUtils";
import {parseUnits} from "ethers/lib/utils";
import {BaseAddresses} from "../../../../scripts/addresses/BaseAddresses";

const {expect} = chai;
chai.use(chaiAsPromised);


export class TetuSwapDoHardWork extends DoHardWorkLoopBase {

  public async afterBlockAdvance() {
    await super.afterBlockAdvance();

    await TokenUtils.getToken(BaseAddresses.WBTC_TOKEN, this.strategy.address, parseUnits('0.1', 8));
    await TokenUtils.getToken(BaseAddresses.USDC_TOKEN, this.strategy.address, parseUnits('1000', 6));

  }

}
