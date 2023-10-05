import { DeployerUtilsLocal } from '../../DeployerUtilsLocal';
import { writeFileSync } from 'fs';
import { BaseAddresses } from '../../../addresses/BaseAddresses';
import { TokenUtils } from '../../../../test/TokenUtils';
import { CurveStrategyCbEthEth__factory, IController__factory } from '../../../../typechain';
import { ethers } from 'hardhat';
import { RunHelper } from '../../../utils/tools/RunHelper';
import { Misc } from '../../../utils/tools/Misc';

const UNDERLYING = BaseAddresses.CURVE_CB_ETH_ETH_LP_TOKEN;
const STRATEGY_CONTRACT_NAME = 'CurveStrategyCbEthEth';
const KIND_OF_POOL = 0;

async function main() {

  const signer = (await ethers.getSigners())[0];
  const core = await DeployerUtilsLocal.getCoreAddresses();
  const undSymbol = await TokenUtils.tokenSymbol(UNDERLYING);


  const vaultAddress = await DeployerUtilsLocal.deployVault(signer, UNDERLYING);

  const [proxy] = await DeployerUtilsLocal.deployTetuProxyControlled(signer, STRATEGY_CONTRACT_NAME);
  const strategyAddress = proxy.address;

  await RunHelper.runAndWait(() => CurveStrategyCbEthEth__factory.connect(strategyAddress, signer).initialize(
    core.controller,
    vaultAddress,
    BaseAddresses.PERF_FEE_RECIPIENT_ADDRESS,
    BaseAddresses.CURVE_CB_ETH_ETH_GAUGE,
    BaseAddresses.WETH_TOKEN,
    KIND_OF_POOL,
  ));

  const txt = `
  vault: ${vaultAddress}
  strategy: ${strategyAddress}
  `;
  writeFileSync(`./tmp/deployed/${undSymbol}_${STRATEGY_CONTRACT_NAME}.txt`, txt, 'utf8');

  let gov = await IController__factory.connect(core.controller, ethers.provider).governance();
  if (signer.address.toLowerCase() === gov.toLowerCase()) {
    console.log('we are governance, register actions');

    const controller = IController__factory.connect(core.controller, signer);

    await RunHelper.runAndWait(() => controller.addVaultsAndStrategies([vaultAddress], [strategyAddress]));

  }

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
