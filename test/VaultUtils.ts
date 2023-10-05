import {
  ControllableV2__factory,
  IController,
  IController__factory,
  IERC20__factory,
  ISmartVault,
  IStrategy__factory,
} from '../typechain';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { TokenUtils } from './TokenUtils';
import { BigNumber, ContractTransaction, utils } from 'ethers';
import axios from 'axios';
import { Misc } from '../scripts/utils/tools/Misc';
import { ethers } from 'hardhat';

export const XTETU_NO_INCREASE = new Set<string>([
  'QiStakingStrategyBase',
  'BalBridgedStakingStrategyBase',
  'MeshLpStrategyBase',
  'BalancerPoolStrategyBase',
  'PenroseStrategyBase',
  'BalancerBPTstMaticStrategyBase',
  'BalancerBPTStrategyBase',
  'BalancerBPTSphereWmaticStrategyBase',
  'BalancerBPTstMaticTetuBoostedStrategyBase',
  'BalancerBPTTngblUsdcStrategyBase',
  'BalancerUniversalStrategyBase',
  'BalancerBoostStrategyBase',
  'BalancerBoostBPTStrategyBase',
  'BalancerBoostTetuUsdcStrategyBase',
  'CaviarStakingStrategyBase',
]);
export const VAULT_SHARE_NO_INCREASE = new Set<string>([
  'QiStakingStrategyBase',
  'BalBridgedStakingStrategyBase',
  'MeshLpStrategyBase',
  'BalancerBPTstMaticStrategyBase',
  'PenroseStrategyBase',
  'BalancerBPTTetuUsdcStrategyBase',
  'BalancerBPTSphereWmaticStrategyBase',
  'BalancerBPTstMaticTetuBoostedStrategyBase',
  'BalancerBPTTngblUsdcStrategyBase',
  'BalancerUniversalStrategyBase',
  'BalancerBoostTetuUsdcStrategyBase',
]);

export class VaultUtils {

  constructor(public vault: ISmartVault) {
  }

  public static async profitSharingRatio(controller: IController): Promise<number> {
    const ratio = (await controller.psNumerator()).toNumber()
      / (await controller.psDenominator()).toNumber();
    expect(ratio).is.not.lessThan(0);
    expect(ratio).is.not.greaterThan(100);
    return ratio;
  }

  public static async deposit(
    user: SignerWithAddress,
    vault: ISmartVault,
    amount: BigNumber,
    invest = true,
  ): Promise<ContractTransaction> {
    const vaultForUser = vault.connect(user);
    const underlying = await vaultForUser.underlying();
    const dec = await TokenUtils.decimals(underlying);
    const bal = await TokenUtils.balanceOf(underlying, user.address);
    console.log('balance', utils.formatUnits(bal, dec), bal.toString());
    expect(+utils.formatUnits(bal, dec))
      .is.greaterThanOrEqual(+utils.formatUnits(amount, dec), 'not enough balance');

    const undBal = await vaultForUser.underlyingBalanceWithInvestment();
    const totalSupply = await IERC20__factory.connect(vault.address, user).totalSupply();
    if (!totalSupply.isZero() && undBal.isZero()) {
      throw new Error('Wrong underlying balance! Check strategy implementation for _rewardPoolBalance()');
    }

    await TokenUtils.approve(underlying, user, vault.address, amount.toString());
    console.log('Vault utils: deposit', BigNumber.from(amount).toString());
    if (invest) {
      return vaultForUser.depositAndInvest(BigNumber.from(amount));
    } else {
      return vaultForUser.deposit(BigNumber.from(amount));
    }
  }


  public static async getVaultInfoFromServer() {
    const net = await ethers.provider.getNetwork();
    let network;
    if (net.chainId === 137) {
      network = 'MATIC';
    } else if (net.chainId === 250) {
      network = 'FANTOM';
    } else {
      throw Error('unknown net ' + net.chainId);
    }
    return (await axios.get(`https://tetu-server-staging.herokuapp.com//api/v1/reader/vaultInfos?network=${network}`)).data;
  }

  public static async doHardWorkAndCheck(vault: ISmartVault, positiveCheck = true) {
    console.log('/// start do hard work');
    const start = Date.now();
    const controller = await ControllableV2__factory.connect(vault.address, vault.signer).controller();
    const controllerCtr = IController__factory.connect(controller, vault.signer);
    const und = await vault.underlying();
    const undDec = await TokenUtils.decimals(und);
    const rt = (await vault.rewardTokens())[0];
    const strategy = await vault.strategy();
    const strategyCtr = IStrategy__factory.connect(strategy, vault.signer);
    const ppfsDecreaseAllowed = await vault.ppfsDecreaseAllowed();

    const ppfs = +utils.formatUnits(await vault.getPricePerFullShare(), undDec);
    const undBal = +utils.formatUnits(await vault.underlyingBalanceWithInvestment(), undDec);
    let rtBal: number = 0;
    if (rt) {
      rtBal = +utils.formatUnits(await TokenUtils.balanceOf(rt, vault.address));
    } else {
      rtBal = 0;
    }


    // const strategyName = (await strategyCtr.STRATEGY_NAME());
    // const strategyPlatform = (await strategyCtr.platform());
    await vault.doHardWork();
    console.log('hard work called');

    const ppfsAfter = +utils.formatUnits(await vault.getPricePerFullShare(), undDec);
    const undBalAfter = +utils.formatUnits(await vault.underlyingBalanceWithInvestment(), undDec);

    let rtBalAfter: number = 0;
    if (rt) {
      rtBalAfter = +utils.formatUnits(await TokenUtils.balanceOf(rt, vault.address));
    }


    console.log('-------- HARDWORK --------');
    console.log('- Vault Share price:', ppfsAfter);
    console.log('- Vault Share price change:', ppfsAfter - ppfs);
    console.log('- Vault und balance change:', undBalAfter - undBal);
    console.log('- Vault first RT change:', rtBalAfter - rtBal);
    console.log('--------------------------');

    Misc.printDuration('doHardWorkAndCheck completed', start);
  }

}
