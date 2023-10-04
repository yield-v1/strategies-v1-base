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


import "./openzeppelin/Math.sol";
import "./openzeppelin/SafeERC20.sol";
import "./ControllableV2.sol";
import "./interfaces/IStrategy.sol";
import "./interfaces/IBookkeeper.sol";
import "./interfaces/ISmartVault.sol";

/// @title Abstract contract for base strategy functionality
///        Implementation must support proxy
/// @author belbix
abstract contract ProxyStrategyBase is IStrategy, ControllableV2 {
  using SafeERC20 for IERC20;

  // -------- CONSTANTS ---------

  uint internal constant _TOLERANCE_DENOMINATOR = 1000;

  // -------- VARIABLES ---------

  address public override underlying;
  address public override vault;
  bool public override pausedInvesting;
  uint public toleranceNumerator;
  mapping(address => bool) public override unsalvageableTokens;


  //slither-disable-next-line unused-state
  uint256[45] private ______gap;

  //************************ MODIFIERS **************************

  /// @dev Only for linked Vault or Governance/Controller.
  ///      Use for functions that should have strict access.
  modifier restricted() {
    address c = _controller();
    require(msg.sender == vault
    || msg.sender == c
    || IController(c).governance() == msg.sender,
      "SB: Not Gov or Vault");
    _;
  }

  /// @dev Extended strict access with including HardWorkers addresses
  ///      Use for functions that should be called by HardWorkers
  modifier hardWorkers() {
    address c = _controller();
    require(msg.sender == vault
    || msg.sender == c
    || IController(c).isHardWorker(msg.sender)
    || IController(c).governance() == msg.sender,
      "SB: Not HW or Gov or Vault");
    _;
  }

  /// @dev Allow operation only for Controller
  modifier onlyController() {
    require(_controller() == msg.sender, "SB: Not controller");
    _;
  }

  /// @dev This is only used in `investAllUnderlying()`
  ///      The user can still freely withdraw from the strategy
  modifier onlyNotPausedInvesting() {
    require(!pausedInvesting, "SB: Paused");
    _;
  }

  /// @notice Initialize contract after setup it as proxy implementation
  /// @param _controller Controller address
  /// @param _underlying Underlying token address
  /// @param _vault SmartVault address that will provide liquidity
  function initializeStrategyBase(
    address _controller,
    address _underlying,
    address _vault
  ) public initializer {
    ControllableV2.initializeControllable(_controller);

    require(ISmartVault(_vault).underlying() == _underlying, "SB: Wrong underlying");
    require(IControllable(_vault).isController(_controller), "SB: Wrong controller");

    underlying = _underlying;
    vault = _vault;

    unsalvageableTokens[_underlying] = true;
    toleranceNumerator = 999;
  }

  // *************** VIEWS ****************

  /// @notice Underlying balance of this contract
  /// @return Balance of underlying token
  function underlyingBalance() external view override returns (uint) {
    return IERC20(underlying).balanceOf(address(this));
  }

  /// @notice Return underlying balance + balance in the reward pool
  /// @return Sum of underlying balances
  function investedUnderlyingBalance() external override virtual view returns (uint) {
    // Adding the amount locked in the reward pool and the amount that is somehow in this contract
    // both are in the units of "underlying"
    // The second part is needed because there is the emergency exit mechanism
    // which would break the assumption that all the funds are always inside of the reward pool
    return rewardPoolBalance() + IERC20(underlying).balanceOf(address(this));
  }

  //******************** GOVERNANCE *******************

  /// @notice In case there are some issues discovered about the pool or underlying asset
  ///         Governance can exit the pool properly
  ///         The function is only used for emergency to exit the pool
  ///         Pause investing
  function emergencyExit() external override hardWorkers {
    _emergencyExitRewardPool();
    pausedInvesting = true;
  }

  /// @notice Pause investing into the underlying reward pools
  function pauseInvesting() external override hardWorkers {
    pausedInvesting = true;
  }

  /// @notice Resumes the ability to invest into the underlying reward pools
  function continueInvesting() external override restricted {
    pausedInvesting = false;
  }

  /// @notice Controller can claim coins that are somehow transferred into the contract
  ///         Note that they cannot come in take away coins that are used and defined in the strategy itself
  /// @param recipient Recipient address
  /// @param recipient Token address
  /// @param recipient Token amount
  function salvage(address recipient, address token, uint amount)
  external override onlyController {
    // To make sure that governance cannot come in and take away the coins
    require(!unsalvageableTokens[token], "SB: Not salvageable");
    IERC20(token).safeTransfer(recipient, amount);
  }

  /// @notice Withdraws all the asset to the vault
  function withdrawAllToVault() external override hardWorkers {
    _exitRewardPool();
    IERC20(underlying).safeTransfer(vault, IERC20(underlying).balanceOf(address(this)));
  }

  /// @notice Withdraws some asset to the vault
  /// @param amount Asset amount
  function withdrawToVault(uint amount) external override hardWorkers {
    address _underlying = underlying;
    // Typically there wouldn't be any amount here
    // however, it is possible because of the emergencyExit
    uint uBalance = IERC20(_underlying).balanceOf(address(this));
    if (amount > uBalance) {
      // While we have the check above, we still using SafeMath below
      // for the peace of mind (in case something gets changed in between)
      uint needToWithdraw = amount - uBalance;
      uint toWithdraw = Math.min(rewardPoolBalance(), needToWithdraw);
      _withdrawAndClaimFromPool(toWithdraw);
    }
    uBalance = IERC20(_underlying).balanceOf(address(this));
    uint amountAdjusted = Math.min(amount, uBalance);
    require(amountAdjusted > amount * toleranceNumerator / _TOLERANCE_DENOMINATOR, "SB: Withdrew too low");
    IERC20(_underlying).safeTransfer(vault, amountAdjusted);
  }

  /// @notice Stakes everything the strategy holds into the reward pool
  function investAllUnderlying() external override hardWorkers onlyNotPausedInvesting {
    _investAllUnderlying();
  }

  /// @dev Set withdraw loss tolerance numerator
  function setToleranceNumerator(uint numerator) external restricted {
    require(numerator <= _TOLERANCE_DENOMINATOR, "SB: Too high");
    toleranceNumerator = numerator;
  }

  // ***************** INTERNAL ************************

  /// @notice Stakes everything the strategy holds into the reward pool
  function _investAllUnderlying() internal {
    // this check is needed, because most of the SNX reward pools will revert if
    // you try to stake(0).
    uint uBalance = IERC20(underlying).balanceOf(address(this));
    if (uBalance > 0) {
      _depositToPool(uBalance);
    }
  }

  /// @dev Withdraw everything from external pool
  function _exitRewardPool() internal virtual {
    uint bal = rewardPoolBalance();
    if (bal != 0) {
      _withdrawAndClaimFromPool(bal);
    }
  }

  /// @dev Withdraw everything from external pool without caring about rewards
  function _emergencyExitRewardPool() internal {
    uint bal = rewardPoolBalance();
    if (bal != 0) {
      _emergencyWithdrawFromPool();
    }
  }

  function _approveIfNeeds(address token, uint amount, address spender) internal {
    if (IERC20(token).allowance(address(this), spender) < amount) {
      IERC20(token).safeApprove(spender, 0);
      IERC20(token).safeApprove(spender, type(uint).max);
    }
  }

  //******************** VIRTUAL *********************
  // This functions should be implemented in the strategy contract

  function rewardPoolBalance() public virtual view returns (uint);

  //slither-disable-next-line dead-code
  function _depositToPool(uint amount) internal virtual;

  //slither-disable-next-line dead-code
  function _withdrawAndClaimFromPool(uint amount) internal virtual;

  //slither-disable-next-line dead-code
  function _emergencyWithdrawFromPool() internal virtual;

}
