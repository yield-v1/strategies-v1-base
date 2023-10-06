import { config as dotEnvConfig } from 'dotenv';

dotEnvConfig();

export class EnvSetup {

  // tslint:disable-next-line:no-any
  public static getEnv(): any {
    // tslint:disable-next-line:no-var-requires
    return require('yargs/yargs')()
      .env('TETU')
      .options({
        hardhatChainId: {
          type: 'number',
          default: 8453,
        },
        baseRpcUrl: {
          type: 'string',
        },
        networkScanKeyBase: {
          type: 'string',
        },
        privateKey: {
          type: 'string',
          default: '85bb5fa78d5c4ed1fde856e9d0d1fe19973d7a79ce9ed6c0358ee06a4550504e', // random account
        },
        baseForkBlock: {
          type: 'number',
          default: 4895600,
        },
        loggingEnabled: {
          type: 'boolean',
          default: false,
        },
      }).argv;
  }

}
