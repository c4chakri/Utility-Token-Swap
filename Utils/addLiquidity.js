// // Import necessary libraries and components
// import Web3Modal from "web3modal";
// import { Contract, ethers } from "ethers";
// import { Token } from "@uniswap/sdk-core";
// import { Pool, Position, nearestUsableTick } from "@uniswap/v3-sdk";
// require("dotenv").config();

// // Uniswap contract addresses
// const positionManagerAddress = process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS;

// // Import necessary contract ABIs
// const artifacts = {
//   NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
//   UniswapV3Pool: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"),
//   WETH9: require("../Context/WETH9.json"),
//     ERC20: require("../artifacts/contracts/Tether.sol/Tether.json"),
// };
// // Function to fetch pool data
// async function getPoolData(poolContract) {
//   const [tickSpacing, fee, liquidity, slot0] = await Promise.all([
//     poolContract.tickSpacing(),
//     poolContract.fee(),
//     poolContract.liquidity(),
//     poolContract.slot0(),
//   ]);

//   return {
//     tickSpacing: tickSpacing,
//     fee: fee,
//     liquidity: liquidity,
//     sqrtPriceX96: slot0[0],
//     tick: slot0[1],
//   };
// }
// // Main function to add liquidity
// export const addLiquidityExternal = async (
//   tokenAddress1,
//   tokenAddress2,
//   poolAddress,
//   poolFee,
//   tokenAmount1,
//   tokenAmount2
// ) => {
    
//   // Connect to the user's wallet
//   const web3modal = await new Web3Modal();
//   const connection = await web3modal.connect();
//   const provider = new ethers.providers.Web3Provider(connection);
//   const signer = provider.getSigner();
//   const accountAddress = await signer.getAddress();

//     // Create contract instances for both tokens
//   const token1Contract = new Contract(
//     tokenAddress1,
//     artifacts.ERC20.abi,
//     provider
//   );
//   const token2Contract = new Contract(
//     tokenAddress2,
//     artifacts.ERC20.abi,
//     provider
//   );

//     // Approve token spending for the position manager
//   await token1Contract
//     .connect(signer)
//     .approve(
//       positionManagerAddress,
//       ethers.utils.parseEther(tokenAmount1.toString())
//     );

//   await token2Contract
//     .connect(signer)
//     .approve(
//       positionManagerAddress,
//       ethers.utils.parseEther(tokenAmount2.toString())
//     );

//       // Create a contract instance for the pool
//   const poolContract = new Contract(
//     poolAddress,
//     artifacts.UniswapV3Pool.abi,
//     provider
//   );

//     // Get the current chain ID
//   const { chainId } = await provider.getNetwork();

//  // Fetch token details for both tokens
//   //TOKEN1
//   const token1Name = await token1Contract.name();
//   const token1Symbol = await token1Contract.symbol();
//   const token1Decimals = await token1Contract.decimals();
//   const token1Address = await token1Contract.address;

//   //TOKEN2
//   const token2Name = await token2Contract.name();
//   const token2Symbol = await token2Contract.symbol();
//   const token2Decimals = await token2Contract.decimals();
//   const token2Address = await token2Contract.address;


// // Create Token instances for both tokens
//   const TokenA = new Token(
//     chainId,
//     token1Address,
//     token1Decimals,
//     token1Name,
//     token1Symbol
//   );
//   const TokenB = new Token(
//     chainId,
//     token2Address,
//     token2Decimals,
//     token2Name,
//     token2Symbol
//   );


//   // Fetch pool data
//   const poolData = await getPoolData(poolContract);
//   console.log(poolData);

//     // Create a Pool instance
//   const pool = new Pool(
//     TokenA,
//     TokenB,
//     poolData.fee,
//     poolData.sqrtPriceX96.toString(),
//     poolData.liquidity.toString(),
//     poolData.tick
//   );

//     // Create a Position instance
//   const position = new Position({
//     pool: pool,
//     liquidity: ethers.utils.parseUnits("1", 18),
//     tickLower:
//       nearestUsableTick(poolData.tick, poolData.tickSpacing) -
//       poolData.tickSpacing * 2,
//     tickUpper:
//       nearestUsableTick(poolData.tick, poolData.tickSpacing) +
//       poolData.tickSpacing * 2,
//   });

//   console.log(position);
//   const { amount0: amount0Desired, amount1: amount1Desired } =
//     position.mintAmounts;

// // Prepare parameters for adding liquidity
//   const params = {
//     token0: tokenAddress1,
//     token1: tokenAddress2,
//     fee: poolData.fee,
//     tickLower:
//       nearestUsableTick(poolData.tick, poolData.tickSpacing) -
//       poolData.tickSpacing * 2,
//     tickUpper:
//       nearestUsableTick(poolData.tick, poolData.tickSpacing) +
//       poolData.tickSpacing * 2,
//     amount0Desired: amount0Desired.toString(),
//     amount1Desired: amount1Desired.toString(),
//     amount0Min: 0,
//     amount1Min: 0,
//     recipient: accountAddress,
//     deadline: Math.floor(Date.now() / 1000) + 60 * 10,
//   };

