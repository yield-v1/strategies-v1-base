# How to deposit into vault (curve 4pool example)

### Create LP
https://curve.fi/#/base/pools/factory-v2-1/deposit

All other actions will be done on https://basescan.org/

You will need to click on `Connect to Web3` for make calls.

### Get your exact balance of LP calling balanceOf
https://basescan.org/address/0xf6c5f01c7f3148891ad0e19df78743d31e390d1f#readContract

`balanceOf(your address)`

### Approve spending the LP for the vault
https://basescan.org/address/0xf6c5f01c7f3148891ad0e19df78743d31e390d1f#writeContract
Call `approve()` with params:
```
spender: 0x929c79Bc01fbCEaE157F1d59D8d924B690170DdA
amount: your balance
```


### Deposit your LP in the vault 
https://basescan.org/address/0x929c79bc01fbceae157f1d59d8d924b690170dda#writeProxyContract

Call `depositAndInvest()` with params:
```
amount: your balance
```

You started earning yield on your LP tokens!
For depositing in another vault just make the same operations on different contract.


### How to get earned rewards amount
https://basescan.org/address/0x929c79bc01fbceae157f1d59d8d924b690170dda#readProxyContract
For checking earned amount call `earned()` with attributes
```
rt: reward token address
account: your address
```

### Claim rewards
https://basescan.org/address/0x929c79bc01fbceae157f1d59d8d924b690170dda#writeProxyContract
Call `getAllRewards()`


#### How to withdraw from vault

https://basescan.org/address/0x929c79bc01fbceae157f1d59d8d924b690170dda#writeProxyContract
Call `exit()`

For partially withdraw call `withdraw()` with amount of shares.

For getting your share balance call `balanceOf()` on the vault contract.
