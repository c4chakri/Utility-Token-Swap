const fs = require("fs");
const { ethers } = require("hardhat");
const { promisify } = require("util");
const { ContractFactory, utils, Wallet } = require("ethers");

require("dotenv").config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const provider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC_URL);
const wallet = new Wallet(PRIVATE_KEY);
const signer = wallet.connect(provider);

async function main() {
  // const [owner, signer2] = await ethers.getSigners();
  const owner = signer;
  const signer2 = "0x74372a43378D10885882f9C0fE8A7d146B4A021B"

  const ut1Params = [

    ethers.utils.parseEther("1000000000000000000000000000000"),
    "Utility1",
    "UT1",
    owner.address,
    [true, true, true, true, true, true, true, true],
    "150",
    owner.address,
    "18",
    [[2, 10], [3, 12], [6, 15], [9, 20], [12, 25], [24, 35]]


  ]

  Utility1 = await ethers.getContractFactory("Utility1");
  utility1 = await Utility1.deploy(...ut1Params);

  Utility2 = await ethers.getContractFactory("Utility2");
  utility2 = await Utility2.deploy(...ut1Params);

  await utility1.connect(owner).transferUnrestrictedTokens(signer2, ethers.utils.parseEther("100000"));
  await utility2.connect(owner).transferUnrestrictedTokens(signer2, ethers.utils.parseEther("100000"));

  // record addresses
  let addresses = [
    `UTILITY1_ADDRESS=${utility1.address}`,
    `UTILITY2_ADDRESS=${utility2.address}`,
  ];
  const data = "\n" + addresses.join("\n")+"\n";

  const writeFile = promisify(fs.appendFile);
  const filePath = ".env";
  return writeFile(filePath, data)
    .then(() => {
      console.log("Addresses recorded.");
      console.table({
     
        Utility1: utility1.address,
        Utility2: utility2.address
      })
    })
    .catch((error) => {
      console.error("Error logging addresses:", error);
      throw error;
    });
}

/*
npx hardhat run --network localhost DeployTokens/DeployTokens.js
npx hardhat run --network sepolia DeployTokens/DeployTokens.js

*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
