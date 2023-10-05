import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { DeployInfo } from './DeployInfo';
import { BaseAddresses } from '../../scripts/addresses/BaseAddresses';
import { CurveStrategyCbEthEth__factory, ISmartVault, IStrategy } from '../../typechain';
import { StrategyTestUtils } from './StrategyTestUtils';
import { SpecificStrategyTest } from './SpecificStrategyTest';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { CoreContractsWrapper } from '../CoreContractsWrapper';
import { DeployerUtilsLocal } from '../../scripts/deploy/DeployerUtilsLocal';
import { universalStrategyTest } from './UniversalStrategyTest';
import { DoHardWorkLoopBase } from './DoHardWorkLoopBase';

chai.use(chaiAsPromised);

describe('Curve CurveStrategyCbEthEth tests', async() => {
  const underlying = BaseAddresses.CURVE_CB_ETH_ETH_LP_TOKEN;
  const strategyContractName = 'CurveStrategyCbEthEth';

  const deployInfo: DeployInfo = new DeployInfo();
  before(async function() {
    await StrategyTestUtils.deployCoreAndInit(deployInfo, false);
  });

  // only for strategies where we expect PPFS fluctuations
  const ppfsDecreaseAllowed = false;
  // only for strategies where we expect PPFS fluctuations
  const balanceTolerance = 0;
  const finalBalanceTolerance = 0;
  const deposit = 1_000;
  // at least 3
  const loops = 3;
  const loopValue = 300;
  const advanceBlocks = false;
  const specificTests: SpecificStrategyTest[] = [];
  // **********************************************

  const deployer = (signer: SignerWithAddress) => {
    const core = deployInfo.core as CoreContractsWrapper;
    return StrategyTestUtils.deploy(
      signer,
      core,
      'test vault',
      async vaultAddress => {
        const strategy = await DeployerUtilsLocal.deployStrategyProxy(
          signer,
          strategyContractName,
        );
        await CurveStrategyCbEthEth__factory.connect(strategy.address, signer).initialize(
          core.controller.address,
          vaultAddress,
          core.announcer.address,
          BaseAddresses.CURVE_CB_ETH_ETH_GAUGE,
          BaseAddresses.WETH_TOKEN,
        );

        return strategy;
      },
      underlying,
      0,
    );
  };
  const hwInitiator = (
    _signer: SignerWithAddress,
    _user: SignerWithAddress,
    _core: CoreContractsWrapper,
    _underlying: string,
    _vault: ISmartVault,
    _strategy: IStrategy,
    _balanceTolerance: number,
  ) => {
    const hw = new DoHardWorkLoopBase(
      _signer,
      _user,
      _core,
      _underlying,
      _vault,
      _strategy,
      _balanceTolerance,
      finalBalanceTolerance,
    );
    return hw;
  };


  await universalStrategyTest(
    strategyContractName,
    deployInfo,
    deployer,
    hwInitiator,
    ppfsDecreaseAllowed,
    balanceTolerance,
    deposit,
    loops,
    loopValue,
    advanceBlocks,
    specificTests,
  );

});
