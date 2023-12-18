import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";

import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: { enabled: true, runs: 2235 },
        },
      },
    ],
  },

  networks: {
    hardhat: {
      forking: {
        url: process.env.POLYGON_URL || "",
      },
      chainId: 137,
    },
    ganache: {
      url: "http://0.0.0.0:7545", // Localhost (default: none)
    },
    sepolia: {
      url: process.env.SEPOLIA_URL || "",
      accounts: [process.env.PRIVATE_KEY || ""],
      chainId: 11155111,
      //gasPrice: 5000000000,
      timeout: 300000,
    },
    mainnet: {
      url: process.env.ETH_URL || "",
      accounts: [process.env.MAINNET_PRIVATE_KEY || ""],
      chainId: 1,
      gasPrice: 20000000000,
      timeout: 300000,
    },
    polygon: {
      url: process.env.POLYGON_URL || "",
      accounts: [process.env.MAINNET_PRIVATE_KEY || ""],
      chainId: 137,
      //gasPrice: 5000000000,
      timeout: 300000,
    },
    mumbai: {
      url: process.env.MUMBAI_URL || "",
      accounts: [process.env.PRIVATE_KEY || ""],
      chainId: 80001,
      //gasPrice: 5000000000,
      timeout: 300000,
    },
  },
  mocha: {
    timeout: 30000000,
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      goerli: process.env.ETHERSCAN_API_KEY,
      sepolia: process.env.ETHERSCAN_API_KEY,
      bsc: process.env.BSCSCAN_API_KEY,
      bscTestnet: process.env.BSCSCAN_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY,
      polygonMumbai: process.env.POLYGONSCAN_API_KEY,
    },
  },

  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
};

export default config;
