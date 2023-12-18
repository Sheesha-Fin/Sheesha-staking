import { expect } from "chai";
import { Signer, toBigInt } from "ethers";
import hre = require("hardhat");
import { ERC20Mock, ERC20V2Mock, JustStaking } from "../../typechain";
const { ethers, network, upgrades } = hre;

const future = async (blocks: number) => {
  for (let i = 0; i < blocks; i++) {
    await network.provider.send("evm_mine");
  }
};

describe("JustStaking integration test", function () {
  this.timeout(0);

  let user: Signer;
  let user2: Signer;
  let owner: Signer;
  let ownerAddr: string;
  let userAddr: string;
  let user2Addr: string;
  let justStaking: JustStaking;
  let justStakingAddr: string;

  let fromBlockNumber: number;
  let toBlockNumber: number;

  let usdt: ERC20Mock;
  let usdc: ERC20V2Mock;
  let usdtAddr: string;
  let usdcAddr: string;

  let usdtBalance: bigint;
  let usdcBalance: bigint;

  beforeEach("Setting up for JustStaking function test", async function () {
    if (hre.network.name !== "hardhat") {
      console.error("Test Suite is meant to be run on hardhat only");
      process.exit(1);
    }

    [owner, user, user2] = await ethers.getSigners();
    ownerAddr = await owner.getAddress();
    userAddr = await user.getAddress();
    user2Addr = await user2.getAddress();

    // #region create tokens.

    const fERC20MockFactory = await ethers.getContractFactory("ERC20Mock");
    const fERC20V2MockFactory = await ethers.getContractFactory("ERC20V2Mock");

    usdt = await fERC20MockFactory.deploy("USDT");
    usdc = await fERC20V2MockFactory.deploy("USDC");
    usdtAddr = await usdt.getAddress();
    usdcAddr = await usdc.getAddress();

    usdtBalance = await usdt.balanceOf(ownerAddr);
    usdcBalance = await usdc.balanceOf(ownerAddr);

    // #endregion create tokens.

    // #region create staking.

    fromBlockNumber = (await ethers.provider.getBlockNumber()) + 10;
    toBlockNumber = fromBlockNumber + 1000;

    const payload = {
      depositToken: usdtAddr,
      rewardToken: usdcAddr,
      fromBlock: fromBlockNumber,
      toBlock: toBlockNumber,
      maximumTotalDeposit: usdtBalance / 2n,
    };

    const fJustStakingFactory = await ethers.getContractFactory("JustStaking");
    justStaking = await upgrades.deployProxy(fJustStakingFactory, [payload]);
    await justStaking.waitForDeployment();
    justStakingAddr = await justStaking.getAddress();

    await expect(justStaking.connect(user).initialize(payload)).to.be.reverted;

    // #endregion create staking.

    // Deposit before fromBlock
    await expect(
      justStaking.connect(user).deposit(usdtBalance),
    ).to.be.revertedWith("BN");

    await future(10);

    // #region transfer usdt and usdc token to users.

    await usdt.connect(owner).transfer(userAddr, usdtBalance / 2n);
    await usdt.connect(owner).transfer(user2Addr, usdtBalance / 2n);
    await usdt.connect(user).approve(justStakingAddr, usdtBalance / 2n);
    await usdt.connect(user2).approve(justStakingAddr, usdtBalance / 2n);

    // #endregion transfer usdt and usdc token to users.
  });

  it("#0: Initial staking check", async () => {
    expect(await justStaking.owner()).to.be.eq(ownerAddr);
    expect(await justStaking.depositToken()).to.be.eq(usdtAddr);
    expect(await justStaking.rewardToken()).to.be.eq(usdcAddr);
    expect(await justStaking.fromBlock()).to.be.eq(fromBlockNumber);
    expect(await justStaking.toBlock()).to.be.eq(toBlockNumber);
    expect(await justStaking.maximumTotalDeposit()).to.be.eq(usdtBalance / 2n);
    expect(await justStaking.totalDeposit()).to.be.eq(0);
    expect(await justStaking.rewardPerBlock()).to.be.eq(0);
    expect(await justStaking.cumulativeRewardPerShare()).to.be.eq(0);
    expect(await justStaking.cumulativeRewardBlockNumber()).to.be.eq(0);
    expect(await justStaking.cumulativeReward()).to.be.eq(0);
    expect(
      (await justStaking.toBlock()) - (await justStaking.fromBlock()),
    ).to.be.eq(1000n);
    expect(await justStaking.depositorReward(userAddr)).to.be.eq(0);

    await expect(justStaking.connect(user).addReward()).to.be.revertedWith(
      "SV",
    );

    await expect(justStaking.connect(user).removeReward()).to.be.revertedWith(
      "BN",
    );
  });

  it("#1: Transfer ownership from not owner", async () => {
    await expect(justStaking.connect(user).transferOwnership(user2Addr)).to.be
      .reverted;
  });

  it("#2: Deposit before loading rewards", async () => {
    await expect(justStaking.connect(user).deposit(100)).to.be.revertedWith(
      "SV",
    );
  });

  it("#3: Deposit zero", async () => {
    await expect(justStaking.connect(user).deposit(0)).to.be.revertedWith("DA");
  });

  it("#4: Deposit the amount > max deposit", async () => {
    await expect(
      justStaking.connect(user).deposit(usdtBalance),
    ).to.be.revertedWith("DA");
  });

  it("#5: Deposit after toBlok", async () => {
    await future(1000);
    await expect(
      justStaking.connect(user).deposit(usdtBalance),
    ).to.be.revertedWith("BN");
  });

  describe("Load rewards", function () {
    beforeEach("Load rewards", async function () {
      await usdc.transfer(justStakingAddr, usdcBalance / 4n);
      expect(await usdc.balanceOf(justStakingAddr)).to.be.eq(usdcBalance / 4n);

      await justStaking.addReward();

      await expect(justStaking.addReward()).to.be.revertedWith("SV");

      await future(489);
    });

    it("#6: Deposit the amount and fail immediate withdraw", async () => {
      await justStaking.connect(user).deposit(usdtBalance / 8n);

      await expect(justStaking.connect(user).withdraw()).to.be.revertedWith(
        "BN",
      );

      expect((await justStaking.deposits(userAddr))[0]).to.be.eq(
        usdtBalance / 8n,
      );
      expect((await justStaking.deposits(userAddr))[1]).to.be.eq(0);
      expect((await justStaking.deposits(userAddr))[2]).to.be.eq(0);

      expect(await justStaking.totalDeposit()).to.be.eq(usdtBalance / 8n);
      expect(await justStaking.cumulativeReward()).to.be.eq(0);
      expect(
        (await justStaking.toBlock()) -
          toBigInt(await justStaking.cumulativeRewardBlockNumber()),
      ).to.be.eq(500n);
      expect(await justStaking.rewardPerBlock()).to.be.eq(
        (await usdc.balanceOf(justStakingAddr)) / 500n,
      );

      expect(await usdt.balanceOf(userAddr)).to.be.eq((usdtBalance / 8n) * 3n);
      expect(await usdt.balanceOf(justStakingAddr)).to.be.eq(usdtBalance / 8n);
    });

    it("#7: Deposit the amount and withdraw", async () => {
      await justStaking.connect(user).deposit(usdtBalance / 4n);

      expect(await usdt.balanceOf(userAddr)).to.be.eq((usdtBalance / 8n) * 2n);
      expect(await usdt.balanceOf(justStakingAddr)).to.be.eq(usdtBalance / 4n);
      expect(await justStaking.depositorReward(userAddr)).to.be.eq(0);

      await future(300);
      expect(await justStaking.depositorReward(userAddr)).to.be.eq(
        (usdcBalance / 4n / 5n) * 3n,
      );
      await future(199);

      // Before toblock
      await expect(justStaking.connect(user).withdraw()).to.be.revertedWith(
        "BN",
      );

      // The Second user withdraw
      await expect(justStaking.connect(user2).withdraw()).to.be.revertedWith(
        "ZA",
      );

      expect(await justStaking.depositorReward(user2Addr)).to.be.eq(0);
      expect(await justStaking.depositorReward(userAddr)).to.be.eq(
        usdcBalance / 4n,
      );

      await justStaking.connect(user).withdraw();

      expect(await usdt.balanceOf(userAddr)).to.be.eq(usdtBalance / 2n);
      expect(await usdt.balanceOf(justStakingAddr)).to.be.eq(0);

      await expect(justStaking.connect(user).withdraw()).to.be.revertedWith(
        "ZA",
      );

      await expect(justStaking.connect(user).removeReward()).to.be.revertedWith(
        "ZA",
      );
    });

    it("#8: Deposit the amount and deposit more", async () => {
      await justStaking.connect(user).deposit(usdtBalance / 8n);

      await future(99);

      await justStaking.connect(user).deposit(usdtBalance / 8n);

      expect(await justStaking.depositorReward(userAddr)).to.be.eq(
        usdcBalance / 4n / 5n,
      );

      expect((await justStaking.deposits(userAddr))[0]).to.be.eq(
        usdtBalance / 4n,
      );
      expect((await justStaking.deposits(userAddr))[1]).to.be.eq(
        (await usdc.balanceOf(justStakingAddr)) / 5n,
      );
      expect((await justStaking.deposits(userAddr))[2]).to.be.eq(
        ((((await usdc.balanceOf(justStakingAddr)) / 5n) * toBigInt(1e8)) /
          (usdtBalance / 8n)) *
          toBigInt(1e8),
      );

      expect(await usdt.balanceOf(userAddr)).to.be.eq((usdtBalance / 8n) * 2n);
      expect(await usdt.balanceOf(justStakingAddr)).to.be.eq(usdtBalance / 4n);

      await expect(
        justStaking.connect(user).deposit(usdtBalance),
      ).to.be.revertedWith("DA");

      await future(499);

      expect(await justStaking.depositorReward(user2Addr)).to.be.eq(0);
      expect(await justStaking.depositorReward(userAddr)).to.be.eq(
        usdcBalance / 4n,
      );

      await justStaking.connect(user).withdraw();

      expect(await usdt.balanceOf(userAddr)).to.be.eq(usdtBalance / 2n);
      expect(await usdt.balanceOf(justStakingAddr)).to.be.eq(0);
      expect(await usdc.balanceOf(userAddr)).to.be.eq(usdcBalance / 4n);
      expect(await usdc.balanceOf(justStakingAddr)).to.be.eq(0);
    });

    it("#9: Deposit and add more rewards", async () => {
      await justStaking.connect(user).deposit(usdtBalance / 8n);

      await future(100);

      expect(await justStaking.depositorReward(user2Addr)).to.be.eq(0);
      expect(await justStaking.depositorReward(userAddr)).to.be.eq(
        usdcBalance / 4n / 5n,
      );

      await usdc.transfer(justStakingAddr, usdcBalance / 4n);
      await future(99);

      expect(await justStaking.depositorReward(userAddr)).to.be.eq(
        (usdcBalance / 4n / 5n) * 2n,
      );

      await future(50);

      expect(await justStaking.depositorReward(userAddr)).to.be.eq(
        usdcBalance / 4n / 2n,
      );

      await justStaking.addReward();

      await future(249);

      await justStaking.connect(user).withdraw();

      expect(await usdt.balanceOf(userAddr)).to.be.eq(usdtBalance / 2n);
      expect(await usdt.balanceOf(justStakingAddr)).to.be.eq(0);
      expect(await usdc.balanceOf(justStakingAddr)).to.be.lt(toBigInt(1e9));
      expect(await usdc.balanceOf(userAddr)).to.be.eq(
        usdcBalance / 2n - (await usdc.balanceOf(justStakingAddr)),
      );

      const balance = await usdc.balanceOf(justStakingAddr);
      expect(await usdc.balanceOf(ownerAddr)).to.be.eq(usdcBalance / 2n);

      justStaking.connect(user).removeReward();

      await future(1);
      expect(await usdc.balanceOf(justStakingAddr)).to.be.eq(0);
      expect(await usdc.balanceOf(ownerAddr)).to.be.eq(
        usdcBalance / 2n + balance,
      );

      await expect(justStaking.connect(user).removeReward()).to.be.revertedWith(
        "ZA",
      );
    });

    it("#10: Deposit the amounts by more users", async () => {
      await justStaking.connect(user).deposit(usdtBalance / 8n);

      await future(99);

      await justStaking.connect(user2).deposit(usdtBalance / 8n);

      expect(await justStaking.depositorReward(userAddr)).to.be.eq(
        usdcBalance / 4n / 5n,
      );

      expect(await justStaking.depositorReward(user2Addr)).to.be.eq(0);

      expect((await justStaking.deposits(userAddr))[0]).to.be.eq(
        usdtBalance / 8n,
      );
      expect((await justStaking.deposits(userAddr))[1]).to.be.eq(0);
      expect((await justStaking.deposits(userAddr))[2]).to.be.eq(0);

      expect(await usdt.balanceOf(userAddr)).to.be.eq((usdtBalance / 8n) * 3n);
      expect(await usdt.balanceOf(justStakingAddr)).to.be.eq(usdtBalance / 4n);

      await expect(
        justStaking.connect(user).deposit(usdtBalance),
      ).to.be.revertedWith("DA");

      await future(399);

      expect(await justStaking.depositorReward(user2Addr)).to.be.eq(
        (usdcBalance / 4n / 10n) * 4n,
      );
      expect(await justStaking.depositorReward(userAddr)).to.be.eq(
        (usdcBalance / 4n / 10n) * 6n,
      );

      await justStaking.connect(user).withdraw();

      expect(await usdt.balanceOf(userAddr)).to.be.eq(usdtBalance / 2n);
      expect(await usdt.balanceOf(justStakingAddr)).to.be.eq(usdtBalance / 8n);
      expect(await usdc.balanceOf(userAddr)).to.be.eq(
        (usdcBalance / 4n / 10n) * 6n,
      );
      expect(await usdc.balanceOf(justStakingAddr)).to.be.eq(
        (usdcBalance / 4n / 10n) * 4n,
      );

      expect(await justStaking.depositorReward(user2Addr)).to.be.eq(
        (usdcBalance / 4n / 10n) * 4n,
      );
      expect(await justStaking.depositorReward(userAddr)).to.be.eq(0);

      await justStaking.connect(user2).withdraw();

      expect(await usdt.balanceOf(user2Addr)).to.be.eq(usdtBalance / 2n);
      expect(await usdt.balanceOf(justStakingAddr)).to.be.eq(0);
      expect(await usdc.balanceOf(user2Addr)).to.be.eq(
        (usdcBalance / 4n / 10n) * 4n,
      );
      expect(await usdc.balanceOf(justStakingAddr)).to.be.eq(0);

      expect(await justStaking.depositorReward(user2Addr)).to.be.eq(0);
    });

    it("#11: Transfer ownership", async () => {
      expect(await justStaking.owner()).to.be.eq(ownerAddr);
      justStaking.connect(owner).transferOwnership(userAddr);

      await future(1);
      expect(await justStaking.owner()).to.be.eq(userAddr);
    });
  });
});
