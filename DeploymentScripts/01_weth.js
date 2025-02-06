const { ContractFactory, Wallet } = require("ethers");
const WETH9 = require("../Context/WETH9.json");
const fs = require("fs");
const { promisify } = require("util");
require("dotenv").config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  SwapRouter: require("@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json"),
  NFTDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json"),
  NonfungibleTokenPositionDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
  WETH9,
};

const provider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC_URL);
const wallet = new Wallet(PRIVATE_KEY);

const signer = wallet.connect(provider);

async function main() {
  const owner = signer;
console.log("Signer:",  owner.address);


  Weth = new ContractFactory(
    artifacts.WETH9.abi,
    artifacts.WETH9.bytecode,
    owner
  );
  weth = await Weth.deploy();


  let addresses = [
    `WETH_ADDRESS=${weth.address}`,
  ];
  const data = addresses.join("\n") + "\n";

  const appendFile = promisify(fs.appendFile);
  const filePath = ".env";

  return appendFile(filePath, data)
    .then(() => {
      console.log("Addresses recorded.");
      console.table({
        WETH_ADDRESS: weth.address,

      })
    })
    .catch((error) => {
      console.error("Error logging addresses:", error);
      throw error;
    });
}

/*
npx hardhat run --network localhost DeploymentScripts/01_weth.js
npx hardhat run --network sepolia DeploymentScripts/01_weth.js

*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });