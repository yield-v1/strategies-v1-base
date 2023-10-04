import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {BaseAddresses} from "../../../../scripts/addresses/BaseAddresses";
import {DeployInfo} from "../../DeployInfo";
import {StrategyTestUtils} from "../../StrategyTestUtils";
import {SpecificStrategyTest} from "../../SpecificStrategyTest";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {CoreContractsWrapper} from "../../../CoreContractsWrapper";
import {DeployerUtilsLocal} from "../../../../scripts/deploy/DeployerUtilsLocal";
import {ToolsContractsWrapper} from "../../../ToolsContractsWrapper";
import {universalStrategyTest} from "../../UniversalStrategyTest";
import {BalancerBPTSpecificHardWork} from "./BalancerBPTSpecificHardWork";
import {ISmartVault, IStrategy, StrategyBalancerBPT__factory} from "../../../../typechain";
import {Misc} from "../../../../scripts/utils/tools/Misc";
import {UtilsBalancerGaugeV2} from "../../../baseUtils/balancer/utilsBalancerGaugeV2";


const {expect} = chai;
chai.use(chaiAsPromised);

describe.skip('BalancerBPT_TETU_boostedStables_Test', async () => {
  const deployInfo: DeployInfo = new DeployInfo();
  before(async function () {
    await StrategyTestUtils.deployCoreAndInit(deployInfo, true);
  });


  // **********************************************
  // ************** CONFIG*************************
  // **********************************************
  const strategyContractName = 'StrategyBalancerBPT';
  const vaultName = "TetuBoostedStables";
  const underlying = BaseAddresses.BALANCER_USD_TETU_BOOSTED;
  const poolId = BaseAddresses.BALANCER_USD_TETU_BOOSTED_ID;
  const gauge = BaseAddresses.BALANCER_USD_TETU_BOOSTED_GAUGE;
  const depositToken = BaseAddresses.bb_t_USDC_TOKEN;
  const buybackRatio = 8_00;

  // const underlying = token;
  // add custom liquidation path if necessary
  const forwarderConfigurator = null;
  // only for strategies where we expect PPFS fluctuations
  const ppfsDecreaseAllowed = false;
  // only for strategies where we expect PPFS fluctuations
  const balanceTolerance = 0;
  const finalBalanceTolerance = 0;
  const deposit = 100_000;
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
      vaultName,
      async vaultAddress => {
        const strategy = await DeployerUtilsLocal.deployStrategyProxy(
          signer,
          strategyContractName,
        );
        const strat = await StrategyBalancerBPT__factory.connect(strategy.address, signer);
        await strat.initialize(
          core.controller.address,
          vaultAddress,
          depositToken,
          poolId,
          gauge,
          buybackRatio
        );

        // Set up BalancerGauge. Register TETU as reward token in the GAUGE and in the strategy
        await UtilsBalancerGaugeV2.registerRewardTokens(signer, await strat.gauge(), BaseAddresses.TETU_TOKEN);
        await strat.connect(await DeployerUtilsLocal.impersonate(await strat.controller())).setRewardTokens([BaseAddresses.TETU_TOKEN]);
        await UtilsBalancerGaugeV2.depositRewardTokens(signer, await strat.gauge(), await strat.rewardTokens());

        return strategy;
      },
      underlying,
      0,
      true
    );
  };
  const hwInitiator = (
    _signer: SignerWithAddress,
    _user: SignerWithAddress,
    _core: CoreContractsWrapper,
    _tools: ToolsContractsWrapper,
    _underlying: string,
    _vault: ISmartVault,
    _strategy: IStrategy,
    _balanceTolerance: number
  ) => {
    const hw = new BalancerBPTSpecificHardWork(
      _signer,
      _user,
      _core,
      _tools,
      _underlying,
      _vault,
      _strategy,
      _balanceTolerance,
      finalBalanceTolerance,
    );
    hw.vaultRt = Misc.ZERO_ADDRESS;
    return hw;
  };

  await universalStrategyTest(
    strategyContractName + vaultName,
    deployInfo,
    deployer,
    hwInitiator,
    forwarderConfigurator,
    ppfsDecreaseAllowed,
    balanceTolerance,
    deposit,
    loops,
    loopValue,
    advanceBlocks,
    specificTests,
  );

});
