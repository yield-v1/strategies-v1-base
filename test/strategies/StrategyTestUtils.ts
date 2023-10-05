import { DeployerUtilsLocal } from '../../scripts/deploy/DeployerUtilsLocal';
import { BaseAddresses } from '../../scripts/addresses/BaseAddresses';
import { CoreContractsWrapper } from '../CoreContractsWrapper';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ISmartVault, IStrategy } from '../../typechain';
import { TokenUtils } from '../TokenUtils';
import { BigNumber, utils } from 'ethers';
import { expect } from 'chai';
import { Misc } from '../../scripts/utils/tools/Misc';
import { DeployInfo } from './DeployInfo';
import logSettings from '../../log_settings';
import { Logger } from 'tslog';

const log: Logger<undefined> = new Logger(logSettings);

export class StrategyTestUtils {

  public static async deploy(
    signer: SignerWithAddress,
    core: CoreContractsWrapper,
    vaultName: string,
    strategyDeployer: (vaultAddress: string) => Promise<IStrategy>,
    underlying: string,
    depositFee = 0,
  ): Promise<[ISmartVault, IStrategy, string]> {
    let reward = Misc.ZERO_ADDRESS;
    const start = Date.now();
    log.info('Starting deploy');
    const data = await DeployerUtilsLocal.deployAndInitVaultAndStrategy(
      underlying,
      vaultName,
      strategyDeployer,
      core.controller,
      reward,
      signer,
      60 * 60 * 24 * 28,
    );
    log.info('Vault deployed');
    const vault = data[1] as ISmartVault;
    const strategy = data[2] as IStrategy;

    // const rewardTokenLp = await UniswapUtils.createTetuUsdc(
    //   signer, core, "1000000"
    // );
    // log.info("LP created");

    // await core.feeRewardForwarder.addLargestLps([core.rewardToken.address], [rewardTokenLp]);
    log.info('Path setup completed');

    expect((await strategy.underlying()).toLowerCase()).is.eq(underlying.toLowerCase());
    expect((await vault.underlying()).toLowerCase()).is.eq(underlying.toLowerCase());

    Misc.printDuration('Vault and strategy deployed and initialized', start);
    return [vault, strategy, 'deprectaed'];
  }

  public static async deposit(
    user: SignerWithAddress,
    vault: ISmartVault,
    underlying: string,
    deposit: string,
  ) {
    const dec = await TokenUtils.decimals(underlying);
    const bal = await TokenUtils.balanceOf(underlying, user.address);
    log.info('balance', utils.formatUnits(bal, dec), bal.toString());
    expect(+utils.formatUnits(bal, dec))
      .is.greaterThanOrEqual(+utils.formatUnits(deposit, dec), 'not enough balance');
    const vaultForUser = vault.connect(user);
    await TokenUtils.approve(underlying, user, vault.address, deposit);
    log.info('deposit', BigNumber.from(deposit).toString());
    await vaultForUser.depositAndInvest(BigNumber.from(deposit));
  }

  public static async saveStrategyRtBalances(strategy: IStrategy): Promise<BigNumber[]> {
    const balances: BigNumber[] = [];
    return balances;
  }

  public static async commonTests(strategy: IStrategy, underlying: string) {
    expect(await strategy.unsalvageableTokens(underlying)).is.eq(true);
    expect(await strategy.unsalvageableTokens(BaseAddresses.ZERO_ADDRESS)).is.eq(false);
    expect(await strategy.platform()).is.not.eq(0);
    await strategy.emergencyExit();
    expect(await strategy.pausedInvesting()).is.eq(true);
    await strategy.continueInvesting();
    expect(await strategy.pausedInvesting()).is.eq(false);
  }

  public static async deployCoreAndInit(deployInfo: DeployInfo, deploy: boolean) {
    const signer = await DeployerUtilsLocal.impersonate();
    deployInfo.core = await DeployerUtilsLocal.getCoreAddressesWrapper(signer);
  }

}
