import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ContractFactory } from 'ethers';
import { CoreContractsWrapper } from '../../test/CoreContractsWrapper';
import { Addresses } from '../addresses/addresses';
import { CoreAddresses } from '../models/CoreAddresses';
import { RunHelper } from '../utils/tools/RunHelper';
import { Misc } from '../utils/tools/Misc';
import logSettings from '../../log_settings';
import { Logger } from 'tslog';
import { BaseAddresses } from '../addresses/BaseAddresses';
import { readFileSync } from 'fs';
import {
  IAnnouncer__factory,
  IBookkeeper__factory,
  IController,
  IController__factory,
  ISmartVault,
  ISmartVault__factory,
  IStrategy,
  TetuProxyControlled,
} from '../../typechain';
import { deployContract } from './DeployContract';
import { formatUnits, parseUnits } from 'ethers/lib/utils';

// tslint:disable-next-line:no-var-requires
const hre = require('hardhat');
const log: Logger<undefined> = new Logger(logSettings);

const libraries = new Map<string, string>([
  ['SmartVault', 'VaultLibrary'],
  ['SmartVaultV110', 'VaultLibrary'],
]);

export class DeployerUtilsLocal {

  public static getVaultLogic(signer: SignerWithAddress) {
    return ISmartVault__factory.connect(BaseAddresses.VAULT_IMPLEMENTATION_ADDRESS, signer);
  }

  // ************ CONTRACT DEPLOY **************************

  public static async deployContract<T extends ContractFactory>(
    signer: SignerWithAddress,
    name: string,
    // tslint:disable-next-line:no-any
    ...args: any[]
  ) {
    return deployContract(hre, signer, name, ...args);
  }

  public static async deployTetuProxyControlled<T extends ContractFactory>(
    signer: SignerWithAddress,
    logicContractName: string,
  ) {
    const logic = await DeployerUtilsLocal.deployContract(signer, logicContractName);
    await DeployerUtilsLocal.wait(5);
    const proxy = await DeployerUtilsLocal.deployContract(signer, 'TetuProxyControlled', logic.address);
    await DeployerUtilsLocal.wait(5);
    return [proxy, logic];
  }


  public static async deployStrategyProxy(signer: SignerWithAddress, strategyName: string): Promise<IStrategy> {
    const logic = await DeployerUtilsLocal.deployContract(signer, strategyName);
    await DeployerUtilsLocal.wait(1);
    const proxy = await DeployerUtilsLocal.deployContract(signer, 'TetuProxyControlled', logic.address);
    return logic.attach(proxy.address) as IStrategy;
  }

  public static async deployAndInitVaultAndStrategy<T>(
    underlying: string,
    vaultName: string,
    strategyDeployer: (vaultAddress: string) => Promise<IStrategy>,
    controller: IController,
    vaultRewardToken: string,
    signer: SignerWithAddress,
    rewardDuration: number = 60 * 60 * 24 * 28, // 4 weeks
    wait = false,
  ): Promise<[ISmartVault, ISmartVault, IStrategy]> {
    const start = Date.now();
    const vaultLogic = DeployerUtilsLocal.getVaultLogic(signer);
    console.log(`vaultLogic ${vaultLogic.address}`);
    console.log(`vaultLogic ver ${await vaultLogic.VERSION()}`);
    const vaultProxy = await DeployerUtilsLocal.deployContract(
      signer,
      'TetuProxyControlled',
      vaultLogic.address,
    ) as TetuProxyControlled;
    const vault = vaultLogic.attach(vaultProxy.address) as ISmartVault;
    await RunHelper.runAndWait(() => vault.initializeSmartVault(
      'TETU_' + vaultName,
      'x' + vaultName,
      controller.address,
      underlying,
      rewardDuration,
      vaultRewardToken,
    ), true, wait);
    const strategy = await strategyDeployer(vault.address);
    Misc.printDuration(vaultName + ' vault initialized', start);

    await RunHelper.runAndWait(
      () => controller.addVaultsAndStrategies([vault.address], [strategy.address]),
      true,
      wait,
    );
    await RunHelper.runAndWait(() => vault.setToInvest(1000), true, wait);
    Misc.printDuration(vaultName + ' deployAndInitVaultAndStrategy completed', start);
    return [vaultLogic, vault, strategy];
  }

