//UPDATET CODE WHICH IS STORING ADDRESSES DIRECTLY TO .env FILE
const hre = require("hardhat");
const fs = require("fs");
const { promisify } = require("util");

async function main() {
  const [owner] = await ethers.getSigners();

  // Deploy contracts
  const SingleSwapToken = await hre.ethers.getContractFactory("SingleSwapToken");
  const singleSwapToken = await SingleSwapToken.deploy();
  await singleSwapToken.deployed();
  console.log(`SingleSwapToken deployed to ${singleSwapToken.address}`);

  const SwapMultiHop = await hre.ethers.getContractFactory("SwapMultiHop");
  const swapMultiHop = await SwapMultiHop.deploy();
  await swapMultiHop.deployed();
  console.log(`SwapMultiHop deployed to ${swapMultiHop.address}`);

  const UserStorageData = await hre.ethers.getContractFactory("UserStorageData");
  const userStorageData = await UserStorageData.deploy();
  await userStorageData.deployed();
  console.log(`UserStorageData deployed to ${userStorageData.address}`);

  // New addresses to append
  let newAddresses = [
    `NEXT_PUBLIC_SINGLE_SWAP_TOKEN=${singleSwapToken.address}`,
    `NEXT_PUBLIC_SWAP_MULTI_HOP=${swapMultiHop.address}`,
    `NEXT_PUBLIC_USER_STORAGE_DATA=${userStorageData.address}`
  ];

  // Read existing .env file
  const readFile = promisify(fs.readFile);
  const writeFile = promisify(fs.writeFile);
  const filePath = ".env";

  try {
    // Read existing content
    const existingContent = await readFile(filePath, 'utf8');
    
    // Combine existing and new addresses
    const updatedContent = existingContent + '\n' + newAddresses.join('\n');
    
    // Write back to file
    await writeFile(filePath, updatedContent);
    console.log("New contract addresses appended to .env file");
  } catch (error) {
    if (error.code === 'ENOENT') {
      // If .env doesn't exist, create new file
      await writeFile(filePath, newAddresses.join('\n'));
      console.log("Created new .env file with contract addresses");
    } else {
      console.error("Error updating addresses:", error);
      throw error;
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
