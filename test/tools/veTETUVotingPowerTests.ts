import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {ethers} from "hardhat";
import {TimeUtils} from "../TimeUtils";
import {
  IBVault, IBVault__factory,
  IERC20,
  IERC20__factory, IVeTetu, IVeTetu__factory,
  TetuBalVotingPower,
  TetuBalVotingPower__factory, VeTETUVotingPower, VeTETUVotingPower__factory
} from "../../typechain";
import {DeployerUtilsLocal} from "../../scripts/deploy/DeployerUtilsLocal";
import {TokenUtils} from "../TokenUtils";
import {formatUnits, parseUnits} from "ethers/lib/utils";
import {BaseAddresses} from "../../scripts/addresses/BaseAddresses";


const {expect} = chai;
chai.use(chaiAsPromised);

const DX_TETU = '0xAcEE7Bd17E7B04F7e48b29c0C91aF67758394f0f';
const VE_TETU = '0x6FB29DD17fa6E27BD112Bc3A2D0b8dae597AeDA4';
const TETU_BAL = '0x7fC9E0Aa043787BFad28e29632AdA302C790Ce33';
const TETU_BAL_BPT = BaseAddresses.BALANCER_POOL_tetuBAL_BPT;
const TETU_BAL_BPT_ID = BaseAddresses.BALANCER_POOL_tetuBAL_BPT_ID;
const BALANCER_VAULT = '0xBA12222222228d8Ba445958a75a0704d566BF2C8';

describe("veTETUVotingPowerTests", function () {
  let snapshotBefore: string;
  let snapshot: string;
  let signer: SignerWithAddress;

  let power: VeTETUVotingPower;
  let veTetu: IVeTetu;
  let veTetuERC: IERC20;

  before(async function () {
    [signer] = await ethers.getSigners()
    snapshotBefore = await TimeUtils.snapshot();

    const p = await DeployerUtilsLocal.deployTetuProxyControlled(signer, 'VeTETUVotingPower');
    power = VeTETUVotingPower__factory.connect(p[0].address, signer);
    veTetu = IVeTetu__factory.connect(VE_TETU, signer)
    veTetuERC = IERC20__factory.connect(VE_TETU, signer)
  });

  after(async function () {
    await TimeUtils.rollback(snapshotBefore);
  });

  beforeEach(async function () {
    snapshot = await TimeUtils.snapshot();
  });

  afterEach(async function () {
    await TimeUtils.rollback(snapshot);
  });

  it("test veTETU power", async () => {
    const amount = await power.balanceOf('0xbbbbb8C4364eC2ce52c59D2Ed3E56F307E529a94')
    console.log(formatUnits(amount))
  });


});
