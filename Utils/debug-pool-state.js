// debug-pool-state.js
const { ethers } = require("hardhat");

async function debugPoolState() {
  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);
  
  const POOL_ADDRESS = "0xd2e5C0519dc65d2Ac917d0E860C4D75e33A3D940";
  const POSITION_MANAGER = "0x06b96FF90F504A455a36CF7b2643dDFa0714812e";
  
  // Pool ABI for critical functions
  const poolABI = [
    "function token0() view returns (address)",
    "function token1() view returns (address)",
    "function fee() view returns (uint24)",
    "function tickSpacing() view returns (int24)",
    "function liquidity() view returns (uint128)",
    "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
    "function factory() view returns (address)"
  ];
  
  const pool = new ethers.Contract(POOL_ADDRESS, poolABI, signer);
  
  // Get all pool state
  const [token0, token1, fee, tickSpacing, liquidity, slot0, factoryAddr] = await Promise.all([
    pool.token0(),
    pool.token1(),
    pool.fee(),
    pool.tickSpacing(),
    pool.liquidity(),
    pool.slot0(),
    pool.factory()
  ]);
  
  console.log("\n=== POOL STATE ===");
  console.log("Token0:", token0);
  console.log("Token1:", token1);
  console.log("Fee:", fee.toString());
  console.log("Tick spacing:", tickSpacing.toString());
  console.log("Liquidity:", liquidity.toString());
  console.log("Current tick:", slot0.tick.toString());
  console.log("sqrtPriceX96:", slot0.sqrtPriceX96.toString());
  console.log("Factory:", factoryAddr);
  console.log("Initialized:", slot0.tick !== 0 || slot0.sqrtPriceX96 !== "0" ? "Yes" : "No");
  
  // Check if pool is actually initialized
  // The sqrtPriceX96 should not be 0 for an initialized pool
  if (slot0.sqrtPriceX96.eq(0)) {
    console.log("\n⚠️  POOL NOT INITIALIZED! sqrtPriceX96 is 0");
    console.log("This pool needs to be initialized with a starting price.");
    
    // Check if we can initialize it
    const positionManagerABI = [
      "function createAndInitializePoolIfNecessary(address token0, address token1, uint24 fee, uint160 sqrtPriceX96) returns (address pool)"
    ];
    
    const positionManager = new ethers.Contract(POSITION_MANAGER, positionManagerABI, signer);
    
    try {
      console.log("\nAttempting to initialize pool...");
      // Initialize with 1:1 price
      const sqrtPriceFor1to1 = "79228162514264337593543950336";
      const tx = await positionManager.createAndInitializePoolIfNecessary(
        token0,
        token1,
        fee,
        sqrtPriceFor1to1,
        { gasLimit: 1000000 }
      );
      
      console.log("Initialization transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("✅ Pool initialized successfully!");
      console.log("Gas used:", receipt.gasUsed.toString());
      
      // Check new pool state
      const newSlot0 = await pool.slot0();
      console.log("New sqrtPriceX96:", newSlot0.sqrtPriceX96.toString());
      console.log("New tick:", newSlot0.tick.toString());
      
    } catch (error) {
      console.error("❌ Failed to initialize pool:", error.message);
      
      // Check if pool already exists but just not initialized
      const factoryABI = ["function getPool(address,address,uint24) view returns (address)"];
      const factory = new ethers.Contract(factoryAddr, factoryABI, signer);
      const poolAddressFromFactory = await factory.getPool(token0, token1, fee);
      
      console.log("\n=== FACTORY CHECK ===");
      console.log("Pool from factory:", poolAddressFromFactory);
      console.log("Matches our pool:", poolAddressFromFactory.toLowerCase() === POOL_ADDRESS.toLowerCase());
    }
  } else {
    console.log("\n✅ Pool appears to be initialized");
    console.log("sqrtPriceX96 value suggests price is set");
  }
  
  // Try a different approach: check if we need to use a different tick range
  console.log("\n=== TICK ANALYSIS ===");
  console.log("Current tick:", slot0.tick);
  
  // For a 0.05% fee pool (500), valid ticks must be multiples of 10
  // Let's find valid ticks around current price
  const currentTick = slot0.tick;
  const validTickLower = Math.floor(currentTick / tickSpacing) * tickSpacing;
  const validTickUpper = Math.ceil((currentTick + 100) / tickSpacing) * tickSpacing;
  
  console.log("Suggested tickLower (aligned):", validTickLower);
  console.log("Suggested tickUpper (aligned):", validTickUpper);
  
  // Try a VERY simple mint with aligned ticks
  console.log("\n=== TEST MINT WITH ALIGNED TICKS ===");
  
  const positionManagerMintABI = [
    "function mint(tuple(address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)"
  ];
  
  const positionManager = new ethers.Contract(POSITION_MANAGER, positionManagerMintABI, signer);
  
  // Try with extremely small amounts and aligned ticks
  const testParams = {
    token0: token0,
    token1: token1,
    fee: fee,
    tickLower: validTickLower,
    tickUpper: validTickUpper,
    amount0Desired: ethers.utils.parseUnits("0.001", 18), // 0.001 tokens - VERY small
    amount1Desired: ethers.utils.parseUnits("0.001", 18), // 0.001 tokens - VERY small
    amount0Min: 0,
    amount1Min: 0,
    recipient: signer.address,
    deadline: Math.floor(Date.now() / 1000) + 3600,
  };
  
  console.log("Test params:", JSON.stringify(testParams, null, 2));
  
  try {
    const result = await positionManager.callStatic.mint(testParams, { gasLimit: 2000000 });
    console.log("✅ Test mint callStatic successful!");
    console.log("Liquidity:", result.liquidity.toString());
  } catch (error) {
    console.error("❌ Test mint failed:", error.message);
    
    // Try with createAndInitializePoolIfNecessary first if pool not initialized
    if (slot0.sqrtPriceX96.eq(0)) {
      console.log("\n🚨 CRITICAL: Pool exists but is NOT initialized.");
      console.log("You need to:");
      console.log("1. Call createAndInitializePoolIfNecessary() with a starting price");
      console.log("2. THEN add liquidity");
      
      // Provide the exact call to make
      console.log("\n📋 Run this initialization first:");
      console.log(`
      const positionManager = new ethers.Contract(
        "${POSITION_MANAGER}",
        ["function createAndInitializePoolIfNecessary(address token0, address token1, uint24 fee, uint160 sqrtPriceX96) returns (address)"],
        signer
      );
      
      await positionManager.createAndInitializePoolIfNecessary(
        "${token0}",
        "${token1}",
        ${fee},
        "79228162514264337593543950336", // 1:1 price
        { gasLimit: 2000000 }
      );
      `);
    }
  }
}

debugPoolState().catch(console.error);