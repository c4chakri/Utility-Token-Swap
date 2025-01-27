
const { ethers } = require("hardhat");
const { Contract } = require("ethers");
require("dotenv").config();

// Provided addresses
const SWAP_ROUTER_ADDRESS = process.env.NEXT_PUBLIC_SWAP_ROUTER_ADDRESS;
const USDT_ADDRESS = process.env.NEXT_PUBLIC_TETHER_ADDRESS;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS;
const POOL_ADDRESS = process.env.NEXT_PUBLIC_USDT_USDC_500; // USDT/USDC Pool (500)

console.table({
  SWAP_ROUTER_ADDRESS,
  USDT_ADDRESS,
  USDC_ADDRESS,
  POOL_ADDRESS,
});

const artifacts = {
  SwapRouter: require("@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json"),
  ERC20: require("@openzeppelin/contracts/build/contracts/ERC20.json"),
  Pool: require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json"),
};

async function getBalances(tokenContract, address) {
  const balance = await tokenContract.balanceOf(address);
  return balance; // Assuming USDT and USDC have 6 decimals
}

async function logPoolLiquidity(pool) {
  const [liquidity, sqrtPriceX96] = await Promise.all([
    pool.liquidity(),
    pool.slot0().then((slot) => slot.sqrtPriceX96),
  ]);


}


async function swapExactInputSingle() {
  const [deployer] = await ethers.getSigners();
  const provider = ethers.provider;

  const swapRouter = new Contract(SWAP_ROUTER_ADDRESS, artifacts.SwapRouter.abi, deployer);
  const usdtContract = new Contract(USDT_ADDRESS, artifacts.ERC20.abi, deployer);
  const usdcContract = new Contract(USDC_ADDRESS, artifacts.ERC20.abi, deployer);
  const pool = new Contract(POOL_ADDRESS, artifacts.Pool.abi, deployer);

  const amountIn ="250"; // 1 USDT
  const recipient = deployer.address;

const usdtUserBalBefore = await usdtContract.balanceOf(recipient);
const usdcUserBalBefore = await usdcContract.balanceOf(recipient);

const usdtPoolBalBefore = await usdtContract.balanceOf(POOL_ADDRESS);
const usdcPoolBalBefore = await usdcContract.balanceOf(POOL_ADDRESS);

//   console.log("=== SWAP EXACT INPUT SINGLE ===");
//   console.log("USDT Pool balance before swap:", await usdtContract.balanceOf(POOL_ADDRESS));
//   console.log("USDC Pool balance before swap:", await usdcContract.balanceOf(POOL_ADDRESS));
//   // Log balances before swap
//   console.log("=== BALANCES BEFORE SWAP ===");
//   console.log("USDT Balance (User):",recipient, await getBalances(usdtContract, recipient));
//   console.log("USDC Balance (User):",recipient, await getBalances(usdcContract, recipient));

//   console.log("=== POOL STATE BEFORE SWAP ===");

  await logPoolLiquidity(pool);

  // Approve SwapRouter
  await usdtContract.approve(SWAP_ROUTER_ADDRESS, amountIn);

  // Swap parameters
  const params = {
    tokenIn: USDT_ADDRESS,
    tokenOut: USDC_ADDRESS,
    fee: 500,
    recipient,
    deadline: Math.floor(Date.now() / 1000) + 60 * 10,
    amountIn,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  };

  // Execute swap
  try {
    const tx = await swapRouter.exactInputSingle(params, { gasLimit: 500000 });
    const receipt = await tx.wait();
    console.log("Swap executed successfully!");

    const usdtUserBalAfter = await usdtContract.balanceOf(recipient);
    const usdcUserBalAfter = await usdcContract.balanceOf(recipient);

    const usdtPoolBalAfter = await usdtContract.balanceOf(POOL_ADDRESS);
    const usdcPoolBalAfter = await usdcContract.balanceOf(POOL_ADDRESS);


    // Differences in balances
    const usdtUserDiff = usdtUserBalAfter.sub(usdtUserBalBefore);
    const usdcUserDiff = usdcUserBalAfter.sub(usdcUserBalBefore);

    const usdtPoolDiff = usdtPoolBalAfter.sub(usdtPoolBalBefore);
    const usdcPoolDiff = usdcPoolBalAfter.sub(usdcPoolBalBefore);

    // console.log("USDT transferred to user:", usdtUserDiff.toString());
    console.log("USDC Received by user from swap:", usdcUserDiff.toString());

    console.log("USDT Received by pool from swap:", usdtPoolDiff.toString());
    // console.log("USDC Pool balance after swap:", usdcPoolDiff.toString());

    // // Log balances after swap
    // console.log("\n=== BALANCES AFTER SWAP ===");
    // console.log("USDT Balance (User):",recipient, await getBalances(usdtContract, recipient));
    // console.log("USDC Balance (User):",recipient, await getBalances(usdcContract, recipient));

    // console.log("=== POOL STATE AFTER SWAP ===");
    await logPoolLiquidity(pool);

    // console.log("USDT Pool balance after swap:", await usdtContract.balanceOf(POOL_ADDRESS));
    // console.log("USDC Pool balance after swap:", await usdcContract.balanceOf(POOL_ADDRESS));

    // console.log("Swap executed successfully!");

    // console.log("USDC transferred to user:", await getBalances(usdcContract, recipient));
    // console.log("USDT transferred to user:", await getBalances(usdtContract, recipient));
    
    
    
    
 
  } catch (error) {
    console.error("Swap failed:", error.message);
  }
}

// Run the function
swapExactInputSingle()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in script execution:", error.message);
    process.exit(1);
  });


  /*
  npx hardhat run --network localhost Utils/swapToken1.js
  
  */