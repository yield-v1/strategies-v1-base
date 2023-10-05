import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { CoreContractsWrapper } from '../CoreContractsWrapper';
import { ISmartVault, IStrategy } from '../../typechain';
import { TokenUtils } from '../TokenUtils';
import { BigNumber, utils } from 'ethers';
import { Misc } from '../../scripts/utils/tools/Misc';
import { VaultUtils, XTETU_NO_INCREASE } from '../VaultUtils';
import { TimeUtils } from '../TimeUtils';
import { expect } from 'chai';
import { formatUnits } from 'ethers/lib/utils';


export class DoHardWorkLoopBase {

  public readonly signer: SignerWithAddress;
  public readonly user: SignerWithAddress;
  public readonly core: CoreContractsWrapper;
  public readonly underlying: string;
  public readonly vault: ISmartVault;
  public readonly strategy: IStrategy;
  public readonly balanceTolerance: number;
  public readonly finalBalanceTolerance: number;
  vaultForUser: ISmartVault;
  undDec = 0;
  userDeposited = BigNumber.from(0);
  signerDeposited = BigNumber.from(0);
  userWithdrew = BigNumber.from(0);
  userRTBal = BigNumber.from(0);
  vaultRTBal = BigNumber.from(0);
  veDistBal = BigNumber.from(0);

  loops = 0;
  loopStartTs = 0;
  startTs = 0;
  bbRatio = 0;
  isUserDeposited = true;
  stratEarnedTotal = BigNumber.from(0);
  stratEarned = BigNumber.from(0);
  vaultPPFS = BigNumber.from(0);
  priceCache = new Map<string, BigNumber>();
  totalToClaimInTetuN = 0;
  toClaimCheckTolerance = 0.3;
  allowLittleDustInStrategyAfterFullExit = BigNumber.from(0);

  constructor(
    signer: SignerWithAddress,
    user: SignerWithAddress,
    core: CoreContractsWrapper,
    underlying: string,
    vault: ISmartVault,
    strategy: IStrategy,
    balanceTolerance: number,
    finalBalanceTolerance: number,
  ) {
    this.signer = signer;
    this.user = user;
    this.core = core;
    this.underlying = underlying;
    this.vault = vault;
    this.strategy = strategy;
    this.balanceTolerance = balanceTolerance;
    this.finalBalanceTolerance = finalBalanceTolerance;

    this.vaultForUser = vault.connect(user);
  }

  public async start(deposit: BigNumber, loops: number, loopValue: number, advanceBlocks: boolean) {
    const start = Date.now();
    this.loops = loops;
    this.userDeposited = deposit;
    await this.init();
    await this.initialCheckVault();
    await this.enterToVault();
    await this.initialSnapshot();
    await this.loop(loops, loopValue, advanceBlocks);
    await this.postLoopCheck();
    Misc.printDuration('HardWork test finished', start);
  }

  protected async init() {
    this.undDec = await TokenUtils.decimals(this.underlying);
    // this.vaultRt = (await this.vault.rewardTokens())[0].toLowerCase()
  }

  protected async initialCheckVault() {

  }

  protected async initialSnapshot() {
    console.log('>>>initialSnapshot start');

    this.startTs = await Misc.getBlockTsFromChain();
    console.log('initialSnapshot end');
  }

  // signer and user enter to the vault
  // we should have not zero balance if user exit the vault for properly check
  protected async enterToVault() {
    console.log('--- Enter to vault');
    // initial deposit from signer
    await VaultUtils.deposit(this.signer, this.vault, this.userDeposited.div(2));
    console.log('enterToVault: deposited for signer');
    this.signerDeposited = this.userDeposited.div(2);
    await VaultUtils.deposit(this.user, this.vault, this.userDeposited);
    console.log('enterToVault: deposited for user');
    await this.userCheckBalanceInVault();

    // remove excess tokens
    const excessBalUser = await TokenUtils.balanceOf(this.underlying, this.user.address);
    if (!excessBalUser.isZero()) {
      await TokenUtils.transfer(this.underlying, this.user, this.core.announcer.address, excessBalUser.toString());
    }
    const excessBalSigner = await TokenUtils.balanceOf(this.underlying, this.signer.address);
    if (!excessBalSigner.isZero()) {
      await TokenUtils.transfer(
        this.underlying,
        this.signer,
        this.core.announcer.address,
        excessBalSigner.toString(),
      );
    }
    console.log('--- Enter to vault end');
  }

  protected async loopStartActions(i: number) {
    const start = Date.now();
    if (i > 1) {
      const den = (await this.core.controller.psDenominator()).toNumber();
      const newNum = +(den / i).toFixed();
      console.log('new ps ratio', newNum, den);
      await this.core.announcer.announceRatioChange(9, newNum, den);
      await TimeUtils.advanceBlocksOnTs(60 * 60 * 48);
      await this.core.controller.setPSNumeratorDenominator(newNum, den);
    }
    Misc.printDuration('fLoopStartActionsDefault completed', start);
  }

