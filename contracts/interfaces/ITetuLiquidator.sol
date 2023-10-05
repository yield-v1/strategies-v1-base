// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

interface ITetuLiquidator {

  struct PoolData {
    address pool;
    address swapper;
    address tokenIn;
    address tokenOut;
  }

  function CONTROLLABLE_VERSION() external view returns (string memory);

  function LIQUIDATOR_VERSION() external view returns (string memory);

  function ROUTE_LENGTH_MAX() external view returns (uint256);

  function __Controllable_init(address controller_) external;

  function addBlueChipsPools(
    PoolData[] memory _pools,
    bool rewrite
  ) external;

  function addLargestPools(
    PoolData[] memory _pools,
    bool rewrite
  ) external;

  function blueChipsPools(address, address)
  external
  view
  returns (
    address pool,
    address swapper,
    address tokenIn,
    address tokenOut
  );

  function blueChipsTokens(address) external view returns (bool);

  function buildRoute(address tokenIn, address tokenOut)
  external
  view
  returns (
    PoolData[] memory route,
    string memory errorMessage
  );

  function controller() external view returns (address);

  function created() external view returns (uint256);

  function createdBlock() external view returns (uint256);

  function getPrice(
    address tokenIn,
    address tokenOut,
    uint256 amount
  ) external view returns (uint256);

  function getPriceForRoute(
    PoolData[] memory route,
    uint256 amount
  ) external view returns (uint256);

  function increaseRevision(address oldLogic) external;

  function init(address controller_) external;

  function isController(address _value) external view returns (bool);

  function isGovernance(address _value) external view returns (bool);

  function isRouteExist(address tokenIn, address tokenOut)
  external
  view
  returns (bool);

  function largestPools(address)
  external
  view
  returns (
    address pool,
    address swapper,
    address tokenIn,
    address tokenOut
  );

  function liquidate(
    address tokenIn,
    address tokenOut,
    uint256 amount,
    uint256 priceImpactTolerance
  ) external;

  function liquidateWithRoute(
    PoolData[] memory route,
    uint256 amount,
    uint256 priceImpactTolerance
  ) external;

  function previousImplementation() external view returns (address);

  function removeBlueChipPool(address tokenIn, address tokenOut) external;

  function removeLargestPool(address token) external;

  function revision() external view returns (uint256);


}
