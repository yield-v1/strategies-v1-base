import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {BaseAddresses} from "../../../../../scripts/addresses/BaseAddresses";
import {
  deployBalancerUniversalStrategyOnly
} from "../../../../../scripts/deploy/strategies/balancer/DeployVaultAndBalancerUniversalStrategy";
import {BalancerConstants} from "../../../../../scripts/deploy/strategies/balancer/BalancerConstants";

export async function deployStMaticWMaticAave3Boosted7(): Promise<{vault: string, strategy: string, undSymbol: string}> {
  const underlying = BaseAddresses.BALANCER_MATIC_BOOSTED_AAVE3;
  const poolId = BaseAddresses.BALANCER_MATIC_BOOSTED_AAVE3_ID;
  const gauge = BaseAddresses.BALANCER_MATIC_BOOSTED_AAVE3_GAUGE;
  const isCompound = false;
  const depositToken = BaseAddresses.stMATIC_TOKEN;
  const buyBackRatio = 8_00;

  return deployBalancerUniversalStrategyOnly(
    underlying,
    poolId,
    gauge,
    isCompound,
    depositToken,
    buyBackRatio,
    BalancerConstants.BALANCER_VAULT_stMATIC_WMATIC_AAVE3_BOOSTED
  );
}
