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

import "../../third_party/curve/IGauge.sol";
import "../../third_party/curve/ICurveLpToken.sol";
import "../../ProxyStrategyBase.sol";
import "../../interfaces/ITetuLiquidator.sol";

/// @title Contract for Curve
abstract contract CurveStrategyBase is ProxyStrategyBase {
  using SafeERC20 for IERC20;

  // ************ CONSTANTS **********************

  /// @notice Version of the contract
  string public constant VERSION = "1.0.0";
  uint private constant _PLATFORM = 1001;
  uint256 public constant PERF_FEE = 10;
  uint private constant PRICE_IMPACT_TOLERANCE = 5_000;
  ITetuLiquidator public constant TETU_LIQUIDATOR = ITetuLiquidator(0x22e2625F9d8c28CB4BcE944E9d64efb4388ea991);

  // ************ VARIABLES **********************

  address public perfFeeRecipient;
  /// @notice Curve gauge rewards pool
  address public gauge;
  address public enterToken;

  //slither-disable-next-line unused-state
  uint256[47] private ______gap;

  // ************ INIT **********************

  /// @notice Initialize contract after setup it as proxy implementation
  function initialize(
    address controller_,
    address vault_,
    address perfFeeRecipient_,
    address gauge_,
    address enterToken_
  ) public initializer {
    address _underlying = ISmartVault(vault_).underlying();
    ProxyStrategyBase.initializeStrategyBase(
      controller_,
      _underlying,
      vault_
    );

    perfFeeRecipient = perfFeeRecipient_;
    gauge = gauge_;
    enterToken = enterToken_;

    address lpToken = IGauge(gauge_).lp_token();
    require(lpToken == _underlying, "wrong underlying");
  }

  // ************* VIEWS *******************

  function platform() external override pure returns (uint) {
    return _PLATFORM;
  }

  /// @notice Strategy balance in the Gauge pool
  /// @return bal Balance amount in underlying tokens
  function rewardPoolBalance() public override view returns (uint256 bal) {
    bal = IGauge(gauge).balanceOf(address(this));
  }

  function rewardTokens() public view returns (address[] memory) {
    address _gauge = gauge;
    uint count = IGauge(_gauge).reward_count();
    address[] memory rts = new address[](count);
    for (uint i = 0; i < count; ++i) {
      rts[i] = IGauge(_gauge).reward_tokens(i);
    }
    return rts;
  }

  // ************ OPERATOR ACTIONS **************************

  /// @notice Claim rewards from external project and send them to FeeRewardForwarder
  function doHardWork() external override hardWorkers {

    address[] memory rts = rewardTokens();
    address _enterToken = enterToken;

    uint256 enterTokenBalanceBefore = IERC20(_enterToken).balanceOf(address(this));

    IGauge(gauge).claim_rewards(address(this));


    for (uint256 i = 0; i < rts.length; i++) {
      address rt = rts[i];
      uint256 amount = IERC20(rt).balanceOf(address(this));
      if (amount != 0) {

        // liquidate all to underlying
        if (_enterToken != rt) {
          _approveIfNeeds(rt, amount, address(TETU_LIQUIDATOR));
          TETU_LIQUIDATOR.liquidate(rt, _enterToken, amount, PRICE_IMPACT_TOLERANCE);
        }
      }
    }

    uint256 enterTokenBalance = IERC20(_enterToken).balanceOf(address(this)) - enterTokenBalanceBefore;

    if (enterTokenBalance != 0) {
      uint toPerfFee = enterTokenBalance * PERF_FEE / 100;
      if (toPerfFee != 0) {
        IERC20(_enterToken).safeTransfer(perfFeeRecipient, toPerfFee);
      }

      uint toCompound = enterTokenBalance - toPerfFee;
      bool invest = _handleEnterToken(_enterToken, toCompound);
      if (invest) {
        _investAllUnderlying();
      }
    }
  }

  // ************ INTERNAL LOGIC IMPLEMENTATION **************************

  /// @dev Deposit underlying to Gauge pool
  /// @param amount Deposit amount
  function _depositToPool(uint256 amount) internal override {
    address _underlying = underlying;
    address _gauge = gauge;

    _approveIfNeeds(_underlying, amount, _gauge);

    IGauge(_gauge).deposit(amount);
  }

  /// @dev Withdraw underlying and reward from Gauge pool
  /// @param amount Deposit amount
  function _withdrawAndClaimFromPool(uint256 amount) internal override {
    IGauge(gauge).withdraw(amount, true);
  }

  /// @dev Exit from external project without caring about rewards
  ///      For emergency cases only!
  function _emergencyWithdrawFromPool() internal override {
    IGauge(gauge).withdraw(rewardPoolBalance(), false);
  }

  function _handleEnterToken(address _enterToken, uint256 amount) internal virtual returns (bool needToInvest);
}
