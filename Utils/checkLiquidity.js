// import Web3Modal from "web3modal";
// import UniswapV3Pool from "@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json";
// import { Contract, ethers } from "ethers";
// import { Pool } from "@uniswap/v3-sdk";
// import { Token } from "@uniswap/sdk-core";
// import ERC20 from "../Context/ERC20.json";

// // Function to fetch and process pool data
// async function getPoolData(poolContract, tokenAddress1, tokenAddress2) {
//   // Fetch multiple pool parameters in parallel
//   const [
//     tickSpacing,
//     fee,
//     liquidity,
//     slot0,
//     factory,
//     token0,
//     token1,
//     maxLiquidityPerTick,
//   ] = await Promise.all([
//     poolContract.tickSpacing(),
//     poolContract.fee(),
//     poolContract.liquidity(),
//     poolContract.slot0(),
//     poolContract.factory(),
//     poolContract.token0(),
//     poolContract.token1(),
//     poolContract.maxLiquidityPerTick(),
//   ]);

//   // Connect to the user's wallet
//   const web3modal = await new Web3Modal();
//   const connection = await web3modal.connect();
//   const provider = new ethers.providers.Web3Provider(connection);

//   // Create contract instances for both tokens
//   const token0Contract = new Contract(tokenAddress1, ERC20, provider);
//   const token1Contract = new Contract(tokenAddress2, ERC20, provider);

//   // Get the current chain ID
//   const { chainId } = await provider.getNetwork();

//   // Fetch token details for token0
//   const token0Name = await token0Contract.name();
//   const token0Symbol = await token0Contract.symbol();
//   const token0Decimals = await token0Contract.decimals();
//   const token0Address = await token0Contract.address;

//   // Fetch token details for token1
//   const token1Name = await token1Contract.name();
//   const token1Symbol = await token1Contract.symbol();
//   const token1Decimals = await token1Contract.decimals();
//   const token1Address = await token1Contract.address;

//   // Create Token instances for both tokens
//   const TokenA = new Token(
//     chainId,
//     token0Address,
//     token0Decimals,
//     token0Symbol,
//     token0Name
//   );

//   const TokenB = new Token(
//     chainId,
//     token1Address,
//     token1Decimals,
//     token1Symbol,
//     token1Name
//   );

//   // Create a Pool instance
//   const poolExample = new Pool(
//     TokenA,
//     TokenB,
//     fee,
//     slot0[0].toString(),
//     liquidity.toString(),
//     slot0[1]
//   );

//   // Return an object with all the fetched and processed data
//   return {
//     factory: factory,
//     token0: token0,
//     token1: token1,
//     maxLiquidityPerTick: maxLiquidityPerTick,
//     tickSpacing: tickSpacing,
//     fee: fee,
//     liquidity: liquidity.toString(),
//     sqrtPriceX96: slot0[0],
//     tick: slot0[1],
//     observationIndex: slot0[2],
//     observationCardinality: slot0[3],
//     observationCardinalityNext: slot0[4],
//     feeProtocol: slot0[5],
//     unlocked: slot0[6],
//     poolExample,
//   };
// }

// // Main function to get liquidity data for a specific pool
// export const getLiquidityData = async (
//   poolAddress,
//   tokenAddress1,
//   tokenAddress2
// ) => {
//   // Connect to the user's wallet
//   const web3modal = await new Web3Modal();
//   const connection = await web3modal.connect();
//   const provider = new ethers.providers.Web3Provider(connection);

//   // Create a contract instance for the pool
//   const poolContract = new Contract(poolAddress, UniswapV3Pool.abi, provider);

//   // Fetch and return the pool data
//   const poolData = await getPoolData(
//     poolContract,
//     tokenAddress1,
//     tokenAddress2
//   );

//   return poolData;
// };


/****************************************** UPDATED SCRIPT ******************************************* */

require("dotenv").config();
const USDT_USDC_500 = process.env.NEXT_PUBLIC_USDT_USDC;
const USDT_SOL = process.env.NEXT_PUBLIC_USDT_SOL;
const USDT_UTILITY1 = process.env.NEXT_PUBLIC_USDT_UTILITY1;
const UTILITY1_UTILITY2 = process.env.NEXT_PUBLIC_UTILITY1_UTILITY2;


const UniswapV3Pool = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json");
const { Contract } = require("ethers");
const { Pool } = require("@uniswap/v3-sdk");
const { Provider } = require("web3modal");
const { ethers } = require("hardhat");

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

  const provider = ethers.provider;
  const USDT_USDC_poolContract = new Contract(USDT_USDC_500, UniswapV3Pool.abi, provider);
  const USDT_SOL_poolContract = new Contract(USDT_SOL, UniswapV3Pool.abi, provider);
  const USDT_UTILITY1_poolContract = new Contract(USDT_UTILITY1, UniswapV3Pool.abi, provider);
  const UTILITY1_UTILITY2_poolContract = new Contract(UTILITY1_UTILITY2, UniswapV3Pool.abi, provider);

  const poolsData = {"USDT-USDC": await getPoolData(USDT_USDC_poolContract), "USDT-SOL": await getPoolData(USDT_SOL_poolContract), "USDT-UTILITY1": await getPoolData(USDT_UTILITY1_poolContract), "UTILITY1-UTILITY2": await getPoolData(UTILITY1_UTILITY2_poolContract)}

  console.log("poolsData", poolsData);
  
}



main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});

/*
npx hardhat run --network localhost Utils/checkLiquidity.js
*/