// const { NonfungiblePositionManager } = require("@uniswap/v3-sdk");
// require("dotenv").config();

// WETH_ADDRESS = process.env.NEXT_PUBLIC_WETH_ADDRESS;
// FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS;
// SWAP_ROUTER_ADDRESS = process.env.NEXT_PUBLIC_SWAP_ROUTER_ADDRESS;
// NFT_DESCRIPTOR_ADDRESS = process.env.NEXT_PUBLIC_NFT_DESCRIPTOR_ADDRESS;
// POSITION_DESCRIPTOR_ADDRESS = process.env.NEXT_PUBLIC_POSITION_DESCRIPTOR_ADDRESS;
// POSITION_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS;

// // pool address
// const USDT_USDC_500 = process.env.NEXT_PUBLIC_USDT_USDC_500;

// // token address

// const TETHER_ADDRESS = process.env.NEXT_PUBLIC_TETHER_ADDRESS;
// const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS;
// const WRAPPED_BITCOIN_ADDRESS = process.env.NEXT_PUBLIC_WRAPPED_BITCOIN_ADDRESS;



// const artifacts = {
//     NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
//     Usdt: require("../artifacts/contracts/Tether.sol/Tether.json"),
//     Usdc: require("../artifacts/contracts/Usdcoin.sol/UsdCoin.json"),
//     WrappedBitcoin: require("../artifacts/contracts/WrappedBitcoin.sol/WrappedBitcoin.json"),
//     UniswapV3Pool: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"),
//   };

//   const { Contract } = require("ethers");
//   const { Pool, Position, nearestUsableTick } = require("@uniswap/v3-sdk");
//   const { Token } = require("@uniswap/sdk-core");
// const { ethers } = require("hardhat");
  
//   async function getPoolData(poolContract) {
//     const [tickSpacing,fee,liquidity,slot0] = await Promise.all([
//       poolContract.tickSpacing(),
//       poolContract.fee(),
//       poolContract.liquidity(),
//       poolContract.slot0(),
//     ])
//     return {
//       tickSpacing: tickSpacing,
//       fee: fee,
//       liquidity: liquidity,
//       sqrtPriceX96: slot0[0],
//       tick: slot0[1]
//     }
// }

// async function main() {

//     const [owner, signer] = await ethers.getSigners();
//     const provider = ethers.provider;

//     const usdtContract = new Contract(TETHER_ADDRESS, artifacts.Usdt.abi, provider);
//     const usdcContract = new Contract(USDC_ADDRESS, artifacts.Usdc.abi, provider);
//     const wrappedBitcoinContract = new Contract(WRAPPED_BITCOIN_ADDRESS, artifacts.WrappedBitcoin.abi, provider);
    

//     await usdtContract.connect(signer).approve(POSITION_MANAGER_ADDRESS, ethers.utils.parseEther("1000"));
//     await usdcContract.connect(signer).approve(POSITION_MANAGER_ADDRESS, ethers.utils.parseEther("1000"));
   
//     const poolContract = new Contract(USDT_USDC_500, artifacts.UniswapV3Pool.abi, provider);
//     const poolData = await getPoolData(poolContract);
//     console.log("poolData", poolData);

//     const UsdtToken = new Token(31337, TETHER_ADDRESS, 18, "Tether", "Tether");
//     const UsdcToken = new Token(31337, USDC_ADDRESS, 18, "USD Coin", "USD Coin");
//     const WrappedBitcoinToken = new Token(31337, WRAPPED_BITCOIN_ADDRESS, 18, "Wrapped Bitcoin", "Wrapped Bitcoin");

//     const pool = new Pool(
//         UsdtToken,
//         UsdcToken,
//         poolData.fee,
//         poolData.sqrtPriceX96,
//         poolData.liquidity,
//         poolData.tick
//     );
//     const position = new Position({
//       pool: pool,
//       liquidity: ethers.utils.parseEther("1"),
//       tickLower: nearestUsableTick(poolData.tick, poolData.tickSpacing) - poolData.tickSpacing * 10,
//       tickUpper: nearestUsableTick(poolData.tick, poolData.tickSpacing) + poolData.tickSpacing * 10,
//   });
  
//   const { amount0: amount0Desired, amount1: amount1Desired } = position.mintAmounts;
  
//   const params = {
//       token0: TETHER_ADDRESS,
//       token1: USDC_ADDRESS,
//       fee: poolData.fee,
//       tickLower: position.tickLower,
//       tickUpper: position.tickUpper,
//       amount0Desired: amount0Desired.toString(),
//       amount1Desired: amount1Desired.toString(),
//       amount0Min: ethers.utils.parseEther("0.001"),
//       amount1Min: ethers.utils.parseEther("0.001"),
//       recipient: signer.address,
//       deadline: Math.floor(Date.now() / 1000) + 60 * 10, // 10 minutes from now
//   };
  

