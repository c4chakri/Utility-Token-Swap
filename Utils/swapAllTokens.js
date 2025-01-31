const { ethers } = require("hardhat");
const { Contract } = require("ethers");
require("dotenv").config();

// Provided addresses
const SWAP_ROUTER_ADDRESS = process.env.NEXT_PUBLIC_SWAP_ROUTER_ADDRESS;
const USDT_ADDRESS = process.env.NEXT_PUBLIC_TETHER_ADDRESS;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS;
const POOL_ADDRESS = process.env.NEXT_PUBLIC_UTILITY1_UTILITY2; // USDT/USDC Pool (500)


const SOL_ADDRESS = process.env.NEXT_PUBLIC_SCHOOL_OF_LAW_ADDRESS;
const UTILITY1_ADDRESS = process.env.NEXT_PUBLIC_UTILITY1_ADDRESS;

const USDT_UTILITY1 = process.env.NEXT_PUBLIC_USDT_UTILITY1;
const UTILITY2_ADDRESS = process.env.NEXT_PUBLIC_UTILITY2_ADDRESS;

const WRAPPED_BITCOIN_ADDRESS = process.env.NEXT_PUBLIC_WRAPPED_BITCOIN_ADDRESS;
const USDT_WBTC = process.env.NEXT_PUBLIC_USDT_WBTC;

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

const provider = ethers.provider;

async function swapExactInputSingle(tokenIn, tokenOut, amountIn) {
  const [deployer] = await ethers.getSigners();
  const swapRouter = new Contract(
    SWAP_ROUTER_ADDRESS,
    artifacts.SwapRouter.abi,
    deployer
  );

  recipient = deployer.address;

  // Initialize the ERC20 token contracts dynamically
  const tokenInContract = new Contract(tokenIn, artifacts.ERC20.abi, deployer);
  const tokenOutContract = new Contract(
    tokenOut,
    artifacts.ERC20.abi,
    deployer
  );

  const allowance = await tokenInContract.allowance(deployer.address, SWAP_ROUTER_ADDRESS);
  console.log("Allowance:", ethers.utils.formatUnits(allowance, 6));

  if (allowance.lt(amountIn)) {
    console.error("Insufficient allowance! Approving now...");
    const approveTx = await tokenInContract.approve(SWAP_ROUTER_ADDRESS, amountIn);
    await approveTx.wait();
  }
  const pool = new Contract(POOL_ADDRESS, artifacts.Pool.abi, deployer);
  const token0 = await pool.token0();
  const token1 = await pool.token1();
  console.log(`Pool tokens: ${token0} - ${token1}`);

  const liquidity = await pool.liquidity();
  console.log("Pool Liquidity:", liquidity.toString());

  const tokenBalance = await tokenInContract.balanceOf(deployer.address);
  console.log("Token In Balance:", ethers.utils.formatUnits(tokenBalance, 6));

  if (tokenBalance.lt(amountIn)) {
    console.error("Insufficient token balance to swap!");
  }

  // Fetch the balances before the swap
  const tokenInUserBalBefore = await tokenInContract.balanceOf(recipient);
  const tokenOutUserBalBefore = await tokenOutContract.balanceOf(recipient);

  const tokenInPoolBalBefore = await tokenInContract.balanceOf(POOL_ADDRESS);
  const tokenOutPoolBalBefore = await tokenOutContract.balanceOf(POOL_ADDRESS);

  await logPoolLiquidity(pool);

  // Approve SwapRouter for tokenIn
  await tokenInContract.approve(SWAP_ROUTER_ADDRESS, amountIn);

  // Swap parameters
  const params = {
    tokenIn: tokenIn, // Dynamic token address
    tokenOut: tokenOut, // Dynamic token address
    fee: 10000, // Pool fee, adjust as needed
    recipient,
    deadline: Math.floor(Date.now() / 1000) + 60 * 10, // 10 minute deadline
    amountIn,
    amountOutMinimum: 0, // Can be adjusted based on slippage tolerance
    sqrtPriceLimitX96: 0, // Set to 0 to disable price limit
  };

  // Execute swap
  try {
    const tx = await swapRouter.exactInputSingle(params, { gasLimit: 500000 });
    const receipt = await tx.wait();
    console.log("Swap executed successfully!");

    // Fetch the balances after the swap
    const tokenInUserBalAfter = await tokenInContract.balanceOf(recipient);
    const tokenOutUserBalAfter = await tokenOutContract.balanceOf(recipient);

    const tokenInPoolBalAfter = await tokenInContract.balanceOf(POOL_ADDRESS);
    const tokenOutPoolBalAfter = await tokenOutContract.balanceOf(POOL_ADDRESS);

    // Differences in balances
    const tokenInUserDiff = tokenInUserBalAfter.sub(tokenInUserBalBefore);
    const tokenOutUserDiff = tokenOutUserBalAfter.sub(tokenOutUserBalBefore);

    const tokenInPoolDiff = tokenInPoolBalAfter.sub(tokenInPoolBalBefore);
    const tokenOutPoolDiff = tokenOutPoolBalAfter.sub(tokenOutPoolBalBefore);

    console.log(
      `${tokenOut} Received by user from swap:`,
      tokenOutUserDiff.toString(),
      ethers.utils.formatUnits(tokenOutUserDiff, 18)
    );
    console.log(
      `${tokenIn} Received by pool from swap:`,
      tokenOutUserDiff.toString(),
      ethers.utils.formatUnits(tokenInPoolDiff, 18)
    );

    console.log(
      `${tokenIn} Spent by user in swap:`,
      tokenInUserDiff.toString(),
      ethers.utils.formatUnits(tokenInUserDiff, 18)
    );
    console.log(
      `${tokenOut} Spent by pool in swap:`,
      tokenOutPoolDiff.toString(),
      ethers.utils.formatUnits(tokenOutPoolDiff, 18)
    );

    await logPoolLiquidity(pool);
  } catch (error) {
    console.error("Swap failed:", error.message);
  }
}

const tokenIn = UTILITY1_ADDRESS;
const tokenOut = UTILITY2_ADDRESS;
const amountIn = ethers.utils.parseUnits("1", 18); // 100 USDC (assuming 6 decimals for USDC)

// Run the function
swapExactInputSingle(tokenIn, tokenOut, amountIn)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in script execution:", error.message);
    process.exit(1);
  });

/*
  npx hardhat run --network localhost Utils/swapAllTokens.js
    
*/
