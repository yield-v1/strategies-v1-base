import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {BaseAddresses} from "../../../../scripts/addresses/BaseAddresses";
import {config as dotEnvConfig} from "dotenv";
import {StrategyTestUtils} from "../../StrategyTestUtils";
import {DeployInfo} from "../../DeployInfo";
import {SpecificStrategyTest} from "../../SpecificStrategyTest";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {CoreContractsWrapper} from "../../../CoreContractsWrapper";
import {DeployerUtilsLocal} from "../../../../scripts/deploy/DeployerUtilsLocal";
import {IStrategy, ISmartVault, ISmartVault__factory, StrategyQiStaking} from "../../../../typechain";
import {ToolsContractsWrapper} from "../../../ToolsContractsWrapper";
import {universalStrategyTest} from "../../UniversalStrategyTest";
import {QiStakingDoHardWork} from "./QiStakingDoHardWork";

dotEnvConfig();
// tslint:disable-next-line:no-var-requires
const argv = require('yargs/yargs')()
  .env('TETU')
  .options({
    disableStrategyTests: {
      type: "boolean",
      default: false,
    },
    deployCoreContracts: {
      type: "boolean",
      default: false,
    },
    hardhatChainId: {
      type: "number",
      default: 137
    },
  }).argv;

const {expect} = chai;
chai.use(chaiAsPromised);

describe.skip('Qi staking tests', async () => {
  if (argv.disableStrategyTests || argv.hardhatChainId !== 137) {
    return;
  }
  const strategyName = 'StrategyQiStaking';
  const underlying = BaseAddresses.QI_TOKEN;

  const deployInfo: DeployInfo = new DeployInfo();
  before(async function () {
    await StrategyTestUtils.deployCoreAndInit(deployInfo, argv.deployCoreContracts);
  });

  // **********************************************
  // ************** CONFIG*************************
  // **********************************************
  const strategyContractName = strategyName;
  const vaultName = 'tetuQi';

  // only for strategies where we expect PPFS fluctuations
  const ppfsDecreaseAllowed = false;
  // only for strategies where we expect PPFS fluctuations
  const balanceTolerance = 0;
  const finalBalanceTolerance = 0;
  const deposit = 100_000;
  // at least 3
  const loops = 3;
  // number of blocks or timestamp value
  const loopValue = 300;
  // use 'true' if farmable platform values depends on blocks, instead you can use timestamp
  const advanceBlocks = true;
  const specificTests: SpecificStrategyTest[] = [];
  // **********************************************

  const deployer = async (signer: SignerWithAddress) => {
    const core = deployInfo.core as CoreContractsWrapper;
    const data = await StrategyTestUtils.deploy(
      signer,
      core,
      vaultName,
      async vaultAddress => {
        const strategy = await DeployerUtilsLocal.deployStrategyProxy(
          signer,
          strategyContractName,
        ) as StrategyQiStaking;
        await strategy.initialize(core.controller.address, vaultAddress);
        return strategy;
      },
      underlying
    );
    await ISmartVault__factory.connect(data[0].address, signer).changeDoHardWorkOnInvest(true);
    await ISmartVault__factory.connect(data[0].address, signer).changeAlwaysInvest(true);
    // await core.vaultController.addRewardTokens([data[0].address], data[0].address);
    await core.controller.setRewardDistribution([data[1].address], true);
    return data;
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
    return new QiStakingDoHardWork(
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

  await universalStrategyTest(
    strategyName + vaultName,
    deployInfo,
    deployer,
    hwInitiator,
    null,
    ppfsDecreaseAllowed,
    balanceTolerance,
    deposit,
    loops,
    loopValue,
    advanceBlocks,
    specificTests,
  );
});
