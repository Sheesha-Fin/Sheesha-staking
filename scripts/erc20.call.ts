import { ethers } from "hardhat";

async function main() {
  const erc20 = await ethers.getContractAt("ERC20Mock", "0x411fEe5C050476C7014b3f7e544dFA7B7e58358b");

  console.log(`ERC20 ${await erc20.symbol()} token balance is ${await erc20.balanceOf("0xAC92f8844285Bd42903B1b42Ca1dBBa1205BdeA5")}}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
