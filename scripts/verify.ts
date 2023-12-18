import * as hre from "hardhat";

async function main() {
  await hre.run("verify:verify", {
    address: "0x0Ea47ed74283784eD6b9529eBc3403f0fe24Dc5b",
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
