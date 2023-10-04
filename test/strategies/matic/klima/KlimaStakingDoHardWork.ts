import {DoHardWorkLoopBase} from "../../DoHardWorkLoopBase";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {DeployerUtilsLocal} from "../../../../scripts/deploy/DeployerUtilsLocal";
import {BaseAddresses} from "../../../../scripts/addresses/BaseAddresses";
import {
  IRewardToken,
  IRewardToken__factory,
  IstKlima,
  IstKlima__factory
} from "../../../../typechain";
import {utils} from "ethers";
import {TokenUtils} from "../../../TokenUtils";

const {expect} = chai;
chai.use(chaiAsPromised);


export class KlimaStakingDoHardWork extends DoHardWorkLoopBase {

  public async loopStartActions(i: number) {
    await super.loopStartActions(i);
    const gov = await DeployerUtilsLocal.impersonate(BaseAddresses.GOV_ADDRESS);
    await this.vault.connect(gov).changeProtectionMode(true);

    const dec = await TokenUtils.decimals(BaseAddresses.KLIMA_TOKEN);
    const amount = utils.parseUnits('10000', dec);

    const treasury = await DeployerUtilsLocal.impersonate(BaseAddresses.KLIMA_TREASURY);
    const klimaCtr = IRewardToken__factory.connect(BaseAddresses.KLIMA_TOKEN, treasury);
    await klimaCtr.mint(BaseAddresses.KLIMA_STAKING, amount);

    const klimaStaking = await DeployerUtilsLocal.impersonate(BaseAddresses.KLIMA_STAKING);
    const stKlimaCtr = IstKlima__factory.connect(BaseAddresses.sKLIMA, klimaStaking);
    await stKlimaCtr.rebase(amount, 1);
  }


  public async loopEndActions(i: number) {
    const dec = await TokenUtils.decimals(BaseAddresses.KLIMA_TOKEN);
    const amount = utils.parseUnits('10000', dec);

    const treasury = await DeployerUtilsLocal.impersonate(BaseAddresses.KLIMA_TREASURY);
    const klimaCtr = IRewardToken__factory.connect(BaseAddresses.KLIMA_TOKEN, treasury);
    await klimaCtr.mint(BaseAddresses.KLIMA_STAKING, amount);

    const klimaStaking = await DeployerUtilsLocal.impersonate(BaseAddresses.KLIMA_STAKING);
    const stKlimaCtr = IstKlima__factory.connect(BaseAddresses.sKLIMA, klimaStaking);
    await stKlimaCtr.rebase(amount, 1);

    await super.loopEndActions(i);
  }

}
