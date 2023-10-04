import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {
  AaveAmPipe,
  AaveAmPipe__factory,
  BalVaultPipe,
  BalVaultPipe__factory,
  MaiCamPipe,
  MaiCamPipe__factory,
  MaiStablecoinPipe,
  MaiStablecoinPipe__factory,
  StrategyAaveMaiBal__factory,
  StrategyMaiBal__factory
} from "../../../../typechain";
import {IAMBInfo} from "./MultiAMBInfos";
import {DeployerUtilsLocal} from "../../../../scripts/deploy/DeployerUtilsLocal";
import {RunHelper} from "../../../../scripts/utils/tools/RunHelper";
import {BaseAddresses} from "../../../../scripts/addresses/BaseAddresses";
import {CoreContractsWrapper} from "../../../CoreContractsWrapper";
import {IMBInfo} from "./MultiMBInfos";

export class MultiPipeDeployer {


  public static async deployAaveAmPipe(
    signer: SignerWithAddress,
    underlying: string,
    amToken: string,
  ): Promise<AaveAmPipe> {
    console.log('deployAaveAmPipe')
    const pipe = await DeployerUtilsLocal.deployTetuProxyControlled(signer, 'AaveAmPipe');
    const p = AaveAmPipe__factory.connect(pipe[0].address, signer);
    await RunHelper.runAndWait(() => p.initialize(
      {
        pool: BaseAddresses.AAVE_LENDING_POOL,
        sourceToken: underlying,
        lpToken: amToken,
        rewardToken: BaseAddresses.WMATIC_TOKEN
      },
      {gasLimit: 12_000_000}
    ));
    return p;
  }

  public static async deployMaiCamPipe(
    signer: SignerWithAddress,
    amToken: string,
    camToken: string,
  ): Promise<MaiCamPipe> {
    console.log('deployMaiCamPipe')
    const pipe = await DeployerUtilsLocal.deployTetuProxyControlled(signer, 'MaiCamPipe');
    const p = MaiCamPipe__factory.connect(pipe[0].address, signer);
    await RunHelper.runAndWait(() => p.initialize(
      {
        sourceToken: amToken,
        lpToken: camToken,
        rewardToken: BaseAddresses.QI_TOKEN
      },
      {gasLimit: 12_000_000}
    ));
    return p;
  }

  // targetPercentage: default is 200
  // https://docs.mai.finance/borrowing-incentives
  // 135% - liquidation (110% - camDAI), 135+25=160 - minimum for incentives
  // 135+270=405 max percentage for incentives
  public static async deployMaiStablecoinPipe(
    signer: SignerWithAddress,
    sourceToken: string,
    stablecoin: string,
    targetPercentage: string,
    collateralNumerator: string,
  ): Promise<MaiStablecoinPipe> {
    console.log('deployMaiStablecoinPipe')
    const pipe = await DeployerUtilsLocal.deployTetuProxyControlled(signer, 'MaiStablecoinPipe');
    const p = MaiStablecoinPipe__factory.connect(pipe[0].address, signer);
    await RunHelper.runAndWait(() => p.initialize(
      {
        sourceToken,
        stablecoin,
        borrowToken: BaseAddresses.miMATIC_TOKEN,
        targetPercentage,
        maxImbalance: '100', // max targetPercentage deviation (+/-) to call rebalance
        rewardToken: BaseAddresses.QI_TOKEN,
        collateralNumerator,
      },
      {gasLimit: 12_000_000}
    ));
    return p;
  }

  public static async deployBalVaultPipe(
    signer: SignerWithAddress,
  ): Promise<BalVaultPipe> {
    console.log('deployBalVaultPipe')
    const pipe = await DeployerUtilsLocal.deployTetuProxyControlled(signer, 'BalVaultPipe');
    const p = BalVaultPipe__factory.connect(pipe[0].address, signer);
    await RunHelper.runAndWait(() => p.initialize(
      {
        sourceToken: BaseAddresses.miMATIC_TOKEN,
        vault: BaseAddresses.BALANCER_VAULT,
        poolID: BaseAddresses.BALANCER_POOL_MAI_STABLE_ID,
        tokenIndex: '2', // tokenIndex
        lpToken: BaseAddresses.BALANCER_STABLE_POOL, // Balancer Polygon Stable Pool (BPSP)
        rewardTokens: [BaseAddresses.BAL_TOKEN, BaseAddresses.QI_TOKEN],
      },
      {gasLimit: 12_000_000}
    ));
    return p;
  }

  public static AMBStrategyDeployer(
    strategyContractName: string,
    core: CoreContractsWrapper,
    signer: SignerWithAddress,
    underlying: string,
    info: IAMBInfo,
    pipes: string[],
    initializeStrategy = true
  ) {
    return async (vaultAddress: string) => {
      // -----------------
      const aaveAmPipeData = await MultiPipeDeployer.deployAaveAmPipe(
        signer,
        underlying,
        info.amToken
      );
      pipes.push(aaveAmPipeData.address);
      // -----------------
      const maiCamPipeData = await MultiPipeDeployer.deployMaiCamPipe(
        signer,
        info.amToken,
        info.camToken
      );
      pipes.push(maiCamPipeData.address);
      // -----------------
      const maiStablecoinPipeData = await MultiPipeDeployer.deployMaiStablecoinPipe(
        signer,
        info.camToken,
        info.stablecoin,
        info.targetPercentage,
        info.collateralNumerator || '1'
      );
      pipes.push(maiStablecoinPipeData.address);
      // -----------------
      const balVaultPipeData = await MultiPipeDeployer.deployBalVaultPipe(
        signer
      );
      pipes.push(balVaultPipeData.address);
      // -----------------

      const strategyData = await DeployerUtilsLocal.deployTetuProxyControlled(
        signer,
        strategyContractName
      );
      if (initializeStrategy) {
        await StrategyAaveMaiBal__factory.connect(strategyData[0].address, signer).initialize(
          core.controller.address,
          vaultAddress,
          info.underlying,
          pipes
        );
      }
      return StrategyAaveMaiBal__factory.connect(strategyData[0].address, signer);
    }
  }

  public static MBStrategyDeployer(
    strategyContractName: string,
    core: CoreContractsWrapper,
    signer: SignerWithAddress,
    underlying: string,
    info: IMBInfo,
    pipes: string[],
    initializeStrategy = true
  ) {
    return async (vaultAddress: string) => {
      const maiStablecoinPipeData = await MultiPipeDeployer.deployMaiStablecoinPipe(
        signer,
        info.underlying,
        info.stablecoin,
        info.targetPercentage,
        info.collateralNumerator || '1'
      );
      pipes.push(maiStablecoinPipeData.address);
      // -----------------
      const balVaultPipeData = await MultiPipeDeployer.deployBalVaultPipe(
        signer
      );
      pipes.push(balVaultPipeData.address);
      // -----------------

      const strategyData = await DeployerUtilsLocal.deployTetuProxyControlled(
        signer,
        strategyContractName
      );
      if (initializeStrategy)
        await StrategyMaiBal__factory.connect(strategyData[0].address, signer).initialize(
          core.controller.address,
          vaultAddress,
          info.underlying,
          pipes
        );
      return StrategyMaiBal__factory.connect(strategyData[0].address, signer);
    }
  }

}
