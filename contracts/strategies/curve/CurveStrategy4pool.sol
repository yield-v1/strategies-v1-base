// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "./CurveStrategyBase.sol";

interface ICurvePool {
  function add_liquidity(uint[2] calldata _amounts, uint _min_mint_amount, bool use_eth) external returns (uint);
}

contract CurveStrategy4pool is CurveStrategyBase {

  string public constant override STRATEGY_NAME = "CurveStrategy4pool";

  // 4pool
//  address public constant POOL = 0xf6C5F01C7F3148891ad0e19DF78743D31E390D1f;
//  address public constant GAUGE = 0x79edc58C471Acf2244B8f93d6f425fD06A439407;

  // cbETH/ETH
  // deposit https://basescan.org/tx/0x7583d14b88afa43ab8b7e15d9d31959de06e13723c6ac6731bbdc959495f7f37
  // stake https://basescan.org/tx/0xfc84fc13b8d8da175d0a18ebcc8e3c141530cfb4e0084da1c84ac8979fc60e6a
  address public constant REWARD_POOL = 0x11C1fBd4b3De66bC0565779b35171a6CF3E71f59;
//  address public constant REWARD_GAUGE = 0xE9c898BA654deC2bA440392028D2e7A194E6dc3e;

  /// @dev xcbeth_f_VAULT
  address public constant REWARD_VAULT = 0xE24f2c64176eD7f9A64841Dc505B1dc87Ed9dD85;
  /// @dev CURVE_CB_ETH_ETH_LP_TOKEN
  address public constant REWARD_VAULT_UNDERLYING = 0x98244d93D42b42aB3E3A4D12A5dc0B3e7f8F32f9;

  function _handleEnterToken(address _enterToken, uint256 amount) internal override returns (bool) {

    _approveIfNeeds(_enterToken, amount, REWARD_POOL);
    ICurvePool(REWARD_POOL).add_liquidity([amount, 0], 0, false);

    // enter to vault
    uint vaultUndAmount = IERC20(REWARD_VAULT_UNDERLYING).balanceOf(address(this));
    if (vaultUndAmount != 0) {
      _approveIfNeeds(REWARD_VAULT_UNDERLYING, vaultUndAmount, REWARD_VAULT);
      ISmartVault(REWARD_VAULT).depositAndInvest(vaultUndAmount);
    }

    // add shares as rewards to the current vault
    uint rewardsShares = IERC20(REWARD_VAULT).balanceOf(address(this));
    if (rewardsShares != 0) {
      address _vault = vault;
      _approveIfNeeds(REWARD_VAULT, rewardsShares, _vault);

      bool isChangePeriod = true;
      uint256 periodFinishForToken = ISmartVault(_vault).periodFinishForToken(REWARD_VAULT);
      if (periodFinishForToken > block.timestamp) {
        uint rewardRateForToken = ISmartVault(_vault).rewardRateForToken(REWARD_VAULT);
        uint left = (periodFinishForToken - block.timestamp) * rewardRateForToken;
        if (left > rewardsShares) {
          isChangePeriod = false;
        }
      }
      if (isChangePeriod) {
        ISmartVault(_vault).notifyTargetRewardAmount(REWARD_VAULT, rewardsShares);
      } else {
        ISmartVault(_vault).notifyRewardWithoutPeriodChange(REWARD_VAULT, rewardsShares);
      }
    }

    // no need to invest assets, we do not compound
    return false;
  }

}
