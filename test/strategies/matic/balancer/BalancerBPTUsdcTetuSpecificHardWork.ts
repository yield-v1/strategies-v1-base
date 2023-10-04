import {DoHardWorkLoopBase} from "../../DoHardWorkLoopBase";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {
  IBalancerGauge__factory,
  IERC20__factory, StrategyBalancerTetuUsdc__factory
} from "../../../../typechain";
import {BaseAddresses} from "../../../../scripts/addresses/BaseAddresses";
import {BigNumber} from "ethers";
import {parseUnits} from "ethers/lib/utils";
import {TokenUtils} from "../../../TokenUtils";
import {UtilsBalancerGaugeV2} from "../../../baseUtils/balancer/utilsBalancerGaugeV2";
import {DeployerUtilsLocal} from "../../../../scripts/deploy/DeployerUtilsLocal";

const {expect} = chai;
chai.use(chaiAsPromised);


export class BalancerBPTUsdcTetuSpecificHardWork extends DoHardWorkLoopBase {

  rewardsRecipientLastBalance = BigNumber.from(0);
  controllerLastBalance = BigNumber.from(0);
  currentLoop = 0;

  protected async loopStartActions(i: number) {
    await super.loopStartActions(i);
    this.currentLoop = i;

    const strategy = StrategyBalancerTetuUsdc__factory.connect(this.strategy.address, this.signer);

    // IBalancerGaugeV1
            // const gauge = IBalancerGaugeV1__factory.connect(await strat.GAUGE(), this.signer);
            // console.log(`loopStartActions gauge=${gauge}`);
            // const streamerAdr = await gauge.reward_contract();
            // console.log(`loopStartActions gauge.reward_contract done`);
            //
            // const owner = await DeployerUtilsLocal.impersonate('0xC128468b7Ce63eA702C1f104D55A2566b13D3ABD');
            // const streamer = IChildChainStreamer__factory.connect(streamerAdr, owner);
            // await TokenUtils.getToken(BaseAddresses.BAL_TOKEN, streamer.address, parseUnits('100'));
            // await streamer.notify_reward_amount(BaseAddresses.BAL_TOKEN);

    // IBalancerGauge:
            // rewards are added once in BalancerBPT_TETU-USDC_Test
            // see "register TETU as reward token in the GAUGE" comment

    const gauge = await IBalancerGauge__factory.connect(await strategy.GAUGE(), this.signer);
    const rewardsRecipient = await strategy.rewardsRecipient();
    this.rewardsRecipientLastBalance = await gauge.balanceOf(rewardsRecipient);
    console.log("this.rewardsRecipientLastBalance", this.rewardsRecipientLastBalance);
    this.controllerLastBalance = await IERC20__factory.connect(BaseAddresses.TETU_TOKEN, this.signer).balanceOf(this.core.controller.address);
  }

  protected async loopEndCheck() {
    await super.loopEndCheck();

    if (this.currentLoop !== 0) {
      const strat = StrategyBalancerTetuUsdc__factory.connect(this.strategy.address, this.signer);
      const rewardsRecipient = await strat.rewardsRecipient()
      const balanceRewardsRecipient = await IERC20__factory.connect(BaseAddresses.tetuBAL, this.signer).balanceOf(rewardsRecipient);
      console.log('balanceRewardsRecipient', balanceRewardsRecipient.toString())
      expect(balanceRewardsRecipient.gt(this.rewardsRecipientLastBalance)).eq(true);

      const ctrlBal = await IERC20__factory.connect(BaseAddresses.TETU_TOKEN, this.signer).balanceOf(this.core.controller.address);
      expect(ctrlBal.gt(this.controllerLastBalance)).eq(true);
    }
  }


}
