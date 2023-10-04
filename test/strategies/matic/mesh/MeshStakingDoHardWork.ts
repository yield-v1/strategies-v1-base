import {DoHardWorkLoopBase} from "../../DoHardWorkLoopBase";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {BigNumber, utils} from "ethers";
import {TokenUtils} from "../../../TokenUtils";
import {StrategyTestUtils} from "../../StrategyTestUtils";
import {VaultUtils} from "../../../VaultUtils";
import {IERC20__factory, StrategyMeshStaking__factory} from "../../../../typechain";
import {BaseAddresses} from "../../../../scripts/addresses/BaseAddresses";
import {parseUnits} from "ethers/lib/utils";

const {expect} = chai;
chai.use(chaiAsPromised);


export class MeshStakingDoHardWork extends DoHardWorkLoopBase {


  public async loopEndActions(i: number) {
    const strategyBalance = await this.strategy.investedUnderlyingBalance();
    console.log(`>>>> >>>> strategyBalance ${strategyBalance.toString()}`)
    console.log('loopEndActions - no withdraw actions')

    // await TokenUtils.getToken(BaseAddresses.oZEMIT_TOKEN, this.strategy.address, parseUnits('10000'))
    // await StrategyMeshStaking__factory.connect(this.strategy.address, this.signer)
    //   .claimAirdrop(
    //     '0xe93Ff692120e3AD375489373ba3a74Cf106a33fc',
    //     '0xec6f78D5c27F890aF587E90DA1BA37C6B32720b4',
    //     BaseAddresses.oZEMIT_TOKEN,
    //     BaseAddresses.WMATIC_TOKEN
    //   );
  }

  protected async doHardWork() {
    console.log('>>doHardWork')
    const expectedPPFS = 1
    const und = await this.vault.underlying();
    const undDec = await TokenUtils.decimals(und);
    // const ppfs = +utils.formatUnits(await this.vault.getPricePerFullShare(), undDec);
    await VaultUtils.doHardWorkAndCheck(this.vault);
    const ppfsAfter = +utils.formatUnits(await this.vault.getPricePerFullShare(), undDec);
    expect(ppfsAfter).is.eq(expectedPPFS)
  }

  protected async postLoopCheck() {
    console.log('>>postLoopCheck')
    await this.vault.doHardWork();

    await this.vault.connect(this.signer).getAllRewards();
    await this.vault.connect(this.user).getAllRewards();

    // strategy should not contain any tokens in the end
    const stratRtBalances = await StrategyTestUtils.saveStrategyRtBalances(this.strategy);
    // dust
    const maxUndBalAllowed = BigNumber.from(10).pow(this.undDec)
    for (const rtBal of stratRtBalances) {
      expect(rtBal).is.lt(maxUndBalAllowed, 'Strategy contains not more than 1 (dust) liquidated rewards');
    }

    // check vault balance
    const vaultBalanceAfter = await TokenUtils.balanceOf(this.vaultRt, this.vault.address);
    expect(vaultBalanceAfter.sub(this.vaultRTBal)).is.not.eq("0", "vault reward should increase");

    // check ps vedist
    const veDistAfter = await IERC20__factory.connect(this.core.rewardToken.address, this.signer).balanceOf(BaseAddresses.TETU_VE_DIST_ADDRESS);
    expect(veDistAfter.sub(this.veDistBal)).is.not.eq("0", "ps veDist balance should increase");

    // check reward for user
    const rewardBalanceAfter = await TokenUtils.balanceOf(this.vaultRt, this.user.address);
    expect(rewardBalanceAfter.sub(this.userRTBal).toString())
      .is.not.eq("0", "should have earned xTETU rewards");
  }
}
