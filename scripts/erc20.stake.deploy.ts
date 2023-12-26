import { ethers } from "hardhat";

// 0x454607a29e17315cC284639Ed57A430b64C5Be91
async function main() {
  const fERC20MockFactory = await ethers.getContractFactory("ERC20Mock");
  const symbol = "mSheesha";
  const erc20 = await fERC20MockFactory.deploy(symbol);
  await erc20.waitForDeployment();

  console.log(`ERC20Mock with (${symbol})} deployed to ${erc20.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
