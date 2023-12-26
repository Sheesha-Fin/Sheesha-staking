import { ethers, upgrades } from "hardhat";

async function main() {
  //const fromBlockNumber = (await ethers.provider.getBlockNumber()) + 10;
  const payload = {
    depositToken: "0x454607a29e17315cC284639Ed57A430b64C5Be91",
    rewardToken: "0xa39930B1b1AFD6538EA6B9dEf2Dfd51863949c41",
    fromBlock: 4955539,
    toBlock: 4962739,
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
