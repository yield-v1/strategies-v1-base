import { DeployerUtilsLocal } from '../../DeployerUtilsLocal';
import { writeFileSync } from 'fs';
import { BaseAddresses } from '../../../addresses/BaseAddresses';
import { TokenUtils } from '../../../../test/TokenUtils';
import { CurveStrategyCbEthEth__factory } from '../../../../typechain';
import { ethers } from 'hardhat';
import { RunHelper } from '../../../utils/tools/RunHelper';

const UNDERLYING = BaseAddresses.CURVE_CB_ETH_ETH_LP_TOKEN;
const STRATEGY_CONTRACT_NAME = 'CurveStrategyCbEthEth';
const KIND_OF_POOL = 0;

async function main() {

  const signer = (await ethers.getSigners())[0];
  const core = await DeployerUtilsLocal.getCoreAddresses();
  const undSymbol = await TokenUtils.tokenSymbol(UNDERLYING);


  const vaultAddress = await DeployerUtilsLocal.deployVault(signer, UNDERLYING);

  const [proxy, logic] = await DeployerUtilsLocal.deployTetuProxyControlled(signer, STRATEGY_CONTRACT_NAME);

  await RunHelper.runAndWait(() => CurveStrategyCbEthEth__factory.connect(proxy.address, signer).initialize(
    core.controller.address,
    vaultAddress,
    BaseAddresses.PERF_FEE_RECIPIENT_ADDRESS,
    BaseAddresses.CURVE_CB_ETH_ETH_GAUGE,
    BaseAddresses.WETH_TOKEN,
    KIND_OF_POOL
  ));

  const txt = `
  vault: ${vaultAddress}
  strategy: ${proxy.address}
  `;
  writeFileSync(`./tmp/deployed/${undSymbol}_${STRATEGY_CONTRACT_NAME}.txt`, txt, 'utf8');

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
