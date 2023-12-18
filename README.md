# Sheesha Staking simple staking contract

Sheesha Staking Version 1, Core Smart Contracts.
Allows staking deposit token and get rewards from `fromBlock` to `toBlock`.
A deposit and rewards can be withdrawn after `toBlock` only.
Call removeReward method to withdraw unused rewards to owner address after `toBlock` and all deposits withdrawn.

## Quick Start

### Create staking instance

Update payload

```

  const payload = {
    depositToken: "0x388C818CA8B9251b393131C08a736A67ccB19297",
    rewardToken: "0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326",
    fromBlock: fromBlockNumber,
    toBlock: toBlockNumber,
    maximumTotalDeposit: "1000000000000000000000000000",
  };

```

```

yarn hardhat run scripts.deploy.ts --network mumbai

```

### Load rewards

Thansfer reward tokens to the contract before `toBlock``.
addReward method should be called after transfer total rewards to the contract.

### Do a deposit

Approve token amount to the contract address
Call `deposit(amount)` method

### Withdraw a deposit and rewards

Call `withdraw() method after `toBlock`

### Estimate current depositor rewards

Call `depositorReward(address) method to get reward amount by this moment

### Get maximum allowed deposit amount

Amount = `maxTotalDeposit()` - `totalDeposit()`