//     // Create a contract instance for the NonfungiblePositionManager
//   const nonfungiblePositionManager = new Contract(
//     positionManagerAddress,
//     artifacts.NonfungiblePositionManager.abi,
//     provider
//   );

//     // Add liquidity by minting a new position
//   const tx = await nonfungiblePositionManager.connect(signer).mint(params, {
//     gasLimit: "1000000",
//   });
//   const receipt = await tx.wait();
//   return receipt;
// };



/*************************************UPDATED LIQUIDITY SCRIPT*************************************/




// const { ethers } = require("hardhat");
// const { Contract } = require("ethers");
// const { Pool, Position, nearestUsableTick } = require("@uniswap/v3-sdk");
// const { Token } = require("@uniswap/sdk-core");
// const JSBI = require("jsbi");

// require("dotenv").config();

// const positionManagerAddress = process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS;
// const USDT_USDC_500 = process.env.NEXT_PUBLIC_USDT_USDC;

// // Token addresses
// const TETHER_ADDRESS = process.env.NEXT_PUBLIC_TETHER_ADDRESS;
// // pool address 

// const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS;
// const WRAPPED_BITCOIN_ADDRESS = process.env.NEXT_PUBLIC_WRAPPED_BITCOIN_ADDRESS;

// // Import necessary contract ABIs
// const artifacts = {
//   NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
//   UniswapV3Pool: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"),
//   WETH9: require("../Context/WETH9.json"),
//   Usdt: require("../artifacts/contracts/Tether.sol/Tether.json"),
//   Usdc: require("../artifacts/contracts/Usdcoin.sol/UsdCoin.json"),
// };

// // Fetch pool data
// async function getPoolData(poolContract) {
//   const [tickSpacing, fee, liquidity, slot0] = await Promise.all([
//     poolContract.tickSpacing(),
//     poolContract.fee(),
//     poolContract.liquidity(),
//     poolContract.slot0(),
//   ]);

//   return {
//     tickSpacing,
//     fee,
//     liquidity,
//     sqrtPriceX96: slot0.sqrtPriceX96,
//     tick: slot0.tick,
//   };
// }

// // Main function to add liquidity
// async function main() {
//   const [owner, signer2] = await ethers.getSigners();
//   const provider = ethers.provider;

//   const usdtContract = new Contract(TETHER_ADDRESS, artifacts.Usdt.abi, provider);
//   const usdcContract = new Contract(USDC_ADDRESS, artifacts.Usdc.abi, provider);
//   const wrappedBitcoinContract = new Contract(WRAPPED_BITCOIN_ADDRESS, artifacts.WETH9.abi, provider);

//   await usdtContract.connect(signer2).approve(
//     positionManagerAddress,
//     ethers.utils.parseUnits("1000", 18)
//   );
//   await usdcContract.connect(signer2).approve(
//     positionManagerAddress,
//     ethers.utils.parseUnits("1000", 18)
//   );


//   const usdtToken = new Token(31337, TETHER_ADDRESS, 18, "USDT", "Tether");
//   const usdcToken = new Token(31337, USDC_ADDRESS, 18, "USDC", "USD Coin");

//   const poolContract = new Contract(USDT_USDC_500, artifacts.UniswapV3Pool.abi, provider);
//   const poolData = await getPoolData(poolContract);

//   const pool = new Pool(
//     usdtToken,
//     usdcToken,
//     poolData.fee,
//     poolData.sqrtPriceX96,
//     poolData.liquidity,
//     poolData.tick
//   );

//   const tickLower = nearestUsableTick(poolData.tick, poolData.tickSpacing) - poolData.tickSpacing * 2;
//   const tickUpper = nearestUsableTick(poolData.tick, poolData.tickSpacing) + poolData.tickSpacing * 2;

//   const position = new Position({
//     pool,
//     liquidity: JSBI.BigInt(ethers.utils.parseUnits("2", 18).toString()),
//     tickLower,
//     tickUpper,
//   });

//   const { amount0: amount0Desired, amount1: amount1Desired } = position.mintAmounts;

//   const params = {
//     token0: TETHER_ADDRESS,
//     token1: USDC_ADDRESS,
//     fee: poolData.fee,
//     tickLower,
//     tickUpper,
//     amount0Desired: JSBI.toNumber(amount0Desired),
//     amount1Desired: JSBI.toNumber(amount1Desired),
//     amount0Min: 0,
//     amount1Min: 0,
//     recipient: signer2.address,
//     deadline: Math.floor(Date.now() / 1000) + 60 * 10,
//   };

//   const nonfungiblePositionManager = new Contract(
//     positionManagerAddress,
//     artifacts.NonfungiblePositionManager.abi,
//     signer2
//   );

//   const tx = await nonfungiblePositionManager.mint(params, { gasLimit: 1000000 });

//   const receipt = await tx.wait();
//   console.log("Liquidity added amount:  ", amount0Desired, amount1Desired);

// }

// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });

//   /**
//    npx hardhat run --network localhost Utils/addLiquidity.js
//    */

 


