// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "../../ProxyStrategyBase.sol";
import "../../interfaces/ITetuLiquidator.sol";

interface IGauge {

  function lp_token() external view returns (address);

  function balanceOf(address) external view returns (uint);

  function reward_tokens(uint id) external view returns (address);

  function reward_count() external view returns (uint);

  function claim_rewards(address _addr) external;

  function deposit(uint _value) external;

  function withdraw(uint _value, address _user, bool _claim_rewards) external;
}

/// @title Contract for Curve
abstract contract CurveStrategyBase is ProxyStrategyBase {
  using SafeERC20 for IERC20;

  /// @dev Curve pools have different interfaces. This kinds will reflect different behaviour for them.
  enum KindOfPool {
    KIND_0,
    KIND_1,
    KIND_2,
    KIND_3,
    KIND_4,
    KIND_5,
    KIND_6,
    KIND_7,
    KIND_8,
    KIND_9
  }

  // ************ CONSTANTS **********************

  /// @notice Version of the contract
  string public constant VERSION = "1.0.0";
  uint private constant _PLATFORM = 1001;
  uint256 public constant PERF_FEE_DENOMINATOR = 100_000;
  uint private constant PRICE_IMPACT_TOLERANCE = 5_000;
  ITetuLiquidator public constant TETU_LIQUIDATOR = ITetuLiquidator(0x22e2625F9d8c28CB4BcE944E9d64efb4388ea991);

  // ************ VARIABLES **********************

  address public perfFeeRecipient;
  /// @dev PERF_FEE_DENOMINATOR denominator, 10% by default
  uint public perfFeeRatio;
  /// @notice Curve gauge rewards pool
  address public gauge;
  address public enterToken;
  uint public kindOfPool;

  //slither-disable-next-line unused-state
  uint256[45] private ______gap;

  // ************ INIT **********************

  /// @notice Initialize contract after setup it as proxy implementation
  function initialize(
    address controller_,
    address vault_,
    address perfFeeRecipient_,
    address gauge_,
    address enterToken_,
    KindOfPool kindOfPool_
  ) public initializer {
    address _underlying = ISmartVault(vault_).underlying();
    ProxyStrategyBase.initializeStrategyBase(
      controller_,
      _underlying,
      vault_
    );

    perfFeeRatio = 10_000;

    perfFeeRecipient = perfFeeRecipient_;
    gauge = gauge_;
    enterToken = enterToken_;
    kindOfPool = uint(kindOfPool_);

    address lpToken = IGauge(gauge_).lp_token();
    require(lpToken == _underlying, "wrong underlying");
  }

  // ************* VIEWS *******************

  function platform() external override pure returns (uint) {
    return _PLATFORM;
  }

  /// @notice Strategy balance in the Gauge pool
  /// @return bal Balance amount in underlying tokens
  function rewardPoolBalance() public virtual override view returns (uint256 bal) {
    bal = IGauge(gauge).balanceOf(address(this));
  }

  function rewardTokens() public view virtual returns (address[] memory) {
    address _gauge = gauge;
    uint count = IGauge(_gauge).reward_count();
    address[] memory rts = new address[](count);
    for (uint i = 0; i < count; ++i) {
      rts[i] = IGauge(_gauge).reward_tokens(i);
    }
    return rts;
  }

  // ************ OPERATOR ACTIONS **************************

  function setPerfFeeRecipient(address adr) external {
    require(_isGovernance(msg.sender), '!gov');
    perfFeeRecipient = adr;
  }

  function setPerfFeeRatio(uint value) external {
    require(_isGovernance(msg.sender), '!gov');
    // can not be higher than 10%
    require(value <= PERF_FEE_DENOMINATOR / 10, '!gov');
    perfFeeRatio = value;
  }

  /// @notice Claim rewards from external project and send them to FeeRewardForwarder
  function doHardWork() external override hardWorkers {
    _doHardWork();
  }

  function _doHardWork() internal virtual {

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
      uint toPerfFee = enterTokenBalance * perfFeeRatio / PERF_FEE_DENOMINATOR;
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
  function _depositToPool(uint256 amount) internal virtual override {
    address _underlying = underlying;
    address _gauge = gauge;

    _approveIfNeeds(_underlying, amount, _gauge);

    IGauge(_gauge).deposit(amount);
  }

  /// @dev Withdraw underlying and reward from Gauge pool
  /// @param amount Deposit amount
  function _withdrawAndClaimFromPool(uint256 amount) internal virtual override {
    IGauge(gauge).withdraw(amount, address(this), true);
  }

  /// @dev Exit from external project without caring about rewards
  ///      For emergency cases only!
  function _emergencyWithdrawFromPool() internal virtual override {
    IGauge(gauge).withdraw(rewardPoolBalance(), address(this), false);
  }

  function _handleEnterToken(address _enterToken, uint256 amount) internal virtual returns (bool needToInvest);
}
