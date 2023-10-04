import {DoHardWorkLoopBase} from "../../DoHardWorkLoopBase";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {BaseAddresses} from "../../../../scripts/addresses/BaseAddresses";
import {utils} from "ethers";
import {TokenUtils} from "../../../TokenUtils";
import {StrategyTestUtils} from "../../StrategyTestUtils";
import {
  BalSender__factory,
  IERC20__factory,
  StrategyBalBridgedStaking__factory
} from "../../../../typechain";

const {expect} = chai;
chai.use(chaiAsPromised);


export class BalBridgedStakingDoHardWork extends DoHardWorkLoopBase {

  public async loopStartActions(i: number) {
    await super.loopStartActions(i);
    const ppfsBefore = await this.vault.getPricePerFullShare();
    console.log('ppfs before transfer', ppfsBefore.toString());
    await TokenUtils.getToken(BaseAddresses.BAL_TOKEN, this.strategy.address, utils.parseUnits('1000'))
    const ppfsAfter = await this.vault.getPricePerFullShare();
    console.log('ppfs after transfer', ppfsAfter.toString());
    expect(ppfsBefore).is.eq(ppfsAfter);
  }


  public async loopEndActions(i: number) {
    console.log('loopEndActions - no withdraw actions')

    const senderAdr = await StrategyBalBridgedStaking__factory.connect(this.strategy.address, this.signer).balSender();
    const sender = BalSender__factory.connect(senderAdr, this.signer);
    await sender.withdrawAll();
    // need to call again coz only one token per tx
    await sender.withdrawAll();
    expect(await TokenUtils.balanceOf(BaseAddresses.BALANCER_BAL_ETH_POOL, senderAdr)).is.eq(0);
    expect(await TokenUtils.balanceOf(BaseAddresses.BAL_TOKEN, senderAdr)).is.eq(0);
    expect(await TokenUtils.balanceOf(BaseAddresses.WETH_TOKEN, senderAdr)).is.eq(0);

    const xBAL = '0x1AB27A11A5A932e415067f6f20a65245Bd47E4D1';
    expect(await IERC20__factory.connect(xBAL, this.signer).balanceOf(this.core.fundKeeper.address)).above(0);
  }

  protected async postLoopCheck() {
    await this.vault.doHardWork();

    await this.vault.connect(this.signer).getAllRewards();
    await this.vault.connect(this.user).getAllRewards();

    // strategy should not contain any tokens in the end
    const stratRtBalances = await StrategyTestUtils.saveStrategyRtBalances(this.strategy);
    for (const rtBal of stratRtBalances) {
      expect(rtBal).is.eq(0, 'Strategy contains not liquidated rewards');
    }

    // check vault balance
    // const vaultBalanceAfter = await TokenUtils.balanceOf(this.vaultRt, this.vault.address);
    // expect(vaultBalanceAfter.sub(this.vaultRTBal)).is.not.eq("0", "vault reward should increase");

    // check ps vedist
    // const veDistAfter = await IERC20__factory.connect(this.core.rewardToken.address, this.signer).balanceOf(BaseAddresses.TETU_VE_DIST_ADDRESS);
    // expect(veDistAfter.sub(this.veDistBal)).is.not.eq("0", "ps share price should increase");

    // check reward for user
    // const rewardBalanceAfter = await TokenUtils.balanceOf(this.vaultRt, this.user.address);
    // expect(rewardBalanceAfter.sub(this.userRTBal).toString())
    //   .is.not.eq("0", "should have earned xTETU rewards");
  }

}
