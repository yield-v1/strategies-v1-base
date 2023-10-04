import {BaseAddresses} from "../../../../scripts/addresses/BaseAddresses";
import {DeployInfo} from "../../DeployInfo";
import {StrategyTestUtils} from "../../StrategyTestUtils";
import {balancerUniversalTest} from "./universal-test";

describe.skip('BalancerBPT_stMATIC-MATIC-AAVE3_Test', async () => {
  const deployInfo: DeployInfo = new DeployInfo();
  before(async function () {
    await StrategyTestUtils.deployCoreAndInit(deployInfo, true);
  });


  // **********************************************
  // ************** CONFIG*************************
  // **********************************************

  const underlying = BaseAddresses.BALANCER_MATIC_BOOSTED_AAVE3;
  const poolId = BaseAddresses.BALANCER_MATIC_BOOSTED_AAVE3_ID;
  const gauge = BaseAddresses.BALANCER_MATIC_BOOSTED_AAVE3_GAUGE;
  const isCompound = false;
  const depositToken = BaseAddresses.stMATIC_TOKEN;
  const buyBackRatio = 8_00;

  await balancerUniversalTest(
    deployInfo,
    underlying,
    poolId,
    gauge,
    isCompound,
    depositToken,
    buyBackRatio,
  )

});