  protected async loopStartSnapshot() {
    console.log('try to make snapshot');
    this.loopStartTs = await Misc.getBlockTsFromChain();
    this.vaultPPFS = await this.vault.getPricePerFullShare();
    this.stratEarnedTotal = await this.strategyEarned();
    console.log('snapshot end');
  }

  protected async loopEndCheck() {
    // ** check to claim
    if (!XTETU_NO_INCREASE.has(await this.strategy.STRATEGY_NAME()) && this.totalToClaimInTetuN !== 0 &&
      this.bbRatio !== 0) {
      const earnedN = +utils.formatUnits(this.stratEarned);
      const earnedNAdjusted = earnedN / (this.bbRatio / 10000);
      expect(earnedNAdjusted).is.greaterThanOrEqual(this.totalToClaimInTetuN * this.toClaimCheckTolerance); // very approximately
    }
  }

  protected async userCheckBalanceInVault() {
    // assume that at this point we deposited all expected amount except userWithdrew amount
    const userBalance = await this.vault.underlyingBalanceWithInvestmentForHolder(this.user.address);
    // avoid rounding errors
    const userBalanceN = +utils.formatUnits(userBalance.add(1), this.undDec);
    const userBalanceExpectedN = +utils.formatUnits(this.userDeposited.sub(this.userWithdrew), this.undDec);

    console.log('User balance +-:', DoHardWorkLoopBase.toPercent(userBalanceN, userBalanceExpectedN));
    expect(userBalanceN).is.greaterThanOrEqual(
      userBalanceExpectedN - (userBalanceExpectedN * this.balanceTolerance),
      'User has wrong balance inside the vault.\n' +
      'If you expect not zero balance it means the vault has a nature of PPFS decreasing.\n' +
      'It is not always wrong but you should triple check behavior and reasonable tolerance value.\n' +
      'If you expect zero balance and it has something inside IT IS NOT GOOD!\n',
    );
  }

  protected async userCheckBalance(expectedBalance: BigNumber) {
    const userUndBal = await TokenUtils.balanceOf(this.underlying, this.user.address);
    const userUndBalN = +utils.formatUnits(userUndBal, this.undDec);
    const userBalanceExpectedN = +utils.formatUnits(expectedBalance, this.undDec);
    console.log('User balance +-:', DoHardWorkLoopBase.toPercent(userUndBalN, userBalanceExpectedN));
    expect(userUndBalN).is.greaterThanOrEqual(
      userBalanceExpectedN - (userBalanceExpectedN * this.balanceTolerance),
      'User has not enough balance',
    );
  }

  protected async withdraw(exit: boolean, amount: BigNumber, check = true) {
    // no actions if zero balance
    if ((await TokenUtils.balanceOf(this.vault.address, this.user.address)).isZero()) {
      return;
    }
    console.log('PPFS before withdraw', (await this.vault.getPricePerFullShare()).toString());
    await this.userCheckBalanceInVault();
    const balBefore = await TokenUtils.balanceOf(this.underlying, this.user.address);
    if (exit) {
      console.log('Full Exit from vault for user');
      const expectedOutput = await this.vaultForUser.underlyingBalanceWithInvestmentForHolder(this.user.address);

      await this.vaultForUser.exit({ gasLimit: 10_000_000 });

      const balAfter = await TokenUtils.balanceOf(this.underlying, this.user.address);
      console.log('Withdrew expected', formatUnits(expectedOutput, this.undDec));
      console.log('Withdrew actual', formatUnits(balAfter.sub(balBefore), this.undDec));
      if (check) {
        expect(expectedOutput.sub(balAfter.sub(balBefore)).toNumber())
          .below(10, 'withdrew lower than expected');
      }

      await this.userCheckBalance(this.userDeposited);
      this.userWithdrew = this.userDeposited;
    } else {
      const userUndBal = await TokenUtils.balanceOf(this.underlying, this.user.address);

      this.vaultForUser.underlyingBalanceWithInvestmentForHolder(this.user.address);
      const totalDeposited = await this.vaultForUser.underlyingBalanceWithInvestmentForHolder(this.user.address);
      const totalShares = await TokenUtils.balanceOf(this.vault.address, this.user.address);
      const expectedOutput = amount.mul(totalDeposited).div(totalShares);

      console.log('Withdraw for user, amount', amount.toString());
      await this.vaultForUser.withdraw(amount, { gasLimit: 10_000_000 });

      const balAfter = await TokenUtils.balanceOf(this.underlying, this.user.address);
      console.log('Withdrew expected', formatUnits(expectedOutput, this.undDec));
      console.log('Withdrew actual', formatUnits(balAfter.sub(balBefore), this.undDec));
      if (check) {
        expect(expectedOutput.sub(balAfter.sub(balBefore)).toNumber())
          .below(10, 'withdrew lower than expected');
      }

      await this.userCheckBalance(this.userWithdrew.add(amount));
      const userUndBalAfter = await TokenUtils.balanceOf(this.underlying, this.user.address);
      this.userWithdrew = this.userWithdrew.add(userUndBalAfter.sub(userUndBal));
    }
    console.log('userWithdrew', this.userWithdrew.toString());
    console.log('PPFS after withdraw', (await this.vault.getPricePerFullShare()).toString());
  }

