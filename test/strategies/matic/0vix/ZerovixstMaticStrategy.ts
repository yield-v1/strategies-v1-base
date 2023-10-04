import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {universalStrategyTest} from "../../UniversalStrategyTest";
import {DeployInfo} from "../../DeployInfo";
import {StrategyTestUtils} from "../../StrategyTestUtils";
import {
  IOvixChainLinkOracleV2,
  ISmartVault,
  IStrategy,
  ITetuLiquidator__factory,
  ITetuLiquidatorController__factory,
  ZerovixstMaticStrategy__factory,
} from "../../../../typechain";
import {DeployerUtilsLocal} from "../../../../scripts/deploy/DeployerUtilsLocal";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {CoreContractsWrapper} from "../../../CoreContractsWrapper";
import {ToolsContractsWrapper} from "../../../ToolsContractsWrapper";
import {BaseAddresses} from "../../../../scripts/addresses/BaseAddresses";
import {ethers} from "hardhat";
import {HardWorkForZerovixstMatic} from "./HardWorkForZerovixstMatic";
import {parseUnits} from "ethers/lib/utils";

chai.use(chaiAsPromised);

// todo fix!
describe.skip('Zerovix stMATIC tests', async () => {
  const deployInfo: DeployInfo = new DeployInfo();

  before(async function () {
    await StrategyTestUtils.deployCoreAndInit(deployInfo, false);
    if (deployInfo.core) {
      const signer = await DeployerUtilsLocal.impersonate();
      const liquidator = ITetuLiquidator__factory.connect(await deployInfo.core.feeRewardForwarder.liquidator(), signer)
      const liquidatorController = ITetuLiquidatorController__factory.connect(await liquidator.controller(), signer)
      const gov = await DeployerUtilsLocal.impersonate(await liquidatorController.governance())
      /*await liquidator.connect(gov).addLargestPools([{
          pool: BaseAddresses.BALANCER_stMATIC_MATIC,
          swapper: '0xc43e971566B8CCAb815C3E20b9dc66571541CeB4',
          tokenIn: BaseAddresses.stMATIC,
          tokenOut: BaseAddresses.WMATIC_TOKEN,
      }], true)*/
      // await liquidator.connect(gov).addLargestPools([{
      //     pool: '0x59db5eA66958b19641b6891Fc373B44b567ea15C', // univ3 stMATIC-WMATIC 0.01%
      //     swapper: '0x7b505210a0714d2a889E41B59edc260Fa1367fFe',
      //     tokenIn: BaseAddresses.stMATIC_TOKEN,
      //     tokenOut: BaseAddresses.WMATIC_TOKEN,
      // }], true)
    }
  });

  // **********************************************
  // ************** CONFIG*************************
  // **********************************************
  const strategyContractName = 'ZerovixstMaticStrategy';
  const vaultName = "ZerovixstMaticStrategy_vault";
  const oToken = BaseAddresses.ZEROVIX_ostMATIC
  const underlying = BaseAddresses.stMATIC_TOKEN;
  const buyBackRatio = 50_00;
  const forwarderConfigurator = null;
  // only for strategies where we expect PPFS fluctuations
  const ppfsDecreaseAllowed = true;
  // only for strategies where we expect PPFS fluctuations
  const balanceTolerance = 0;
  const finalBalanceTolerance = 0;
  const deposit = 1_000_000;
  // at least 3
  const loops = 3;
  // number of blocks or timestamp value
  const loopValue = 60 * 60 * 24;
  // use 'true' if farmable platform values depends on blocks, instead you can use timestamp
  const advanceBlocks = false;
  const specificTests = null;
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
        await ZerovixstMaticStrategy__factory.connect(strategy.address, signer).initialize(
          core.controller.address,
          vaultAddress,
          buyBackRatio
        );

        const oracle = (await ethers.getContractAt('IOvixChainLinkOracleV2', BaseAddresses.ZEROVIX_ORACLE)) as IOvixChainLinkOracleV2
        const admin = await DeployerUtilsLocal.impersonate(await oracle.admin())
        await oracle.connect(admin).setHeartbeat(oToken, '1000000000')
        const gov = await DeployerUtilsLocal.impersonate(await core.controller.governance())
        await core.feeRewardForwarder.connect(gov).setTokenThreshold(underlying, parseUnits('0.000001'))

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
    return new HardWorkForZerovixstMatic(
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
  };

  universalStrategyTest(
    `${strategyContractName} ${vaultName}`,
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
})

