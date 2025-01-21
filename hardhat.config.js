// require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-waffle");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
        optimizer: {
        enabled: true,
        runs: 5000,
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
  },
  mocha: {
    before_timeout: 220000 // <--- units in ms
  },
};

// require("@nomiclabs/hardhat-waffle");

// module.exports = {
//   solidity: {
//     version: "0.7.6",
//     settings: {
//       optimizer: {
//         enabled: true,
//         runs: 5000,
//         details: { yul: false },
//       },
//     },
//   },
//   networks: {
//     hardhat: {
//       forking: {
//         url: "your",
//         accounts: [`0x${"your"}`],
//       },
//     },
//   },
// };