  // don't use for initial deposit
  protected async deposit(amount: BigNumber, invest: boolean) {
    console.log('PPFS before deposit', (await this.vault.getPricePerFullShare()).toString());
    await VaultUtils.deposit(this.user, this.vault, amount, invest);
    this.userWithdrew = this.userWithdrew.sub(amount);
    console.log('userWithdrew', this.userWithdrew.toString());
    await this.userCheckBalanceInVault();
    console.log('PPFS after deposit', (await this.vault.getPricePerFullShare()).toString());
  }

  protected async loopEndActions(i: number) {
    const start = Date.now();
    // we need to enter and exit from the vault between loops for properly check all mechanic
    if (this.isUserDeposited && i % 2 === 0) {
      this.isUserDeposited = false;
      if (i % 4 === 0) {
        await this.withdraw(true, BigNumber.from(0));
      } else {
        const userXTokenBal = await TokenUtils.balanceOf(this.vault.address, this.user.address);
        const toWithdraw = BigNumber.from(userXTokenBal).mul(95).div(100);
        await this.withdraw(false, toWithdraw);
      }

    } else if (!this.isUserDeposited && i % 2 !== 0) {
      this.isUserDeposited = true;
      const uBal = await TokenUtils.balanceOf(this.underlying, this.user.address);
      await this.deposit(BigNumber.from(uBal).div(3), false);
      await this.deposit(BigNumber.from(uBal).div(3), true);
    }
    Misc.printDuration('fLoopEndActions completed', start);
  }

  protected async afterBlockAdvance() {
    const start = Date.now();
    // ** calculate to claim
    this.totalToClaimInTetuN = 0;

    Misc.printDuration('fAfterBlocAdvance completed', start);
  }

  protected async doHardWork() {
    await VaultUtils.doHardWorkAndCheck(this.vault);
  }

  protected async loop(loops: number, loopValue: number, advanceBlocks: boolean) {
    for (let i = 0; i < loops; i++) {
      const start = Date.now();
      await this.loopStartActions(i);
      await this.loopStartSnapshot();

      // *********** DO HARD WORK **************
      if (advanceBlocks) {
        await TimeUtils.advanceNBlocks(loopValue);
      } else {
        await TimeUtils.advanceBlocksOnTs(loopValue);
      }
      await this.afterBlockAdvance();
      await this.doHardWork();
      await this.loopEndCheck();
      await this.loopEndActions(i);
      Misc.printDuration(i + ' Loop ended', start);
    }
  }

  protected async postLoopCheck() {
    console.log('/// LOOPS ENDED, check statuses...');
    // wait enough time for get rewards for liquidation
    // we need to have strategy without rewards tokens in the end
    await TimeUtils.advanceNBlocks(300);

    await this.withdraw(true, BigNumber.from(0), false);
    // exit for signer
    await this.vault.connect(this.signer).exit({ gasLimit: 10_000_000 });
    await this.strategy.withdrawAllToVault({ gasLimit: 10_000_000 });

    // need to call hard work for sell a little excess rewards
    await this.strategy.doHardWork({ gasLimit: 10_000_000 });


    const userDepositedN = +utils.formatUnits(this.userDeposited, this.undDec);
    // some pools have auto compounding so user balance can increase
    const userUnderlyingBalanceAfter = await TokenUtils.balanceOf(this.underlying, this.user.address);
    const userUnderlyingBalanceAfterN = +utils.formatUnits(userUnderlyingBalanceAfter, this.undDec);
    const userBalanceExpected = userDepositedN - (userDepositedN * this.finalBalanceTolerance);
    console.log('User final balance +-: ', DoHardWorkLoopBase.toPercent(userUnderlyingBalanceAfterN, userDepositedN));
    expect(userUnderlyingBalanceAfterN).is.greaterThanOrEqual(userBalanceExpected, 'user should have more underlying');

    const signerDepositedN = +utils.formatUnits(this.signerDeposited, this.undDec);
    const signerUnderlyingBalanceAfter = await TokenUtils.balanceOf(this.underlying, this.signer.address);
    const signerUnderlyingBalanceAfterN = +utils.formatUnits(signerUnderlyingBalanceAfter, this.undDec);
    const signerBalanceExpected = signerDepositedN - (signerDepositedN * this.finalBalanceTolerance);
    console.log(
      'Signer final balance +-: ',
      DoHardWorkLoopBase.toPercent(signerUnderlyingBalanceAfterN, signerDepositedN),
    );
    expect(signerUnderlyingBalanceAfterN)
      .is
      .greaterThanOrEqual(signerBalanceExpected, 'signer should have more underlying');

    if (this.allowLittleDustInStrategyAfterFullExit.isZero()) {
      expect(await this.strategy.investedUnderlyingBalance()).is.eq(0);
    } else {
      expect((await this.strategy.investedUnderlyingBalance())).is.below(this.allowLittleDustInStrategyAfterFullExit);
    }
  }

  private async strategyEarned() {
    let result = BigNumber.from(0);
    return result;
  }

  protected static toPercent(actual: number, expected: number): string {
    const percent = (actual / expected * 100) - 100;
    return percent.toFixed(6) + '%';
  }
}
