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

import "./openzeppelin/Proxy.sol";
import "./openzeppelin/Address.sol";


/// @title OpenZeppelin https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v3.4/contracts/proxy/UpgradeableProxy.sol
/// @dev This contract implements an upgradeable proxy. It is upgradeable because calls are delegated to an
///      implementation address that can be changed. This address is stored in storage in the location specified by
///      https://eips.ethereum.org/EIPS/eip-1967[EIP1967], so that it doesn't conflict with the storage layout of the
///      implementation behind the proxy.
///      Upgradeability is only provided internally through {_upgradeTo}. For an externally upgradeable proxy see
///      {TransparentUpgradeableProxy}.
abstract contract UpgradeableProxy is Proxy {

  /// @dev Initializes the upgradeable proxy with an initial implementation specified by `_logic`.
  ///      If `_data` is nonempty, it's used as data in a delegate call to `_logic`. This will typically be an encoded
  ///      function call, and allows initializating the storage of the proxy like a Solidity constructor.
  constructor(address _logic) payable {
    assert(_IMPLEMENTATION_SLOT == bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1));
    _setImplementation(_logic);
  }

  /// @dev Emitted when the implementation is upgraded.
  event Upgraded(address indexed implementation);

  ///@dev Storage slot with the address of the current implementation.
  ///     This is the keccak-256 hash of "eip1967.proxy.implementation" subtracted by 1, and is
  ///     validated in the constructor.
  bytes32 private constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

  /// @dev Returns the current implementation address.
  function _implementation() internal view virtual override returns (address impl) {
    bytes32 slot = _IMPLEMENTATION_SLOT;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      impl := sload(slot)
    }
  }

  /// @dev Upgrades the proxy to a new implementation.
  ///      Emits an {Upgraded} event.
  function _upgradeTo(address newImplementation) internal virtual {
    _setImplementation(newImplementation);
    emit Upgraded(newImplementation);
  }

  /// @dev Stores a new address in the EIP1967 implementation slot.
  function _setImplementation(address newImplementation) private {
    require(Address.isContract(newImplementation), "UpgradeableProxy: new implementation is not a contract");

    bytes32 slot = _IMPLEMENTATION_SLOT;

    // solhint-disable-next-line no-inline-assembly
    assembly {
      sstore(slot, newImplementation)
    }
  }
}
