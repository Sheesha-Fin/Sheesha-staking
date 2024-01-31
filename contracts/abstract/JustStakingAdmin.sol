// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.20;

import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {JustStakingStorage, Math} from "./JustStakingStorage.sol";

/// @title JustStakingAdmin base contract containing all admin methods.
abstract contract JustStakingAdmin is JustStakingStorage {
    using SafeERC20 for IERC20;

    /**
     * @dev Sets a new maximum total deposit value by contract owner
     */
    function setMaximumTotalDeposit(uint256 _maximumTotalDeposit) external override onlyOwner {
        require(_maximumTotalDeposit != maximumTotalDeposit, "SV");
        maximumTotalDeposit =_maximumTotalDeposit;
        emit MaximumTotalDepositSet(_msgSender(), _maximumTotalDeposit);
    }

    /**
     * @dev Moves unused rewards after toBlock to owner
     */
    function removeReward() external override {
        require(block.number > toBlock, "BN");
        require(totalDeposit == 0, "DA");

        uint256 balance = _rewardBalance();
        require(balance > 0, "ZA");

        _safeTransferFrom(rewardToken, address(this), owner(), balance);

        emit RewardRemoved(owner(), balance);
    }

    /**
     * @dev Adds reward per a block after funds transfer to contract
     */
    function addReward()
        public
        override
        returns (uint256 _cumulativeRewardPerShare)
    {
        require(block.number < toBlock, "BN");
        _cumulativeRewardPerShare = _updateCumulativeReward();
        uint256 _rewardPerBlock = rewardPerBlock;
        rewardPerBlock =
            (_rewardBalance() - cumulativeReward) /
            (toBlock - Math.max(fromBlock, cumulativeRewardBlockNumber));
        require(_rewardPerBlock != rewardPerBlock, "SV");
        emit RewardAdded(_msgSender(), _rewardPerBlock, rewardPerBlock);
    }

    function _safeTransferFrom(
        address token,
        address from,
        address to,
        uint256 amount
    ) internal {
        IERC20 tkn = IERC20(token);
        uint256 fromBalance = IERC20(tkn).balanceOf(from);
        uint256 toBalance = IERC20(tkn).balanceOf(to);
        if (from == address(this)) {
            tkn.safeTransfer(to, amount);
        } else {
            tkn.safeTransferFrom(from, to, amount);
        }
        require(fromBalance - tkn.balanceOf(from) == amount, "BFB");
        require(tkn.balanceOf(to) - toBalance == amount, "BTB");
    }

    function _rewardBalance() internal view returns (uint256 _balance) {
        _balance = IERC20(rewardToken).balanceOf(address(this));
    }
}
