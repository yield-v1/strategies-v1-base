// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "./CurveStrategyBase.sol";


contract CurveStrategy4pool is CurveStrategyBase {

  string public constant override STRATEGY_NAME = "CurveStrategy4pool";


  // 4pool
//  address public constant POOL = 0xf6C5F01C7F3148891ad0e19DF78743D31E390D1f;
  address public constant GAUGE = 0x79edc58C471Acf2244B8f93d6f425fD06A439407;
  // cbETH/ETH
  // deposit https://basescan.org/tx/0x7583d14b88afa43ab8b7e15d9d31959de06e13723c6ac6731bbdc959495f7f37
  // stake https://basescan.org/tx/0xfc84fc13b8d8da175d0a18ebcc8e3c141530cfb4e0084da1c84ac8979fc60e6a
  address public constant REWARD_POOL = 0x11C1fBd4b3De66bC0565779b35171a6CF3E71f59;
  address public constant REWARD_GAUGE = 0xE9c898BA654deC2bA440392028D2e7A194E6dc3e;

  function _handleEnterToken(address /*_enterToken*/, uint256 /*amount*/) internal pure override returns (bool) {
    // todo
    return false;
  }

}
