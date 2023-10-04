import {BaseAddresses} from "../../../../scripts/addresses/BaseAddresses";


interface IMBInfo {
  underlyingName: string,
  underlying: string,
  stablecoin: string,
  targetPercentage: string,
  collateralNumerator?: string, // will be used '1' on deploy, when undefined
}

const infos: IMBInfo[] = [
    // for now CelsiusX only tokens.
    // same strategy can be used for all other MAI vaults
  {
    underlyingName: 'cxDOGE',
    underlying: BaseAddresses.cxDOGE_TOKEN,
    stablecoin: BaseAddresses.cxDOGE_MAI_VAULT,
    targetPercentage: '300',
  },
  {
    underlyingName: 'cxADA',
    underlying: BaseAddresses.cxADA_TOKEN,
    stablecoin: BaseAddresses.cxADA_MAI_VAULT,
    targetPercentage: '300',
  },
  {
    underlyingName: 'cxETH',
    underlying: BaseAddresses.cxETH_TOKEN,
    stablecoin: BaseAddresses.cxETH_MAI_VAULT,
    targetPercentage: '300',
  },
]

export {IMBInfo, infos}
