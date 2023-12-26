import * as hre from "hardhat";

async function main() {
  await hre.run("verify:verify", {
    address: "0xA98996781E5ccb4D82Cc0fc44A6a9433f1D3707e",
    contract: "contracts/__mocks__/ERC20Mock.sol:ERC20Mock",
    constructorArguments: ["USDT"],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
