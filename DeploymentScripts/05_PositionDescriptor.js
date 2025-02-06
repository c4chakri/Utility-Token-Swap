const { ContractFactory, utils, Wallet } = require("ethers");
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
};

const provider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC_URL);
const wallet = new Wallet(PRIVATE_KEY);

const weth = process.env.WETH_ADDRESS;
const nftDescriptor = process.env.NFT_DESCRIPTOR_ADDRESS;
const signer = wallet.connect(provider);



const linkLibraries = ({ bytecode, linkReferences }, libraries) => {
  Object.keys(linkReferences).forEach((fileName) => {
    Object.keys(linkReferences[fileName]).forEach((contractName) => {
      if (!libraries.hasOwnProperty(contractName)) {
        throw new Error(`Missing link library name ${contractName}`);
      }
      const address = utils
        .getAddress(libraries[contractName])
        .toLowerCase()
        .slice(2);
      linkReferences[fileName][contractName].forEach(({ start, length }) => {
        const start2 = 2 + start * 2;
        const length2 = length * 2;
        bytecode = bytecode
          .slice(0, start2)
          .concat(address)
          .concat(bytecode.slice(start2 + length2, bytecode.length));
      });
    });
  });
  return bytecode;
};


async function main() {
  // const [owner] = await ethers.getSigners();
  const owner = signer;

  const linkedBytecode = linkLibraries(
    {
      bytecode: artifacts.NonfungibleTokenPositionDescriptor.bytecode,
      linkReferences: {
        "NFTDescriptor.sol": {
          NFTDescriptor: [
            {
              length: 20,
              start: 1681,
            },
          ],
        },
      },
    },
    {
      NFTDescriptor: nftDescriptor,
    }
  );

  NonfungibleTokenPositionDescriptor = new ContractFactory(
    artifacts.NonfungibleTokenPositionDescriptor.abi,
    linkedBytecode,
    owner
  );

  const nativeCurrencyLabelBytes = utils.formatBytes32String("WETH");
  nonfungibleTokenPositionDescriptor =
    await NonfungibleTokenPositionDescriptor.deploy(
      weth,
      nativeCurrencyLabelBytes
    );

  let addresses = [
    `POSITION_DESCRIPTOR_ADDRESS=${nonfungibleTokenPositionDescriptor.address}`,
  ];
  const data = addresses.join("\n") + "\n"; // Ensure a newline for proper formatting

  const appendFile = promisify(fs.appendFile);
  const filePath = ".env";

  return appendFile(filePath, data)
    .then(() => {
      console.log("Addresses recorded.");
      console.table({
        WETH_ADDRESS: weth,
        POSITION_DESCRIPTOR_ADDRESS: nonfungibleTokenPositionDescriptor.address

      })
    })
    .catch((error) => {
      console.error("Error logging addresses:", error);
      throw error;
    });
}

/*
npx hardhat run --network localhost DeploymentScripts/05_PositionDescriptor.js
npx hardhat run --network sepolia DeploymentScripts/05_PositionDescriptor.js


*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });