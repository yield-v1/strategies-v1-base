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

import "../openzeppelin/ERC20Burnable.sol";

contract MockToken is ERC20Burnable {

  uint8 _decimals;

  constructor(
    string memory name_,
    string memory symbol_,
    uint8 decimals_
  ) ERC20(name_, symbol_)  {
  _decimals = decimals_;
  }

  function decimals() public view override returns (uint8) {
    return _decimals;
  }
}
