import * as hre from "hardhat";

async function main() {
  await hre.run("verify:verify", {
    address: "0x6F9009Bd5156464399B43cF303Cca4444332a360",
    contract: "contracts/__mocks__/ERC20Mock.sol:ERC20Mock",
    constructorArguments: ["USDT"],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
