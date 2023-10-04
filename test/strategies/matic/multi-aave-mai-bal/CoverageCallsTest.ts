import {SpecificStrategyTest} from "../../SpecificStrategyTest";
import {
  ISmartVault,
  StrategyAaveMaiBal,
  BalVaultPipe, BalVaultPipe__factory,
} from "../../../../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {DeployInfo} from "../../DeployInfo";
import {BaseAddresses} from "../../../../scripts/addresses/BaseAddresses";
import {DeployerUtilsLocal} from "../../../../scripts/deploy/DeployerUtilsLocal";

const {expect} = chai;
chai.use(chaiAsPromised);

export class CoverageCallsTest extends SpecificStrategyTest {

  public async do(
      deployInfo: DeployInfo
  ): Promise<void> {
    it("Coverage calls", async () => {
      const underlying = deployInfo?.underlying as string;
      const signer = deployInfo?.signer as SignerWithAddress;
      const user = deployInfo?.user as SignerWithAddress;
      const vault = deployInfo?.vault as ISmartVault;
      const strategyAaveMaiBal = deployInfo.strategy as StrategyAaveMaiBal;
      const strategyUser = strategyAaveMaiBal.connect(deployInfo.user as SignerWithAddress);
      const strategyGov = strategyAaveMaiBal.connect(deployInfo.signer as SignerWithAddress);

      console.log('>>>Coverage calls test');
      const platformId = await strategyAaveMaiBal.platform();
      console.log('>>>platformId', platformId);

      const assets = await strategyAaveMaiBal.assets();
      console.log('>>>assets', assets);

      const poolTotalAmount = await strategyAaveMaiBal.poolTotalAmount()
      console.log('>>>poolTotalAmount', poolTotalAmount);

      const readyToClaim = await strategyAaveMaiBal.readyToClaim()
      console.log('>>>readyToClaim', readyToClaim);

      const availableMai = await strategyAaveMaiBal.availableMai();
      console.log('>>>availableMai', availableMai);

      const totalAmountOut = await strategyAaveMaiBal.totalAmountOut();
      console.log('>>>totalAmountOut', totalAmountOut);

      const version = await strategyAaveMaiBal.VERSION();
      console.log('>>>version', version);

      const underlyingToken = await strategyAaveMaiBal.underlyingToken();
      console.log('>>> underlyingToken', underlyingToken);

      expect(platformId).is.eq(15);

      const liquidationPrice = await strategyAaveMaiBal.liquidationPrice();
      console.log('>>>liquidationPrice', liquidationPrice.toString());

      // maxImbalance
      const maxImbalance0 = await strategyAaveMaiBal.maxImbalance()
      const targetMaxImbalance1 = maxImbalance0.add(1)
      await expect(strategyGov.setMaxImbalance(targetMaxImbalance1))
      .to.emit(strategyGov, 'SetMaxImbalance')
      .withArgs(targetMaxImbalance1)
      const maxImbalance1 = await strategyAaveMaiBal.maxImbalance()
      await strategyGov.setMaxImbalance(maxImbalance0)
      const maxImbalance2 = await strategyAaveMaiBal.maxImbalance()

      // default value should be 100
      expect(maxImbalance0).is.eq(100);
      expect(maxImbalance1).is.eq(101);
      expect(maxImbalance2).is.eq(100);

      // BalVaultPipe claim
      const balPipeAddress = await strategyUser.pipes(3); // 3 - Bal Pipe
      const stablecoinPipeAddress = await strategyUser.pipes(2); // 3 - Mai Stablecoin Pipe
      const balPipeUser = BalVaultPipe__factory.connect(balPipeAddress, user);
      const balPipeSigner = BalVaultPipe__factory.connect(balPipeAddress, signer);

      expect(await balPipeUser.name()).eq('BalVaultPipe')
      expect(await balPipeUser.nextPipe()).eq(BaseAddresses.ZERO_ADDRESS)
      expect(await balPipeUser.prevPipe()).eq(stablecoinPipeAddress)
      expect(await balPipeUser.rewardTokensLength()).eq(2)
      const rewardToken0 = await balPipeUser.rewardTokens(0);
      expect(rewardToken0.toLowerCase()).eq(BaseAddresses.BAL_TOKEN);

      const claims = [{
        distribution: 1,
        balance: 1,
        distributor: BaseAddresses.ZERO_ADDRESS,
        tokenIndex: 0,
        merkleProof: []
      }]
      await expect(
          balPipeUser.claimDistributions(BaseAddresses.ZERO_ADDRESS, claims, [BaseAddresses.BAL_TOKEN])
      ).to.be.revertedWith('BVP: Not HW or Gov');

      // Next call reverts due wrong params. Real params tested at harvest's claim script
      // /scripts/utils/balancer-claim // TODO link to the test script
      await expect(
          balPipeSigner.claimDistributions(BaseAddresses.ZERO_ADDRESS, claims, [BaseAddresses.BAL_TOKEN])
      ).to.be.reverted;

    });
  }

}
