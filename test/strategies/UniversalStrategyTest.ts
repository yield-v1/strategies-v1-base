import { ethers } from 'hardhat';
import { TimeUtils } from '../TimeUtils';
import { DeployerUtilsLocal } from '../../scripts/deploy/DeployerUtilsLocal';
import { StrategyTestUtils } from './StrategyTestUtils';
import { IERC20Extended__factory, ISmartVault, IStrategy } from '../../typechain';
import { Misc } from '../../scripts/utils/tools/Misc';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { CoreContractsWrapper } from '../CoreContractsWrapper';
import { DoHardWorkLoopBase } from './DoHardWorkLoopBase';
import { DeployInfo } from './DeployInfo';
import { SpecificStrategyTest } from './SpecificStrategyTest';
import { BigNumber } from 'ethers';
import { TokenUtils } from '../TokenUtils';
import { parseUnits } from 'ethers/lib/utils';

async function universalStrategyTest(
  name: string,
  deployInfo: DeployInfo,
  deployer: (signer: SignerWithAddress) => Promise<[ISmartVault, IStrategy, string]>,
  hardworkInitiator: (
    signer: SignerWithAddress,
    user: SignerWithAddress,
    core: CoreContractsWrapper,
    underlying: string,
    vault: ISmartVault,
    strategy: IStrategy,
    balanceTolerance: number,
  ) => DoHardWorkLoopBase,
  ppfsDecreaseAllowed = false,
  balanceTolerance = 0,
  deposit = 100_000,
  loops = 9,
  loopValue = 300,
  advanceBlocks = true,
  specificTests: SpecificStrategyTest[] | null = null,
) {

  describe(name + '_Test', async function() {
    console.log(name + ' tests start');
    let snapshotBefore: string;
    let snapshot: string;
    let signer: SignerWithAddress;
    let user: SignerWithAddress;
    let underlying: string;
    let vault: ISmartVault;
    let strategy: IStrategy;
    let userBalance: BigNumber;

    before(async function() {
      const start = Date.now();
      snapshotBefore = await TimeUtils.snapshot();
      signer = await DeployerUtilsLocal.impersonate();
      user = (await ethers.getSigners())[1];
      const core = deployInfo.core as CoreContractsWrapper;

      const data = await deployer(signer);
      vault = data[0];
      strategy = data[1];
      underlying = await vault.underlying();

      if (ppfsDecreaseAllowed) {
        await vault.changePpfsDecreaseAllowed(true);
      }

      // set class variables for keep objects links
      deployInfo.signer = signer;
      deployInfo.user = user;
      deployInfo.underlying = underlying;
      deployInfo.vault = vault;
      deployInfo.strategy = strategy;

      // get underlying
      const decimals = (await IERC20Extended__factory.connect(underlying, signer).decimals());
      await TokenUtils.getToken(underlying, signer.address, parseUnits(deposit.toFixed(decimals), decimals));
      await TokenUtils.getToken(underlying, user.address, parseUnits(deposit.toFixed(decimals), decimals));
      userBalance = await TokenUtils.balanceOf(underlying, signer.address);


      await core.controller.changeWhiteListStatus([signer.address, user.address], true);

      Misc.printDuration('Test Preparations completed', start);
    });

    beforeEach(async function() {
      snapshot = await TimeUtils.snapshot();
    });

    afterEach(async function() {
      await TimeUtils.rollback(snapshot);
    });

    after(async function() {
      await TimeUtils.rollback(snapshotBefore);
    });

    it('doHardWork loop', async function() {
      const core = deployInfo.core as CoreContractsWrapper;
      await hardworkInitiator(
        signer,
        user,
        core,
        underlying,
        vault,
        strategy,
        balanceTolerance,
      ).start(userBalance, loops, loopValue, advanceBlocks);
    });

    it('common test should be ok', async() => {
      await StrategyTestUtils.commonTests(strategy, underlying);
    });

    if (specificTests) {
      specificTests?.forEach(test => test.do(deployInfo));
    }
  });
}

export { universalStrategyTest };
