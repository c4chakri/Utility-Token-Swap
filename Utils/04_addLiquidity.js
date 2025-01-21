const { ethers } = require("hardhat");
const { Contract } = require("ethers");
const { Pool, Position, nearestUsableTick } = require("@uniswap/v3-sdk");
const { Token } = require("@uniswap/sdk-core");
const { BigNumber } = require("ethers");
const JSBI = require("jsbi");

require("dotenv").config();

/**
 * Converts JSBI values to BigNumber.
 */
function toBigNumber(jsbiValue) {
  return BigNumber.from(jsbiValue.toString());
}

// Uniswap contract addresses
const positionManagerAddress = process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS;
const UT_POOL = process.env.NEXT_PUBLIC_UT_POOL;

// Token addresses
const NEXT_PUBLIC_UT1 = process.env.NEXT_PUBLIC_UT1;
const NEXT_PUBLIC_UT2 = process.env.NEXT_PUBLIC_UT2;

// Import necessary contract ABIs
const artifacts = {
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
  UniswapV3Pool: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"),
  Ut1: require("../artifacts/contracts/UT1.sol/SwapUT1.json"),
  Ut2: require("../artifacts/contracts/UT2.sol/SwapUT2.json"),
};

/**
 * Fetch pool data from the contract.
 */
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

/**
 * Main function to add liquidity.
 */
async function main() {
  const [owner, signer2] = await ethers.getSigners();
  const provider = ethers.provider;

  // Initialize token contracts
  const ut1Contract = new Contract(NEXT_PUBLIC_UT1, artifacts.Ut1.abi, signer2);
  const ut2Contract = new Contract(NEXT_PUBLIC_UT2, artifacts.Ut2.abi, signer2);

  // Check token balances
  const ut1Balance = await ut1Contract.balanceOf(signer2.address);
  const ut2Balance = await ut2Contract.balanceOf(signer2.address);

  console.log("UT1 Balance:", ut1Balance.toString());
  console.log("UT2 Balance:", ut2Balance.toString());

  // Approve tokens for the position manager
  try {
    await Promise.all([
      ut1Contract.connect(signer2).approve(positionManagerAddress, ethers.utils.parseUnits("1000", 18)),
      ut2Contract.connect(signer2).approve(positionManagerAddress, ethers.utils.parseUnits("1000", 18)),
    ]);
  } catch (error) {
    console.error("Approval error:", error);
    return;
  }

  // Check allowances
  const ut1Allowance = await ut1Contract.allowance(signer2.address, positionManagerAddress);
  const ut2Allowance = await ut2Contract.allowance(signer2.address, positionManagerAddress);

  console.log("UT1 Allowance:", ut1Allowance.toString());
  console.log("UT2 Allowance:", ut2Allowance.toString());

  // Fetch pool data
  const poolContract = new Contract(UT_POOL, artifacts.UniswapV3Pool.abi, provider);
  const poolData = await getPoolData(poolContract);
  console.log("Pool Data:", poolData);

  // Define tokens
  const ut1Token = new Token(31337, NEXT_PUBLIC_UT1, 18, "UT1", "UT1");
  const ut2Token = new Token(31337, NEXT_PUBLIC_UT2, 18, "UT2", "UT2");

  // Initialize the pool object
  const pool = new Pool(
    ut1Token,
    ut2Token,
    poolData.fee,
    poolData.sqrtPriceX96,
    poolData.liquidity,
    poolData.tick
  );

  // Calculate tick ranges
  const minTick = -887272;
  const maxTick = 887272;

  const tickLower = Math.max(
    nearestUsableTick(poolData.tick, poolData.tickSpacing) - poolData.tickSpacing * 2,
    minTick
  );
  const tickUpper = Math.min(
    nearestUsableTick(poolData.tick, poolData.tickSpacing) + poolData.tickSpacing * 2,
    maxTick
  );

  if (tickLower === minTick || tickUpper === maxTick) {
    console.warn("Tick range adjusted to fit within bounds.");
  }

  // Create position
  const position = new Position({
    pool,
    liquidity: JSBI.BigInt(ethers.utils.parseUnits("1", 18).toString()),
    tickLower,
    tickUpper,
  });

  const { amount0: amount0Desired, amount1: amount1Desired } = position.mintAmounts;

  console.log("Amount Desired:", {
    amount0: amount0Desired.toString(),
    amount1: amount1Desired.toString(),
  });

  // Validate balances
  if (ut1Balance.lt(toBigNumber(amount0Desired)) || ut2Balance.lt(toBigNumber(amount1Desired))) {
    throw new Error("Insufficient token balances for minting!");
  }

  // Mint parameters
  const params = {
    token0: NEXT_PUBLIC_UT1,
    token1: NEXT_PUBLIC_UT2,
    fee: poolData.fee,
    tickLower,
    tickUpper,
    amount0Desired: toBigNumber(amount0Desired),
    amount1Desired: toBigNumber(amount1Desired),
    amount0Min: 0,
    amount1Min: 0,
    recipient: signer2.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 10,
  };

  console.log("Mint Params:", params);

  // Mint liquidity
  const nonfungiblePositionManager = new Contract(
    positionManagerAddress,
    artifacts.NonfungiblePositionManager.abi,
    signer2
  );

  try {
    const tx = await nonfungiblePositionManager.mint(params, { gasLimit: 1000000 });
    const receipt = await tx.wait();
    console.log("Liquidity added:", receipt);
  } catch (error) {
    console.error("Error adding liquidity:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

/**
 * To run the script:
npx hardhat run --network localhost Utils/04_addLiquidity.js
 */
