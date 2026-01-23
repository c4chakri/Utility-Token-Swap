/*************************************
 * UNISWAP V3 ADD LIQUIDITY – DEBUG SAFE
 *************************************/

const { ethers } = require("hardhat");
const { Contract } = require("ethers");
const { Pool, Position, nearestUsableTick } = require("@uniswap/v3-sdk");
const { Token } = require("@uniswap/sdk-core");
require("dotenv").config();

/* ================= ENV ================= */

const POSITION_MANAGER = process.env.MOBIUS_POSITION_MANAGER_ADDRESS;
const POOL_ADDRESS = process.env.MOBIUS_UTILITY1_UTILITY2;

const TOKEN_A = process.env.MOBIUS_UTILITY1_ADDRESS;
const TOKEN_B = process.env.MOBIUS_UTILITY2_ADDRESS;

/* ================= ABIS ================= */

const artifacts = {
  Pool: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"),
  PositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
  ERC20: require("../artifacts/contracts/UT1.sol/Utility1.json"),
};

/* ================= HELPERS ================= */

async function approve(token, owner, amount) {
  const tx = await token.connect(owner).approve(POSITION_MANAGER, amount);
  await tx.wait();
}

/* ================= MAIN LOGIC ================= */

async function addLiquidity() {
  const [owner,signer] = await ethers.getSigners();
  const provider = ethers.provider;

  console.log("\n================ START =================");
  console.log("LP Signer:", signer.address);

  /* ---------- Pool ---------- */

  const pool = new Contract(POOL_ADDRESS, artifacts.Pool.abi, provider);

  const [poolToken0, poolToken1, fee, liquidity, slot0, tickSpacing] =
    await Promise.all([
      pool.token0(),
      pool.token1(),
      pool.fee(),
      pool.liquidity(),
      pool.slot0(),
      pool.tickSpacing(),
    ]);

  console.log("\n=== POOL STATE ===");
  console.log("token0:", poolToken0);
  console.log("token1:", poolToken1);
  console.log("sqrtPriceX96:", slot0.sqrtPriceX96.toString());
  console.log("tick:", slot0.tick.toString());

  if (slot0.sqrtPriceX96.eq(0)) {
    throw new Error("❌ Pool not initialized");
  }

  /* ---------- Tokens ---------- */

  const erc20_0 = new Contract(poolToken0, artifacts.ERC20.abi, provider);
  const erc20_1 = new Contract(poolToken1, artifacts.ERC20.abi, provider);



  const [dec0, dec1, bal0, bal1] = await Promise.all([
    erc20_0.decimals(),
    erc20_1.decimals(),
    erc20_0.balanceOf(signer.address),
    erc20_1.balanceOf(signer.address),
  ]);

  console.log("\n=== TOKEN STATE ===");
  console.log("Decimals token0:", dec0);
  console.log("Decimals token1:", dec1);
  console.log("Balance token0:", bal0.toString());
  console.log("Balance token1:", bal1.toString());

  if (bal0.eq(0) || bal1.eq(0)) {
    throw new Error("❌ Signer has zero token balance");
  }

  /* ---------- Approvals ---------- */

  console.log("\n=== APPROVALS ===");
  await approve(erc20_0, signer, ethers.constants.MaxUint256);
  await approve(erc20_1, signer, ethers.constants.MaxUint256);

  const [allow0, allow1] = await Promise.all([
    erc20_0.allowance(signer.address, POSITION_MANAGER),
    erc20_1.allowance(signer.address, POSITION_MANAGER),
  ]);

  console.log("Allowance token0:", allow0.toString());
  console.log("Allowance token1:", allow1.toString());

  /* ---------- SDK Tokens ---------- */

  const token0 = new Token(31337, poolToken0, dec0);
  const token1 = new Token(31337, poolToken1, dec1);

  const sdkPool = new Pool(
    token0,
    token1,
    fee,
    slot0.sqrtPriceX96.toString(),
    liquidity.toString(),
    slot0.tick
  );

  /* ---------- Ticks ---------- */

  const tickLower =
    nearestUsableTick(slot0.tick, tickSpacing) - tickSpacing * 2;
  const tickUpper =
    nearestUsableTick(slot0.tick, tickSpacing) + tickSpacing * 2;

  console.log("\n=== TICKS ===");
  console.log("tickLower:", tickLower);
  console.log("tickUpper:", tickUpper);

  /* ---------- Position ---------- */

  const position = Position.fromAmounts({
    pool: sdkPool,
    tickLower,
    tickUpper,
    amount0: ethers.utils.parseUnits("10", dec0).toString(),
    amount1: ethers.utils.parseUnits("10", dec1).toString(),
    useFullPrecision: true,
  });

  const { amount0, amount1 } = position.mintAmounts;

  console.log("\n=== MINT AMOUNTS ===");
  console.log("amount0:", amount0.toString());
  console.log("amount1:", amount1.toString());

  /* ---------- Mint ---------- */

  const manager = new Contract(
    POSITION_MANAGER,
    artifacts.PositionManager.abi,
    signer
  );

  const params = {
    token0: poolToken0,
    token1: poolToken1,
    fee,
    tickLower,
    tickUpper,
    amount0Desired: amount0.toString(),
    amount1Desired: amount1.toString(),
    amount0Min: 0,
    amount1Min: 0,
    recipient: signer.address,
    deadline: Math.floor(Date.now() / 1000) + 600,
  };

  console.log("\n=== MINTING POSITION ===");

  const tx = await manager.mint(params, { gasLimit: 3_000_000 });
  const receipt = await tx.wait();

  console.log("✅ Liquidity added");
  console.log("Tx:", receipt.transactionHash);
}

/* ================= RUN ================= */

addLiquidity()
  .then(() => {
    console.log("\n================ DONE =================");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ FAILED:", err.message);
    process.exit(1);
  });

  /*
  npx hardhat run --network localhost Utils/addLiquidity.js 
  */