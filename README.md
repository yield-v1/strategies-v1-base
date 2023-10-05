# How to deposit into vault (xcbeth-f  example)

### Create LP on https://curve.fi/#/base/pools/factory-crypto-1/deposit

All other actions will be done on https://basescan.org/

You will need to click on `Connect to Web3` for make calls.

### Get your exact balance calling balanceOf on https://basescan.org/address/0x98244d93d42b42ab3e3a4d12a5dc0b3e7f8f32f9#readContract

balanceOf(your address)

### Approve spending the LP for the vault on https://basescan.org/address/0x98244d93d42b42ab3e3a4d12a5dc0b3e7f8f32f9#writeContract

Call `approve` with params:
```
spender: 0xE24f2c64176eD7f9A64841Dc505B1dc87Ed9dD85
amount: your balance
```


### Deposit your LP in the vault on https://basescan.org/address/0xe24f2c64176ed7f9a64841dc505b1dc87ed9dd85#writeProxyContract
Call `depositAndInvest` with params:
```
amount: your balance
```

That's all, you started earning yield on your LP tokens!


# How to get earned rewards (xcbeth-f example)

For checking earned amount call `earned()` on https://basescan.org/address/0xe24f2c64176ed7f9a64841dc505b1dc87ed9dd85#readProxyContract
with attributes
```
rt: reward token address
account: your address
```

Call `getAllRewards()` on https://basescan.org/address/0xe24f2c64176ed7f9a64841dc505b1dc87ed9dd85#writeProxyContract

# How to withdraw from vault (xcbeth-f example)


Call `exit()` on https://basescan.org/address/0xe24f2c64176ed7f9a64841dc505b1dc87ed9dd85#writeProxyContract

For partially withdraw call `withdraw()`
