import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {deployBalancerStrategyOnly} from "../../../../../scripts/deploy/strategies/balancer/DeployBPTVaultAndStrategy";
import {BaseAddresses} from "../../../../../scripts/addresses/BaseAddresses";
import {BalancerConstants} from "../../../../../scripts/deploy/strategies/balancer/BalancerConstants";

export async function deployBoostedTetuStables5(): Promise<{vault: string, strategy: string, undSymbol: string}> {
  return deployBalancerStrategyOnly(
    BaseAddresses.BALANCER_USD_TETU_BOOSTED,
    BaseAddresses.BALANCER_USD_TETU_BOOSTED_ID,
    BaseAddresses.BALANCER_USD_TETU_BOOSTED_GAUGE,
    BaseAddresses.bb_t_USDC_TOKEN,
    8_00,
    BalancerConstants.STRATEGY_BALANCER_BPT_LOGIC_104,
    BalancerConstants.BALANCER_VAULT_USD_TETU_BOOSTED
  );
}
