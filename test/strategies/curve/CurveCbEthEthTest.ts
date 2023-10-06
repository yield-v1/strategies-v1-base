import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { DeployInfo } from '../DeployInfo';
import { BaseAddresses } from '../../../scripts/addresses/BaseAddresses';
import {
  CurveStrategyCbEthEth__factory,
  IController__factory,
  ISmartVault,
  IStrategy,
  ITetuLiquidator__factory,
} from '../../../typechain';
import { StrategyTestUtils } from '../StrategyTestUtils';
import { SpecificStrategyTest } from '../SpecificStrategyTest';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { CoreContractsWrapper } from '../../CoreContractsWrapper';
import { DeployerUtilsLocal } from '../../../scripts/deploy/DeployerUtilsLocal';
import { universalStrategyTest } from '../UniversalStrategyTest';
import { DoHardWorkLoopBase } from '../DoHardWorkLoopBase';
import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';

chai.use(chaiAsPromised);

describe('Curve CurveStrategyCbEthEth tests', async() => {
  const underlying = BaseAddresses.CURVE_CB_ETH_ETH_LP_TOKEN;
  const strategyContractName = 'CurveStrategyCbEthEth';
  const KIND_OF_POOL = 0;

  const deployInfo: DeployInfo = new DeployInfo();
  before(async function() {
    await StrategyTestUtils.deployCoreAndInit(deployInfo, false);

    // setup liquidation paths

    const c = await ITetuLiquidator__factory.connect(BaseAddresses.TETU_LIQUIDATOR, ethers.provider).controller();
    const gov = await IController__factory.connect(c, ethers.provider).governance();
    const signer = await DeployerUtilsLocal.impersonate(gov);
    const liquidator = ITetuLiquidator__factory.connect(BaseAddresses.TETU_LIQUIDATOR, signer);

    await liquidator.addBlueChipsPools([
      {
        pool: BaseAddresses.UNI3_USDbC_ETH_POOL,
        swapper: BaseAddresses.UNI3_SWAPPER,
        tokenIn: BaseAddresses.USDbC_TOKEN,
        tokenOut: BaseAddresses.WETH_TOKEN,
      },
    ], false);


    await liquidator.addLargestPools([
      {
        pool: BaseAddresses.CURVE_4POOL_POOL,
        swapper: BaseAddresses.CURVE128_SWAPPER,
        tokenIn: BaseAddresses.crvUSD_TOKEN,
        tokenOut: BaseAddresses.USDbC_TOKEN,
      },
    ], false);

    // await TokenUtils.getToken(BaseAddresses.crvUSD_TOKEN, signer.address, parseUnits('1'));
    // await IERC20__factory.connect(BaseAddresses.crvUSD_TOKEN, signer).approve(liquidator.address, Misc.MAX_UINT);
    //
    // console.log('try to liquidate');
    // await liquidator.liquidate(BaseAddresses.crvUSD_TOKEN, BaseAddresses.WETH_TOKEN, parseUnits('1'), 5_000);
    //
    // console.log('liquidated');

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
          BaseAddresses.PERF_FEE_RECIPIENT_ADDRESS,
          BaseAddresses.CURVE_CB_ETH_ETH_GAUGE,
          BaseAddresses.WETH_TOKEN,
          KIND_OF_POOL,
        );

        return strategy;
      },
      underlying,
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

    hw.allowLittleDustInStrategyAfterFullExit = BigNumber.from('1605774738321861');

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
