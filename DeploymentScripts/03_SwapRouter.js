const { ContractFactory, utils, Wallet } = require("ethers");
const WETH9 = require("../Context/WETH9.json");
const fs = require("fs");
const { promisify } = require("util");
const { sign } = require("crypto");
require("dotenv").config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const provider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC_URL);
const wallet = new Wallet(PRIVATE_KEY);

const signer = wallet.connect(provider);

const weth = process.env.WETH_ADDRESS;
const factory = process.env.FACTORY_ADDRESS;

const artifacts = {
    UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
    SwapRouter: require("@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json"),
    NFTDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json"),
    NonfungibleTokenPositionDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json"),
    NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
    WETH9,
};

async function main() {
    // const [owner] = await ethers.getSigners();
    const owner = signer;


    SwapRouter = new ContractFactory(
        artifacts.SwapRouter.abi,
        artifacts.SwapRouter.bytecode,
        owner
    );
    swapRouter = await SwapRouter.deploy(factory, weth);

    let addresses = [
        `SWAP_ROUTER_ADDRESS=${swapRouter.address}`,
    ];
    const data = addresses.join("\n") + "\n";

    const writeFile = promisify(fs.appendFile);
    const filePath = ".env";
    return writeFile(filePath, data)
        .then(() => {
            console.log("Addresses recorded.");
            console.table({
                SWAP_ROUTER_ADDRESS: swapRouter.address,
            })
        })
        .catch((error) => {
            console.error("Error logging addresses:", error);
            throw error;
        });
}

/*
npx hardhat run --network localhost DeploymentScripts/03_SwapRouter.js
npx hardhat run --network sepolia DeploymentScripts/03_SwapRouter.js

*/

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });