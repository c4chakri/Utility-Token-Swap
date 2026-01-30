
// require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
require("@nomicfoundation/hardhat-verify");
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
        optimizer: {
        enabled: true,
        runs: 200,
        details: { yul: false },
      },
    },
      },
    ],
  },
  networks: {
    hardhat: {
      hardhat: {
        forking: {
          url: "https://eth-mainnet.g.alchemy.com/v2/8ACyFyz_9HEScjmG4E6lyXMrqFOZQU8f",
          blockNumber: 17500000, // Optionally, set a specific block number for stability
          timeout: 60000,       // Increase timeout to 60 seconds
        },
      },
    },
    sepolia: {
      url: `${process.env.SEPOLIA_RPC_URL}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`,`0x${process.env.SIGNER_KEY}`],
    }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: "NCK76P88P8MFMTQE66ZQ8XKVRAX6337NHC"
  },
  sourcify: {
    // Disabled by default
    // Doesn't need an API key
    enabled: true
  },
  mocha: {
    before_timeout: 220000 // <--- units in ms
  },
};