  public static async deployVaultAndStrategy<T>(
    vaultName: string,
    strategyDeployer: (vaultAddress: string) => Promise<IStrategy>,
    controllerAddress: string,
    vaultRewardToken: string,
    signer: SignerWithAddress,
    rewardDuration: number = 60 * 60 * 24 * 28, // 4 weeks
    depositFee = 0,
    wait = false,
  ): Promise<[ISmartVault, ISmartVault, IStrategy]> {
    const vaultLogic = DeployerUtilsLocal.getVaultLogic(signer);
    if (wait) {
      await DeployerUtilsLocal.wait(1);
    }
    log.info('vaultLogic ' + vaultLogic.address);
    const vaultProxy = await DeployerUtilsLocal.deployContract(signer, 'TetuProxyControlled', vaultLogic.address);
    const vault = vaultLogic.attach(vaultProxy.address) as ISmartVault;

    const strategy = await strategyDeployer(vault.address);

    const strategyUnderlying = await strategy.underlying();

    await RunHelper.runAndWait(() => vault.initializeSmartVault(
      'TETU_' + vaultName,
      'x' + vaultName,
      controllerAddress,
      strategyUnderlying,
      rewardDuration,
      vaultRewardToken,
    ), true, wait);
    return [vaultLogic, vault, strategy];
  }

  public static async deployVaultAndStrategyProxy<T>(
    vaultName: string,
    underlying: string,
    strategyDeployer: (vaultAddress: string) => Promise<IStrategy>,
    controllerAddress: string,
    vaultRewardToken: string,
    signer: SignerWithAddress,
    rewardDuration: number = 60 * 60 * 24 * 28, // 4 weeks
    depositFee = 0,
    wait = false,
  ): Promise<[ISmartVault, ISmartVault, IStrategy]> {
    const vaultLogic = DeployerUtilsLocal.getVaultLogic(signer);
    if (wait) {
      await DeployerUtilsLocal.wait(1);
    }
    log.info('vaultLogic ' + vaultLogic.address);
    const vaultProxy = await DeployerUtilsLocal.deployContract(signer, 'TetuProxyControlled', vaultLogic.address);
    const vault = vaultLogic.attach(vaultProxy.address) as ISmartVault;

    await RunHelper.runAndWait(() => vault.initializeSmartVault(
      'TETU_' + vaultName,
      'x' + vaultName,
      controllerAddress,
      underlying,
      rewardDuration,
      vaultRewardToken,
    ), true, wait);

    if (wait) {
      await DeployerUtilsLocal.wait(1);
    }

    const strategy = await strategyDeployer(vault.address);
    return [vaultLogic, vault, strategy];
  }

  public static async deployImpermaxLikeStrategies(
    signer: SignerWithAddress,
    controller: string,
    vaultAddress: string,
    underlying: string,
    strategyName: string,
    infoPath: string,
    minTvl = 2_000_000,
    buyBackRatio = 10_00,
  ) {

    const infos = readFileSync(infoPath, 'utf8').split(/\r?\n/);

    const strategies = [];

    for (const i of infos) {
      const info = i.split(',');
      const idx = info[0];
      const tokenName = info[2];
      const tokenAdr = info[3];
      const poolAdr = info[4];
      const tvl = info[5];

      if (+tvl < minTvl || idx === 'idx' || !tokenAdr || underlying.toLowerCase() !== tokenAdr.toLowerCase()) {
        // console.log('skip', idx, underlying, tokenAdr, +tvl);
        continue;
      }
      console.log('SubStrategy', idx, tokenName);

      const strategyArgs = [
        controller,
        vaultAddress,
        tokenAdr,
        poolAdr,
        buyBackRatio,
      ];

      const deployedStart = await DeployerUtilsLocal.deployContract(
        signer,
        strategyName,
        ...strategyArgs,
      ) as IStrategy;
      strategies.push(deployedStart.address);
    }
    console.log(' ================ IMPERMAX-LIKE DEPLOYED', strategies.length);
    return strategies;
  }

  // ************** VERIFY **********************

  public static async verify(address: string) {
    try {
      await hre.run('verify:verify', {
        address,
      });
    } catch (e) {
      log.info('error verify ' + e);
    }
  }

  // ************** ADDRESSES **********************

  public static async getNetworkScanUrl(): Promise<string> {
    const net = (await ethers.provider.getNetwork());
    if (net.name === 'ropsten') {
      return 'https://api-ropsten.etherscan.io/api';
    } else if (net.name === 'kovan') {
      return 'https://api-kovan.etherscan.io/api';
    } else if (net.name === 'rinkeby') {
      return 'https://api-rinkeby.etherscan.io/api';
    } else if (net.name === 'ethereum') {
      return 'https://api.etherscan.io/api';
    } else if (net.name === 'matic') {
      return 'https://api.polygonscan.com/api';
    } else if (net.chainId === 80001) {
      return 'https://api-testnet.polygonscan.com/api';
    } else if (net.chainId === 250) {
      return 'https://api.ftmscan.com//api';
    } else {
      throw Error('network not found ' + net);
    }
  }

