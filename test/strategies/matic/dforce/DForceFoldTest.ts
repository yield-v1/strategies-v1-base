import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {readFileSync} from "fs";
import {universalStrategyTest} from "../../UniversalStrategyTest";
import {DeployerUtilsLocal} from "../../../../scripts/deploy/DeployerUtilsLocal";
import {StrategyTestUtils} from "../../StrategyTestUtils";
import {IFeeRewardForwarder, ISmartVault, IStrategy} from "../../../../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {CoreContractsWrapper} from "../../../CoreContractsWrapper";
import {ToolsContractsWrapper} from "../../../ToolsContractsWrapper";
import {DeployInfo} from "../../DeployInfo";
import {FoldingDoHardWork} from "../../FoldingDoHardWork";
import {FoldingProfitabilityTest} from "../../FoldingProfitabilityTest";
import {TokenUtils} from "../../../TokenUtils";
import {BaseAddresses} from "../../../../scripts/addresses/BaseAddresses";
import {parseUnits} from "ethers/lib/utils";
import {UniswapUtils} from "../../../UniswapUtils";

const {expect} = chai;
chai.use(chaiAsPromised);

describe.skip('Universal DForce Fold tests', async () => {
  const infos = readFileSync('scripts/utils/download/data/dforce_markets.csv', 'utf8').split(/\r?\n/);
  const deployInfo: DeployInfo = new DeployInfo();

  before(async function () {
    await StrategyTestUtils.deployCoreAndInit(deployInfo, false);
  });

  infos.forEach(info => {
    const strat = info.split(',');

    const idx = strat[0];
    const rTokenName = strat[1];
    const rTokenAddress = strat[2];
    const token = strat[3];
    const tokenName = strat[4];
    const collateralFactor = strat[5];
    const borrowTarget = strat[6];

    if (!idx || idx === 'idx') {
      console.log('skip', idx);
      return;
    }

    // if (idx !== '0') {
    //   return;
    // }

    console.log('Start test strategy', idx, rTokenName);
    // **********************************************
    // ************** CONFIG*************************
    // **********************************************
    const strategyContractName = 'StrategyDForceFold';
    const underlying = token;
    const forwarderConfigurator = null;
    // only for strategies where we expect PPFS fluctuations
    const ppfsDecreaseAllowed = true;
    // only for strategies where we expect PPFS fluctuations
    const balanceTolerance = 0.00001;
    const finalBalanceTolerance = 0.00001;
    const deposit = 100_000;
    // at least 3
    const loops = 15;
    // number of blocks or timestamp value
    const loopValue = 3000;
    // use 'true' if farmable platform values depends on blocks, instead you can use timestamp
    const advanceBlocks = true;
    const specificTests = [new FoldingProfitabilityTest()];
    // **********************************************

    const deployer = (signer: SignerWithAddress) => {
      const core = deployInfo.core as CoreContractsWrapper;
      return StrategyTestUtils.deploy(
        signer,
        core,
        tokenName,
        async vaultAddress => {
          const strategyArgs = [
            core.controller.address,
            vaultAddress,
            underlying,
            rTokenAddress,
            borrowTarget,
            collateralFactor
          ];
          return DeployerUtilsLocal.deployContract(
            signer,
            strategyContractName,
            ...strategyArgs
          ) as Promise<IStrategy>
        },
        underlying
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
      return new FoldingDoHardWork(
        _signer,
        _user,
        _core,
        _tools,
        _underlying,
        _vault,
        _strategy,
        _balanceTolerance,
        finalBalanceTolerance
      );
    };

    universalStrategyTest(
      'DForceTest_' + rTokenName,
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
      specificTests
    );
  });
});
