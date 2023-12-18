import { ethers, upgrades } from "hardhat";

async function main() {
  //const fromBlockNumber = (await ethers.provider.getBlockNumber()) + 10;
  const payload = {
    depositToken: "0x608E3066ebCD480Ff6969C1DBdA4Eb73320698e4",
    rewardToken: "0x69CA1c6D27368DAa3395D8A6A5c35A9D3F959883",
    fromBlock: 4865734,
    toBlock: 4887350,
    maximumTotalDeposit: "10000000000000000000000000",
  };

  const fJustStakingFactory = await ethers.getContractFactory("JustStaking");
  const justStaking = await upgrades.deployProxy(fJustStakingFactory, [
    payload,
  ]);
  await justStaking.waitForDeployment();

  console.log(
    `JustStaking with (${JSON.stringify(payload)})} deployed to ${
      justStaking.target
    }`,
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
