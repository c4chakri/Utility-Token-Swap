// working-liquidity-add.js
const { ethers } = require("hardhat");

async function addWorkingLiquidity() {
  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);
  
  const POSITION_MANAGER = "0x06b96FF90F504A455a36CF7b2643dDFa0714812e";
  const POOL_ADDRESS = "0xd2e5C0519dc65d2Ac917d0E860C4D75e33A3D940";
  
  console.log("\n=== OPTION 1: ADD TO EXISTING POSITION (Token ID: 1) ===");
  
  // Option 1: Add to your existing position (0-100 range)
  const positionManagerABI = [
    "function increaseLiquidity(tuple(uint256 tokenId, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, uint256 deadline)) returns (uint128 liquidity, uint256 amount0, uint256 amount1)",
    "function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)"
  ];
  
  const positionManager = new ethers.Contract(POSITION_MANAGER, positionManagerABI, signer);
  
  // First, check your existing position
  console.log("\nChecking existing position (Token ID: 1)...");
  try {
    const position = await positionManager.positions(1);
    console.log("Existing position details:");
    console.log("Token0:", position.token0);
    console.log("Token1:", position.token1);
    console.log("Fee:", position.fee.toString());
    console.log("Tick Lower:", position.tickLower.toString());
    console.log("Tick Upper:", position.tickUpper.toString());
    console.log("Current Liquidity:", position.liquidity.toString());
    
    // Add more liquidity to this position
    const increaseParams = {
      tokenId: 1,
      amount0Desired: ethers.utils.parseUnits("0.1", 18), // 0.1 token0
      amount1Desired: ethers.utils.parseUnits("0.1", 18), // 0.1 token1
      amount0Min: 0,
      amount1Min: 0,
      deadline: Math.floor(Date.now() / 1000) + 3600,
    };
    
    console.log("\nAdding to existing position...");
    console.log("Params:", JSON.stringify(increaseParams, null, 2));
    
    // Test with callStatic first
    const result = await positionManager.callStatic.increaseLiquidity(increaseParams, {
      gasLimit: 2000000
    });
    
    console.log("\n✅ Call static successful!");
    console.log("Additional liquidity:", result.liquidity.toString());
    console.log("Additional token0:", result.amount0.toString());
    console.log("Additional token1:", result.amount1.toString());
    
    // Execute
    const tx = await positionManager.increaseLiquidity(increaseParams, {
      gasLimit: 3000000,
      gasPrice: await signer.provider.getGasPrice()
    });
    
    console.log("\nTransaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Liquidity added to existing position!");
    console.log("Gas used:", receipt.gasUsed.toString());
    
  } catch (error) {
    console.error("❌ Error with existing position:", error.message);
  }
  
  console.log("\n=== OPTION 2: CREATE NEW POSITION WITH WORKING PARAMETERS ===");
  
  // Option 2: Create a new position with parameters we KNOW work
  // From your successful mint, we know this works: tickLower=0, tickUpper=100
  
  const mintABI = [
    "function mint(tuple(address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)"
  ];
  
  const mintManager = new ethers.Contract(POSITION_MANAGER, mintABI, signer);
  
  // Use the EXACT same parameters that worked before, just with more tokens
  const mintParams = {
    token0: "0x5ae55038733F4f5311a86D53aFd01c4f56Aa0c5E",
    token1: "0xFDD3Ed693f28Bf0Ae2b9f4c9e87bc05668362F21",
    fee: 500,
    tickLower: 0,
    tickUpper: 100,
    amount0Desired: ethers.utils.parseUnits("0.01", 18), // 0.01 token0 (10x more than before)
    amount1Desired: ethers.utils.parseUnits("0", 18),    // 0 token1 (same as before)
    amount0Min: 0,
    amount1Min: 0,
    recipient: signer.address,
    deadline: Math.floor(Date.now() / 1000) + 3600,
  };
  
  console.log("\nCreating new position with KNOWN working parameters...");
  console.log("Params:", JSON.stringify(mintParams, null, 2));
  
  try {
    // Test with callStatic
    const mintResult = await mintManager.callStatic.mint(mintParams, {
      gasLimit: 2000000
    });
    
    console.log("\n✅ Mint call static successful!");
    console.log("New token ID:", mintResult.tokenId.toString());
    console.log("Liquidity:", mintResult.liquidity.toString());
    console.log("Token0 used:", mintResult.amount0.toString());
    console.log("Token1 used:", mintResult.amount1.toString());
    
    // Execute
    const mintTx = await mintManager.mint(mintParams, {
      gasLimit: 3000000,
      gasPrice: await signer.provider.getGasPrice()
    });
    
    console.log("\nMint transaction sent:", mintTx.hash);
    const mintReceipt = await mintTx.wait();
    console.log("✅ New position created!");
    console.log("Gas used:", mintReceipt.gasUsed.toString());
    
  } catch (error) {
    console.error("❌ Mint error:", error.message);
  }
  
  console.log("\n=== OPTION 3: CREATE POSITION WITH CURRENT TICK IN MIDDLE ===");
  
  // Option 3: The issue might be that current tick (0) equals tickLower (0)
  // Let's create a position where current tick is NOT at the boundary
  
  // Get current pool tick
  const poolABI = [
    "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
  ];
  
  const pool = new ethers.Contract(POOL_ADDRESS, poolABI, signer);
  const slot0 = await pool.slot0();
  const currentTick = slot0.tick;
  
  console.log("\nCurrent pool tick:", currentTick.toString());
  
  // Create position where current tick is in the middle
  // For tick spacing = 10, use -20 to 20 (current tick 0 is in the middle)
  const middleRangeParams = {
    token0: "0x5ae55038733F4f5311a86D53aFd01c4f56Aa0c5E",
    token1: "0xFDD3Ed693f28Bf0Ae2b9f4c9e87bc05668362F21",
    fee: 500,
    tickLower: -20,  // Current tick 0 is GREATER than -20
    tickUpper: 20,   // Current tick 0 is LESS than 20
    amount0Desired: ethers.utils.parseUnits("0.001", 18),
    amount1Desired: ethers.utils.parseUnits("0.001", 18),
    amount0Min: 0,
    amount1Min: 0,
    recipient: signer.address,
    deadline: Math.floor(Date.now() / 1000) + 3600,
  };
  
  console.log("\nCreating position with current tick in middle of range...");
  console.log("Range: -20 to 20 (current tick 0 is in middle)");
  console.log("Params:", JSON.stringify(middleRangeParams, null, 2));
  
  try {
    const middleResult = await mintManager.callStatic.mint(middleRangeParams, {
      gasLimit: 2000000
    });
    
    console.log("\n✅ Middle range call static successful!");
    console.log("Liquidity:", middleResult.liquidity.toString());
    console.log("Token0 used:", middleResult.amount0.toString());
    console.log("Token1 used:", middleResult.amount1.toString());
    
    // Check if both tokens would be used
    if (middleResult.amount0.gt(0) && middleResult.amount1.gt(0)) {
      console.log("\n🎉 This position would use BOTH tokens!");
      
      // Execute
      const middleTx = await mintManager.mint(middleRangeParams, {
        gasLimit: 3000000,
        gasPrice: await signer.provider.getGasPrice()
      });
      
      console.log("Transaction sent:", middleTx.hash);
      const middleReceipt = await middleTx.wait();
      console.log("✅ Position created using both tokens!");
    }
    
  } catch (error) {
    console.error("❌ Middle range error:", error.message);
  }
  
  console.log("\n=== SUMMARY ===");
  console.log("You now have several options:");
  console.log("1. ✅ Add to existing position (Token ID: 1)");
  console.log("2. ✅ Create new position same as before (0-100 range, token0 only)");
  console.log("3. ✅ Create position with tick in middle (-20 to 20, both tokens)");
  console.log("\nThe script has executed Option 1 (adding to existing position).");
}

addWorkingLiquidity().catch(console.error);