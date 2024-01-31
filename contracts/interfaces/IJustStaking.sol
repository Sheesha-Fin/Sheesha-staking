// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.20;

interface IJustStaking {
    /**
     * @dev Deposits user amount
     * @param _amount to be staked
     */
    function deposit(uint256 _amount) external;

    /**
     * @dev Withdraws user deposit and rewards.
     */
    function withdraw() external;

    /**
     * @dev Sets a new maximum total deposit value by contract owner
     */
    function setMaximumTotalDeposit(uint256 _maximumTotalDeposit) external;

    /**
     * @dev Moves unused rewards after toBlock to owner
     */
    function removeReward() external;

    /**
     * @dev Adds reward per a block after funds transfer to contract
     */
    function addReward() external returns (uint256 _cumulativeRewardPerShare);

    /**
     * @dev Calculates depositor reward.
     * @param depositor address
     * @return _rewardAmount
     */
    function depositorReward(
        address depositor
    ) external view returns (uint256 _rewardAmount);

    /**
     * @dev Info of each user that stakes token
     */
    function deposits(
        address user
    ) external view returns (uint256, uint256, uint256);

    /**
     * @dev Returns deposit token address
     */
    function depositToken() external view returns (address);

    /**
     * @dev Returns reward token address
     */
    function rewardToken() external view returns (address);

    /**
     * @dev Returns `from` block number
     */
    function fromBlock() external view returns (uint64);

    /**
     * @dev Returns `to` block number
     */
    function toBlock() external view returns (uint64);

    /**
     * @dev Returns Total block reward amount
     */
    function rewardPerBlock() external view returns (uint256);

    /**
     * @dev Returns Total deposit amount
     */
    function totalDeposit() external view returns (uint256);

    /**
     * @dev Current cumulative reward per share
     */
    function cumulativeRewardPerShare() external view returns (uint256);

    /**
     * @dev Current cumulative blockNumber
     */
    function cumulativeRewardBlockNumber() external view returns (uint64);

    /**
     * @dev Maximum deposit value for all stakings
     */
    function maximumTotalDeposit() external view returns (uint256);

    event Deposit(address indexed, uint256, uint256);
    event Withdraw(address indexed, uint256, uint256);
    event MaximumTotalDepositSet(address indexed, uint256);
    event RewardAdded(address indexed, uint256, uint256);
    event RewardRemoved(address indexed, uint256);
}
