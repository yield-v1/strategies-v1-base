import { config as dotEnvConfig } from 'dotenv';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-web3';
import '@nomiclabs/hardhat-solhint';
// import '@openzeppelin/hardhat-upgrades';
import '@typechain/hardhat';
// import "hardhat-docgen";
import 'hardhat-contract-sizer';
import 'hardhat-gas-reporter';
import 'hardhat-tracer';
// import "hardhat-etherscan-abi";
import 'solidity-coverage';
import 'hardhat-abi-exporter';
import { task } from 'hardhat/config';
import { deployContract } from './scripts/deploy/DeployContract';
import { EnvSetup } from './scripts/EnvSetup';

task('deploy', 'Deploy contract', async function(args, hre, runSuper) {
  const [signer] = await hre.ethers.getSigners();
  // tslint:disable-next-line:ban-ts-ignore
  // @ts-ignore
  await deployContract(hre, signer, args.name);
}).addPositionalParam('name', 'Name of the smart contract to deploy');

export default {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      chainId: EnvSetup.getEnv().hardhatChainId,
      timeout: 99999999,
      gas: EnvSetup.getEnv().hardhatChainId === 8453 ? 19_000_000 : 9_000_000,
      forking: {
        url: EnvSetup.getEnv().hardhatChainId === 8453 ? EnvSetup.getEnv().baseRpcUrl : undefined,
        blockNumber: EnvSetup.getEnv().hardhatChainId === 8453
          ? EnvSetup.getEnv().baseForkBlock !== 0 ? EnvSetup.getEnv().baseForkBlock : undefined
          : undefined,
      },
      // hardfork: EnvSetup.getEnv().hardhatChainId === 137 ? 'grayGlacier' : undefined,
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk',
        path: 'm/44\'/60\'/0\'/0',
        accountsBalance: '100000000000000000000000000000',
      },
      loggingEnabled: EnvSetup.getEnv().loggingEnabled,
    },
    base: {
      url: EnvSetup.getEnv().baseRpcUrl || '',
      chainId: 8453,
      accounts: [EnvSetup.getEnv().privateKey],
    },
  },
  etherscan: {
    apiKey: {
      base: EnvSetup.getEnv().networkScanKeyBase,
    },
    customChains: [
      {
        network: 'base',
        chainId: 8453,
        urls: {
          apiURL: 'https://api.basescan.org/api',
          browserURL: 'https://basescan.org',
        },
      },
    ],
  },
  solidity: {
    compilers: [
      {
        version: '0.8.19',
        settings: {
          optimizer: {
            enabled: true,
            runs: 150,
          },
        },
      },
    ],
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  mocha: {
    timeout: 9999999999,
  },
  docgen: {
    path: './docs',
    clear: true,
    runOnCompile: false,
    except: ['contracts/third_party', 'contracts/test'],
  },
  contractSizer: {
    alphaSort: false,
    runOnCompile: false,
    disambiguatePaths: false,
  },
  gasReporter: {
    enabled: false,
    currency: 'USD',
    gasPrice: 21,
  },
  typechain: {
    outDir: 'typechain',
  },
  abiExporter: {
    path: './artifacts/abi',
    runOnCompile: false,
    spacing: 2,
    pretty: false,
  },
};
