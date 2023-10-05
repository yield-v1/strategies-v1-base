// SPDX-License-Identifier: ISC
/**
* By using this software, you understand, acknowledge and accept that Tetu
* and/or the underlying software are provided “as is” and “as available”
* basis and without warranties or representations of any kind either expressed
* or implied. Any use of this open source software released under the ISC
* Internet Systems Consortium license is done at your own risk to the fullest
* extent permissible pursuant to applicable law any and all liability as well
* as all warranties, including any fitness for a particular purpose with respect
* to Tetu and/or the underlying software and the use thereof are disclaimed.
*/
pragma solidity 0.8.19;

import "./CurveStrategyBase.sol";

interface ICurvePool {
  function add_liquidity(uint[2] calldata _amounts, uint _min_mint_amount, bool use_eth) external returns (uint);
}

contract CurveStrategyCbEthEth is CurveStrategyBase {

  string public constant override STRATEGY_NAME = "CurveStrategyCbEthEth";

  // cbETH/ETH
  // deposit https://basescan.org/tx/0x7583d14b88afa43ab8b7e15d9d31959de06e13723c6ac6731bbdc959495f7f37
  // stake https://basescan.org/tx/0xfc84fc13b8d8da175d0a18ebcc8e3c141530cfb4e0084da1c84ac8979fc60e6a
  address public constant POOL = 0x11C1fBd4b3De66bC0565779b35171a6CF3E71f59;

  function _handleEnterToken(address _enterToken, uint256 amount) internal override returns (bool){
    if (amount != 0) {
      _approveIfNeeds(_enterToken, amount, POOL);
      ICurvePool(POOL).add_liquidity([amount, 0], 0, false);
      return true;
    }
    return false;
  }

}
