
require("dotenv").config();

const UTILITY1_UTILITY2 = process.env.UTILITY1_UTILITY2;
const UniswapV3Pool = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json");
const { Contract ,Wallet} = require("ethers");
const { Pool } = require("@uniswap/v3-sdk");
const { Provider } = require("web3modal");
const { ethers } = require("hardhat");

const UTILITY1_ADDRESS = process.env.UTILITY1_ADDRESS;
const UTILITY2_ADDRESS = process.env.UTILITY2_ADDRESS;


const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.SIGNER_KEY;

const provider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC_URL);


const wallet = new Wallet(PRIVATE_KEY);
const signer = wallet.connect(provider);
async function getPoolData(poolContract) {
    const [tickSpacing, fee, liquidity, slot0] = await Promise.all([
        poolContract.tickSpacing(),
        poolContract.fee(),
        poolContract.liquidity(),
        poolContract.slot0(),
    ])

    return {
        tickSpacing,
        fee,
        liquidity: liquidity.toString(),
        sqrtPriceX96: slot0[0],
        tick: slot0[1],
    }
}

async function main() {

    // const provider = ethers.provider;
    const UTILITY1_UTILITY2_poolContract = new Contract(UTILITY1_UTILITY2, UniswapV3Pool.abi, provider);

    const poolsData = { "UTILITY1-UTILITY2": await getPoolData(UTILITY1_UTILITY2_poolContract) }
    console.log("poolsData", poolsData);

}



main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});

/*
npx hardhat run --network localhost AddLiquidity/CheckLiquidity.js
npx hardhat run --network sepolia AddLiquidity/CheckLiquidity.js

*/