//       const NonfungiblePositionManager = new Contract(
//         POSITION_MANAGER_ADDRESS,
//         artifacts.NonfungiblePositionManager.abi,
//         provider
//       );
      
//       const tx = await NonfungiblePositionManager.connect(signer).mint(params, {
//         gasLimit:1000000
//       });
//       const receipt = await tx.wait();

//       // console.log("tx", tx);
// }

// /*
// npx hardhat run --network localhost Utils/04_addLiquidity.js
// */
// main().then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });


/*************************************UPDATED LIQUIDITY SCRIPT*************************************/




const { ethers } = require("hardhat");
const { Contract } = require("ethers");
const { Pool, Position, nearestUsableTick } = require("@uniswap/v3-sdk");
const { Token } = require("@uniswap/sdk-core");
const JSBI = require("jsbi");

require("dotenv").config();

// Uniswap contract addresses
const positionManagerAddress = process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS;
// Pool address
const USDT_USDC_500 = process.env.NEXT_PUBLIC_USDT_USDC_500;

// Token addresses
const TETHER_ADDRESS = process.env.NEXT_PUBLIC_TETHER_ADDRESS;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS;
const WRAPPED_BITCOIN_ADDRESS = process.env.NEXT_PUBLIC_WRAPPED_BITCOIN_ADDRESS;

// Import necessary contract ABIs
const artifacts = {
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
  UniswapV3Pool: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"),
  WETH9: require("../Context/WETH9.json"),
  Usdt: require("../artifacts/contracts/Tether.sol/Tether.json"),
  Usdc: require("../artifacts/contracts/Usdcoin.sol/UsdCoin.json"),
};

// Fetch pool data
async function getPoolData(poolContract) {
  const [tickSpacing, fee, liquidity, slot0] = await Promise.all([
    poolContract.tickSpacing(),
    poolContract.fee(),
    poolContract.liquidity(),
    poolContract.slot0(),
  ]);

  return {
    tickSpacing,
    fee,
    liquidity,
    sqrtPriceX96: slot0.sqrtPriceX96,
    tick: slot0.tick,
  };
}

// Main function to add liquidity
async function main() {
  const [owner, signer2] = await ethers.getSigners();
  const provider = ethers.provider;

  const usdtContract = new Contract(TETHER_ADDRESS, artifacts.Usdt.abi, provider);
  const usdcContract = new Contract(USDC_ADDRESS, artifacts.Usdc.abi, provider);
  const wrappedBitcoinContract = new Contract(WRAPPED_BITCOIN_ADDRESS, artifacts.WETH9.abi, provider);

  await usdtContract.connect(signer2).approve(
    positionManagerAddress,
    ethers.utils.parseUnits("1000", 18)
  );
  await usdcContract.connect(signer2).approve(
    positionManagerAddress,
    ethers.utils.parseUnits("1000", 18)
  );


  const usdtToken = new Token(31337, TETHER_ADDRESS, 18, "USDT", "Tether");
  const usdcToken = new Token(31337, USDC_ADDRESS, 18, "USDC", "USD Coin");

  const poolContract = new Contract(USDT_USDC_500, artifacts.UniswapV3Pool.abi, provider);
  const poolData = await getPoolData(poolContract);

  const pool = new Pool(
    usdtToken,
    usdcToken,
    poolData.fee,
    poolData.sqrtPriceX96,
    poolData.liquidity,
    poolData.tick
  );

  const tickLower = nearestUsableTick(poolData.tick, poolData.tickSpacing) - poolData.tickSpacing * 2;
  const tickUpper = nearestUsableTick(poolData.tick, poolData.tickSpacing) + poolData.tickSpacing * 2;

  const position = new Position({
    pool,
    liquidity: JSBI.BigInt(ethers.utils.parseUnits("2", 18).toString()),
    tickLower,
    tickUpper,
  });

  const { amount0: amount0Desired, amount1: amount1Desired } = position.mintAmounts;

  const params = {
    token0: TETHER_ADDRESS,
    token1: USDC_ADDRESS,
    fee: poolData.fee,
    tickLower,
    tickUpper,
    amount0Desired: JSBI.toNumber(amount0Desired),
    amount1Desired: JSBI.toNumber(amount1Desired),
    amount0Min: 0,
    amount1Min: 0,
    recipient: signer2.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 10,
  };

  const nonfungiblePositionManager = new Contract(
    positionManagerAddress,
    artifacts.NonfungiblePositionManager.abi,
    signer2
  );

  const tx = await nonfungiblePositionManager.mint(params, { gasLimit: 1000000 });

  const receipt = await tx.wait();
  console.log("Liquidity added amount:  ", amount0Desired, amount1Desired);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

  /**
   npx hardhat run --network localhost Utils/addLiquidity.js
   */

 

