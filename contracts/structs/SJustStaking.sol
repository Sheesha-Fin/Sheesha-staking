// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

struct DepositInfo {
    uint256 amount; // How many deposit tokens the user has provided.
    uint256 prevRewardAmount; // Rewards from previous deposits
    uint256 cumulativeRewardPerShare; // cumulativeRewardPerShare during deposit
}

struct InitializePayload {
    // ERC20 deposit token
    address depositToken;
    // ERC20 token to pay for staking
    address rewardToken;
    // Reward start block number
    uint64 fromBlock;
    // Reward end block number
    uint64 toBlock;
    // The maximum deposit total value
    uint256 maximumTotalDeposit;
}
