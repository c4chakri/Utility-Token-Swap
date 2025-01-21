const fs = require("fs");
const { ethers } = require("hardhat");
const { promisify } = require("util");
//
async function main() {
  const [owner, signer2] = await ethers.getSigners();

  const UT1Params = [
    "1000000000000000000000000000000", // Initial token supply in Wei (string for large numbers)
    "UT1",                         // Token name
    "UT1",                             // Token symbol
    owner.address, // Admin or owner address
    [true, true, true, true, true, true, true, true], // Feature toggles
    150,                               // Some configuration parameter (e.g., lock duration or cooldown period)
    owner.address, // Another address (possibly treasury or reserve)
    18,                                // Decimals (standard for ERC20 tokens)
    [                                  // Array of paired values (e.g., vesting schedule or tax brackets)
      [2, 10],
      [3, 12],
      [6, 15],
      [9, 20],
      [12, 25],
      [24, 35]
    ]
  ];
  const UT2Params = [
    "1000000000000000000000000000000", // Initial token supply in Wei (string for large numbers)
    "UT2",                         // Token name
    "UT2",                             // Token symbol
    owner.address, // Admin or owner address
    [true, true, true, true, true, true, true, true], // Feature toggles
    150,                               // Some configuration parameter (e.g., lock duration or cooldown period)
    owner.address, // Another address (possibly treasury or reserve)
    18,                                // Decimals (standard for ERC20 tokens)
    [                                  // Array of paired values (e.g., vesting schedule or tax brackets)
      [2, 10],
      [3, 12],
      [6, 15],
      [9, 20],
      [12, 25],
      [24, 35]
    ]
  ];

  const UT1 = await ethers.getContractFactory("SwapUT1");
  const ut1 = await UT1.deploy(...UT1Params);

  const UT2 = await ethers.getContractFactory("SwapUT2");
  const ut2 = await UT2.deploy(...UT2Params);


 const Tether = await ethers.getContractFactory("Tether");
 const tether = await Tether.deploy();

  Usdc = await ethers.getContractFactory("UsdCoin");
  usdc = await Usdc.deploy();

  WrappedBitcoin = await ethers.getContractFactory("WrappedBitcoin");
  wrappedBitcoin = await WrappedBitcoin.deploy();

  await tether.connect(owner).mint(signer2.address,ethers.utils.parseEther("100000"));
  await usdc.connect(owner).mint(signer2.address,ethers.utils.parseEther("100000"));
  await wrappedBitcoin.connect(owner).mint(signer2.address,ethers.utils.parseEther("100000"));


await ut1.connect(owner).transferUnrestrictedTokens(signer2.address,ethers.utils.parseEther("100000"));
await ut2.connect(owner).transferUnrestrictedTokens(signer2.address,ethers.utils.parseEther("100000"));

  let addresses = [
    `NEXT_PUBLIC_UT1=${ut1.address}`,
    `NEXT_PUBLIC_UT2=${ut2.address}`,

    `NEXT_PUBLIC_TETHER_ADDRESS=${tether.address}`,
    `NEXT_PUBLIC_USDC_ADDRESS=${usdc.address}`,
    `NEXT_PUBLIC_WRAPPED_BITCOIN_ADDRESS=${wrappedBitcoin.address}`,
  ];

  const data = "\n" + addresses.join("\n");

  const writeFile = promisify(fs.appendFile);
  const filePath = ".env";
  return writeFile(filePath, data)
    .then(() => {
      console.log("Utility Tokens Deployed");
      
      console.log("Addresses recorded.",addresses);
    })
    .catch((error) => {
      console.error("Error logging addresses:", error);
      throw error;
    });
}

/*
  npx hardhat run --network localhost Utils/02_deployTokens.js
*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
