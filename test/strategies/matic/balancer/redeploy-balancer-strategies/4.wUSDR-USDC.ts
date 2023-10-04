import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {deployBalancerStrategyOnly} from "../../../../../scripts/deploy/strategies/balancer/DeployBPTVaultAndStrategy";
import {BaseAddresses} from "../../../../../scripts/addresses/BaseAddresses";
import {BalancerConstants} from "../../../../../scripts/deploy/strategies/balancer/BalancerConstants";

export async function deployWUsdrUsdc4(): Promise<{vault: string, strategy: string, undSymbol: string}> {
  return deployBalancerStrategyOnly(
    BaseAddresses.BALANCER_USDC_wUSDR,
    BaseAddresses.BALANCER_USDC_wUSDR_ID,
    BaseAddresses.BALANCER_USDC_wUSDR_GAUGE,
    BaseAddresses.USDC_TOKEN,
    5_00,
    BalancerConstants.STRATEGY_BALANCER_BPT_LOGIC_104,
    BalancerConstants.BALANCER_VAULT_wUSDR_USDC
  );
}
