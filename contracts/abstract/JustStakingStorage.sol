// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.20;

// solhint-disable-next-line max-line-length
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
// solhint-disable-next-line max-line-length
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

import {IJustStaking} from "../interfaces/IJustStaking.sol";
import {DepositInfo, InitializePayload} from "../structs/SJustStaking.sol";

/// @title JustStakingStorage base contract containing all JustStaking storage variables.
// solhint-disable-next-line max-states-count
abstract contract JustStakingStorage is
    IJustStaking,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeCast for uint256;

    uint256 public constant MULTIPLIER = 1e16;

    // The DEPOSIT TOKEN
    address public override depositToken;
    // The REWARD TOKEN
    address public override rewardToken;
    // Block number when bonus period starts.
    uint64 public override fromBlock;
    // Block number when bonus period ends.
    uint64 public override toBlock;
    // Reward tokens per block.
    uint256 public override rewardPerBlock;
    // Current DEPOSIT TOKEN balance.
    uint256 public override totalDeposit;
    // Current cumulative rewardPerShare * MULTIPLIER.
    uint256 public override cumulativeRewardPerShare;
    // Current cumulative blockNumber.
    uint64 public override cumulativeRewardBlockNumber;
    // Info of each user that stakes token.
    mapping(address => DepositInfo) public override deposits;
    // Minimal deposit value for staking.
    uint256 public override maximumTotalDeposit;
    // Reward tokens locked by cumulativeRewardBlockNumber.
    uint256 public cumulativeReward;
    // storage gap for future needs
    uint256[52] internal _gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes storage.
     * @param payload Payload in InitializePayload struct
     */
    function initialize(
        InitializePayload calldata payload
    ) external initializer {
        require(
            payload.fromBlock > block.number &&
                payload.toBlock > payload.fromBlock,
            "BN"
        );
        require(
            payload.depositToken != address(0) &&
                payload.rewardToken != address(0),
            "ZA"
        );
        require(payload.depositToken != payload.rewardToken, "ST");
        require(payload.maximumTotalDeposit > 0, "MTD");

        __Ownable_init_unchained(msg.sender);
        __ReentrancyGuard_init_unchained();

        depositToken = payload.depositToken;
        rewardToken = payload.rewardToken;
        fromBlock = payload.fromBlock;
        toBlock = payload.toBlock;
        maximumTotalDeposit = payload.maximumTotalDeposit;
    }

    function _updateCumulativeReward()
        internal
        returns (uint256 _cumulativeRewardPerShare)
    {
        (
            _cumulativeRewardPerShare,
            cumulativeRewardBlockNumber,
            cumulativeReward
        ) = _calculateCumulativeReward();
        cumulativeRewardPerShare = _cumulativeRewardPerShare;
    }

    function _calculateCumulativeReward()
        internal
        view
        returns (
            uint256 _cumulativeRewardPerShare,
            uint64 _blockNumber,
            uint256 _calculatedCumulativeReward
        )
    {
        uint64 _fromBlock = Math
            .max(cumulativeRewardBlockNumber, fromBlock)
            .toUint64();
        _cumulativeRewardPerShare = cumulativeRewardPerShare;
        _blockNumber = Math.min(block.number, toBlock).toUint64();
        if (
            _blockNumber > _fromBlock &&
            _blockNumber <= toBlock &&
            _blockNumber != cumulativeRewardBlockNumber
        ) {
            _cumulativeRewardPerShare = __calculateCumulativeRewardPerShare(
                _cumulativeRewardPerShare,
                rewardPerBlock,
                totalDeposit,
                _fromBlock,
                _blockNumber
            );
            _calculatedCumulativeReward =
                cumulativeReward +
                (_blockNumber - _fromBlock) *
                rewardPerBlock;
        }
    }

    function _normalizeReward(
        uint256 amount,
        uint256 _cumulativeRewardPerShare
    ) internal pure returns (uint256 _rewardAmount) {
        _rewardAmount = (amount * _cumulativeRewardPerShare) / MULTIPLIER;
    }

    function __calculateCumulativeRewardPerShare(
        uint256 _cumulativeRewardPerShare,
        uint256 _rewardPerBlock,
        uint256 _totalDeposit,
        uint64 _fromBlock,
        uint64 _toBlock
    ) private pure returns (uint256 __cumulativeRewardPerShare) {
        __cumulativeRewardPerShare = _cumulativeRewardPerShare;
        if (_toBlock > _fromBlock && _totalDeposit > 0) {
            __cumulativeRewardPerShare +=
                ((_rewardPerBlock * (_toBlock - _fromBlock)) * MULTIPLIER) /
                _totalDeposit;
        }
    }
}
