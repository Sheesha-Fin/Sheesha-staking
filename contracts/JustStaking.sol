// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.20;

import {JustStakingAdmin} from "./abstract/JustStakingAdmin.sol";
import {DepositInfo} from "./structs/SJustStaking.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

contract JustStaking is JustStakingAdmin {
    using SafeCast for uint256;

    /**
     * @dev Deposits user amount
     * @param _amount to be staked
     */
    function deposit(uint256 _amount) external override nonReentrant {
        require(block.number >= fromBlock && block.number < toBlock, "BN");

        address _sender = _msgSender();
        DepositInfo storage _deposit = deposits[_sender];

        require(
            _amount > 0 && _amount <= maximumTotalDeposit - totalDeposit,
            "DA"
        );

        uint256 _cumulativeRewardPerShare;
        if (totalDeposit == 0) {
            // The first deposit
            assert(cumulativeRewardPerShare == 0);
            cumulativeRewardBlockNumber = block.number.toUint64();
            _cumulativeRewardPerShare = addReward();
        } else {
            _cumulativeRewardPerShare = _updateCumulativeReward();
        }

        _deposit.prevRewardAmount = _depositorReward(
            _deposit,
            _cumulativeRewardPerShare
        );
        _deposit.cumulativeRewardPerShare = _cumulativeRewardPerShare;
        _deposit.amount += _amount;
        totalDeposit += _amount;

        _safeTransferFrom(depositToken, _sender, address(this), _amount);
        emit Deposit(_sender, _amount, _deposit.amount);
    }

    /**
     * @dev Withdraws user deposit and rewards.
     */
    function withdraw() external override nonReentrant {
        require(block.number > toBlock, "BN");

        address _sender = _msgSender();
        DepositInfo storage _deposit = deposits[_sender];

        require(_deposit.amount > 0, "ZA");

        uint256 _rewardAmount = _depositorReward(
            _deposit,
            _updateCumulativeReward()
        );
        uint256 _amount = _deposit.amount;
        _deposit.amount = 0;
        _deposit.prevRewardAmount = 0;
        totalDeposit -= _amount;

        _safeTransferFrom(depositToken, address(this), _sender, _amount);
        _safeTransferFrom(rewardToken, address(this), _sender, _rewardAmount);

        emit Withdraw(_sender, _amount, _rewardAmount);
    }

    /**
     * @dev Calculates depositor reward.
     * @param depositor address
     * @return _rewardAmount
     */
    function depositorReward(
        address depositor
    ) external view override returns (uint256 _rewardAmount) {
        DepositInfo storage _deposit = deposits[depositor];
        if (_deposit.amount > 0) {
            (uint256 _cumulativeReward, , ) = _calculateCumulativeReward();
            _rewardAmount = _depositorReward(_deposit, _cumulativeReward);
        }
    }

    function _depositorReward(
        DepositInfo storage _deposit,
        uint256 _cumulativeRewardPerShare
    ) internal view returns (uint256 _rewardAmount) {
        _rewardAmount = _deposit.prevRewardAmount;
        if (_deposit.amount > 0) {
            _rewardAmount += _normalizeReward(
                _deposit.amount,
                _cumulativeRewardPerShare - _deposit.cumulativeRewardPerShare
            );
        }
    }
}
