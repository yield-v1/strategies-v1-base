import {DoHardWorkLoopBase} from "../../DoHardWorkLoopBase";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {DeployerUtilsLocal} from "../../../../scripts/deploy/DeployerUtilsLocal";
import {BaseAddresses} from "../../../../scripts/addresses/BaseAddresses";
import {
  IstKlima,
  IRewardToken,
  IRewardToken__factory,
  IstKlima__factory
} from "../../../../typechain";
import {utils} from "ethers";
import {TokenUtils} from "../../../TokenUtils";

const {expect} = chai;
chai.use(chaiAsPromised);


export class VesqStakingDoHardWork extends DoHardWorkLoopBase {

  public async loopStartActions(i: number) {
    await super.loopStartActions(i);
    const gov = await DeployerUtilsLocal.impersonate(BaseAddresses.GOV_ADDRESS);
    await this.vault.connect(gov).changeProtectionMode(true);

    const dec = await TokenUtils.decimals(BaseAddresses.VSQ_TOKEN);
    const amount = utils.parseUnits('10000', dec);

    const treasury = await DeployerUtilsLocal.impersonate(BaseAddresses.VESQ_TREASURY);
    const klimaCtr = IRewardToken__factory.connect(BaseAddresses.VSQ_TOKEN, treasury);
    await klimaCtr.mint(BaseAddresses.VESQ_STAKING, amount);

    const klimaStaking = await DeployerUtilsLocal.impersonate(BaseAddresses.VESQ_STAKING);
    const stKlimaCtr = IstKlima__factory.connect(BaseAddresses.sVESQ, klimaStaking);
    await stKlimaCtr.rebase(amount, 1);
  }


  public async loopEndActions(i: number) {
    const dec = await TokenUtils.decimals(BaseAddresses.VSQ_TOKEN);
    const amount = utils.parseUnits('10000', dec);

    const treasury = await DeployerUtilsLocal.impersonate(BaseAddresses.VESQ_TREASURY);
    const klimaCtr = IRewardToken__factory.connect(BaseAddresses.VSQ_TOKEN, treasury);
    await klimaCtr.mint(BaseAddresses.VESQ_STAKING, amount);

    const klimaStaking = await DeployerUtilsLocal.impersonate(BaseAddresses.VESQ_STAKING);
    const stKlimaCtr = IstKlima__factory.connect(BaseAddresses.sVESQ, klimaStaking);
    await stKlimaCtr.rebase(amount, 1);

    await super.loopEndActions(i);
  }

}
