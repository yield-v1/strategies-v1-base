/* tslint:disable:variable-name */
// noinspection SpellCheckingInspection
// noinspection JSUnusedGlobalSymbols

export class BaseAddresses {

  // useful places where you can find addresses
  // https://github.com/sushiswap/default-token-list/blob/master/src/tokens/matic.json#L153

  public static ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  public static GOV_ADDRESS = "0xccccA67ff07be12db2aAaF0c59CeD3BbB222F883".toLowerCase(); // todo change
  public static VAULT_IMPLEMENTATION_ADDRESS = "0xA81d2B4f9Fa3ffc8Ce7b415562449c1271B9C9C9".toLowerCase();
  // tokens
  public static WETH_TOKEN = "0x4200000000000000000000000000000000000006".toLowerCase();
  public static USDC_TOKEN = "".toLowerCase();
  public static WBTC_TOKEN = "".toLowerCase();
  public static DAI_TOKEN = "".toLowerCase();
  public static CRV_TOKEN = "".toLowerCase();
  public static USDT_TOKEN = "".toLowerCase();

  // curve
public static CURVE_CB_ETH_ETH_LP_TOKEN = "0x98244d93D42b42aB3E3A4D12A5dc0B3e7f8F32f9".toLowerCase();
public static CURVE_CB_ETH_ETH_GAUGE = "0xE9c898BA654deC2bA440392028D2e7A194E6dc3e".toLowerCase();



  public static BLUE_CHIPS = new Set<string>([
    BaseAddresses.USDC_TOKEN,
    BaseAddresses.USDT_TOKEN,
    BaseAddresses.DAI_TOKEN,
    BaseAddresses.WETH_TOKEN,
    BaseAddresses.WBTC_TOKEN,
  ]);
}
