/* tslint:disable:variable-name */
// noinspection SpellCheckingInspection
// noinspection JSUnusedGlobalSymbols

export class BaseAddresses {

  // useful places where you can find addresses
  // https://github.com/sushiswap/default-token-list/blob/master/src/tokens/matic.json#L153

  public static ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  public static GOV_ADDRESS = "".toLowerCase();
  // tokens
  public static WETH_TOKEN = "".toLowerCase();
  public static USDC_TOKEN = "".toLowerCase();
  public static WBTC_TOKEN = "".toLowerCase();
  public static DAI_TOKEN = "".toLowerCase();
  public static CRV_TOKEN = "".toLowerCase();
  public static USDT_TOKEN = "".toLowerCase();


  public static BLUE_CHIPS = new Set<string>([
    BaseAddresses.USDC_TOKEN,
    BaseAddresses.USDT_TOKEN,
    BaseAddresses.DAI_TOKEN,
    BaseAddresses.WETH_TOKEN,
    BaseAddresses.WBTC_TOKEN,
  ]);
}