  public static async getCoreAddresses(): Promise<CoreAddresses> {
    const net = await ethers.provider.getNetwork();
    log.info('network ' + net.chainId);
    const core = Addresses.CORE.get(net.chainId + '');
    if (!core) {
      throw Error('No config for ' + net.chainId);
    }
    return core;
  }

  public static async getCoreAddressesWrapper(signer: SignerWithAddress): Promise<CoreContractsWrapper> {
    const net = await ethers.provider.getNetwork();
    log.info('network ' + net.chainId);
    const core = Addresses.CORE.get(net.chainId + '');
    if (!core) {
      throw Error('No config for ' + net.chainId);
    }
    return new CoreContractsWrapper(
      IController__factory.connect(core.controller, signer),
      IBookkeeper__factory.connect(core.bookkeeper, signer),
      IAnnouncer__factory.connect(core.announcer, signer),
    );
  }

  public static async impersonate(address: string | null = null) {
    if (address === null) {
      address = await DeployerUtilsLocal.getGovernance();
    }
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [address],
    });

    await hre.network.provider.request({
      method: 'hardhat_setBalance',
      params: [address, '0x1431E0FAE6D7217CAA0000000'],
    });
    console.log('address impersonated', address);
    return ethers.getSigner(address || '');
  }

  public static async getUSDCAddress() {
    const net = await ethers.provider.getNetwork();
    if (net.chainId === 137) {
      return BaseAddresses.USDC_TOKEN;
    } else {
      throw Error('No config for ' + net.chainId);
    }
  }


  public static async getBlueChips() {
    const net = await ethers.provider.getNetwork();
    if (net.chainId === 137) {
      return BaseAddresses.BLUE_CHIPS;
    } else {
      throw Error('No config for ' + net.chainId);
    }
  }

  public static async getGovernance() {
    const net = await ethers.provider.getNetwork();
    if (net.chainId === 8453) {
      return BaseAddresses.GOV_ADDRESS;
    } else {
      throw Error('No config for ' + net.chainId);
    }
  }

  public static async isBlueChip(address: string): Promise<boolean> {
    const net = await ethers.provider.getNetwork();
    if (net.chainId === 137) {
      return BaseAddresses.BLUE_CHIPS.has(address.toLowerCase());
    } else {
      throw Error('No config for ' + net.chainId);
    }
  }

  public static async isNetwork(id: number) {
    return (await ethers.provider.getNetwork()).chainId === id;
  }

  public static async getStorageAt(address: string, index: string) {
    return ethers.provider.getStorageAt(address, index);
  }

  public static async setStorageAt(address: string, index: string, value: string) {
    await ethers.provider.send('hardhat_setStorageAt', [address, index, value]);
    await ethers.provider.send('evm_mine', []); // Just mines to the next block
  }

  public static async findVaultUnderlyingInBookkeeper(
    signer: SignerWithAddress,
    underlying: string,
  ): Promise<string | undefined> {
    const core = await DeployerUtilsLocal.getCoreAddresses();
    const vaults = await IBookkeeper__factory.connect(core.bookkeeper, signer).vaults();
    for (const vault of vaults) {
      const vaultUnd = await ISmartVault__factory.connect(vault, signer).underlying();
      if (vaultUnd.toLowerCase() === underlying.toLowerCase()) {
        return vault;
      }
    }
    return undefined;
  }

  public static async txParams() {
    const gasPrice = (await ethers.provider.getGasPrice()).toNumber();
    console.log('Gas price:', formatUnits(gasPrice, 9));
    if (hre.network.name === 'hardhat') {
      return {
        maxPriorityFeePerGas: parseUnits('1', 9),
        maxFeePerGas: (gasPrice * 1.5).toFixed(0),
      };
    } else if (hre.network.config.chainId === 137) {
      return {
        maxPriorityFeePerGas: parseUnits('50', 9),
        maxFeePerGas: (gasPrice * 3).toFixed(0),
      };
    } else if (hre.network.config.chainId === 1) {
      return {
        maxPriorityFeePerGas: parseUnits('1', 9),
        maxFeePerGas: (gasPrice * 1.5).toFixed(0),
      };
    }
    return {
      gasPrice: (gasPrice * 1.1).toFixed(0),
    };
  }

  // ****************** WAIT ******************

  public static async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public static async wait(blocks: number) {
    if (hre.network.name === 'hardhat') {
      return;
    }
    const start = ethers.provider.blockNumber;
    while (true) {
      log.info('wait 10sec');
      await DeployerUtilsLocal.delay(10000);
      if (ethers.provider.blockNumber >= start + blocks) {
        break;
      }
    }
  }


}
