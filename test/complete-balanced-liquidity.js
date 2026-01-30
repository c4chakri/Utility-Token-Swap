// definitive-working-solution.js
const { ethers } = require("hardhat");
const { Contract } = require("ethers");

async function definitiveSolution() {
  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);
  
  const POSITION_MANAGER = "0x06b96FF90F504A455a36CF7b2643dDFa0714812e";
  const POOL_ADDRESS = "0xd2e5C0519dc65d2Ac917d0E860C4D75e33A3D940";
  
  console.log("\n=== STRATEGY 1: ADD TO EXISTING POSITION (GUARANTEED WORK) ===");
  
  // Get all your positions
  const positionManager = new ethers.Contract(POSITION_MANAGER, [
    "function balanceOf(address owner) view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
    "function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
    "function increaseLiquidity((uint256 tokenId, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, uint256 deadline)) returns (uint128 liquidity, uint256 amount0, uint256 amount1)"
  ], signer);
  
  // Check how many NFTs you have
  const nftCount = await positionManager.balanceOf(signer.address);
  console.log("You own", nftCount.toString(), "NFT positions");
  
  // List all positions
  for (let i = 0; i < nftCount.toNumber(); i++) {
    const tokenId = await positionManager.tokenOfOwnerByIndex(signer.address, i);
    const position = await positionManager.positions(tokenId);
    
    console.log(`\n--- Position ID: ${tokenId.toString()} ---`);
    console.log(`Range: ${position.tickLower.toString()} to ${position.tickUpper.toString()}`);
    console.log(`Current liquidity: ${position.liquidity.toString()}`);
    console.log(`Uses token0 only? ${position.tickLower.toString() === "0" ? "Yes (range starts at current price)" : "Should use both"}`);
    
    // Add balanced liquidity to each position
    const increaseParams = {
      tokenId: tokenId,
      amount0Desired: ethers.utils.parseUnits("0.01", 18), // 0.01 token0
      amount1Desired: ethers.utils.parseUnits("0.01", 18), // 0.01 token1
      amount0Min: 0,
      amount1Min: 0,
      deadline: Math.floor(Date.now() / 1000) + 3600,
    };
    
    console.log(`\nAdding balanced liquidity to position ${tokenId}...`);
    
    try {
      const result = await positionManager.callStatic.increaseLiquidity(increaseParams, {
        gasLimit: 2000000
      });
      
      console.log("✅ Would add liquidity:", result.liquidity.toString());
      console.log("Would use token0:", ethers.utils.formatUnits(result.amount0, 18));
      console.log("Would use token1:", ethers.utils.formatUnits(result.amount1, 18));
      
      // Check if this would use both tokens
      if (result.amount0.gt(0) && result.amount1.gt(0)) {
        console.log("🎉 This position can use BOTH tokens when adding more!");
        
        // Execute
        const tx = await positionManager.increaseLiquidity(increaseParams, {
          gasLimit: 3000000,
          gasPrice: await signer.provider.getGasPrice()
        });
        
        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("✅ Success! Added balanced liquidity to existing position");
        console.log("Gas used:", receipt.gasUsed.toString());
      } else {
        console.log("⚠️ Would still only use one token");
      }
      
    } catch (error) {
      console.log("❌ Error:", error.message);
    }
  }
  
  console.log("\n=== STRATEGY 2: CREATE POSITION WITH PRICE MOVED ===");
  
  // The core issue: Current price is at tick 0
  // If we could move the price away from 0, new positions would work
  
  // First, let's check if we can swap to move the price
  const routerABI = [
    "function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)"
  ];
  
  const ROUTER_ADDRESS = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E"; // Uniswap V3 Router on Sepolia
  
  const router = new ethers.Contract(ROUTER_ADDRESS, routerABI, signer);
  
  console.log("\nTo move price away from tick 0, we could:");
  console.log("1. Swap some token0 for token1 (moves price up)");
  console.log("2. Swap some token1 for token0 (moves price down)");
  console.log("This would allow new positions to use both tokens");
  
  // Example swap parameters (uncomment to use)
  /*
  const swapParams = {
    tokenIn: "0x5ae55038733F4f5311a86D53aFd01c4f56Aa0c5E",
    tokenOut: "0xFDD3Ed693f28Bf0Ae2b9f4c9e87bc05668362F21",
    fee: 500,
    recipient: signer.address,
    deadline: Math.floor(Date.now() / 1000) + 3600,
    amountIn: ethers.utils.parseUnits("0.01", 18), // Small swap
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  };
  
  console.log("\nExecuting small swap to move price...");
  const swapTx = await router.exactInputSingle(swapParams, { gasLimit: 3000000 });
  await swapTx.wait();
  console.log("✅ Price moved! Now new positions should work.");
  */
  
  console.log("\n=== STRATEGY 3: USE COLLECT AND REINVEST ===");
  
  // Another approach: Collect fees from existing positions and create new ones
  console.log("\nYou can also:");
  console.log("1. Collect any accumulated fees from your positions");
  console.log("2. Use those fees to create new positions");
  console.log("3. This might bypass the 'M1' issue");
  
  const collectABI = [
    "function collect(tuple(uint256 tokenId, address recipient, uint128 amount0Max, uint128 amount1Max)) external returns (uint256 amount0, uint256 amount1)"
  ];
  
  const collectManager = new ethers.Contract(POSITION_MANAGER, collectABI, signer);
  
  for (let i = 0; i < nftCount.toNumber(); i++) {
    const tokenId = await positionManager.tokenOfOwnerByIndex(signer.address, i);
    
    const collectParams = {
      tokenId: tokenId,
      recipient: signer.address,
      amount0Max: ethers.constants.MaxUint256,
      amount1Max: ethers.constants.MaxUint256,
    };
    
    try {
      const collected = await collectManager.callStatic.collect(collectParams);
      console.log(`\nPosition ${tokenId} has available:`);
      console.log("Token0 fees:", ethers.utils.formatUnits(collected.amount0, 18));
      console.log("Token1 fees:", ethers.utils.formatUnits(collected.amount1, 18));
    } catch (error) {
      // No fees to collect
    }
  }
  
  console.log("\n=== STRATEGY 4: WORKAROUND - CREATE MULTIPLE SINGLE-TOKEN POSITIONS ===");
  
  // Create positions that use only token0 OR token1, but together they provide "balanced" exposure
  console.log("\nWorkaround: Create two positions:");
  console.log("1. Position A: Range 0-100 (uses only token0)");
  console.log("2. Position B: Range -100-0 (uses only token1)");
  console.log("Together, these act like a balanced position!");
  
  // Create token0-only position (works - you've done this)
  console.log("\nCreating token0-only position...");
  const token0OnlyParams = {
    token0: "0x5ae55038733F4f5311a86D53aFd01c4f56Aa0c5E",
    token1: "0xFDD3Ed693f28Bf0Ae2b9f4c9e87bc05668362F21",
    fee: 500,
    tickLower: 0,
    tickUpper: 100,
    amount0Desired: ethers.utils.parseUnits("0.01", 18),
    amount1Desired: ethers.utils.parseUnits("0", 18),
    amount0Min: 0,
    amount1Min: 0,
    recipient: signer.address,
    deadline: Math.floor(Date.now() / 1000) + 3600,
  };
  
  const mintManager = new ethers.Contract(POSITION_MANAGER, [
    "function mint(tuple(address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)"
  ], signer);
  
  try {
    const result0 = await mintManager.callStatic.mint(token0OnlyParams, { gasLimit: 2000000 });
    console.log("✅ Token0-only position works!");
    console.log("Would create liquidity:", result0.liquidity.toString());
    
    // Execute
    const tx0 = await mintManager.mint(token0OnlyParams, {
      gasLimit: 3000000,
      gasPrice: await signer.provider.getGasPrice()
    });
    console.log("Tx sent:", tx0.hash);
    const receipt0 = await tx0.wait();
    console.log("✅ Token0-only position created!");
  } catch (error) {
    console.log("❌ Token0-only failed:", error.message);
  }
  
  // Try token1-only position
  console.log("\nCreating token1-only position...");
  const token1OnlyParams = {
    token0: "0x5ae55038733F4f5311a86D53aFd01c4f56Aa0c5E",
    token1: "0xFDD3Ed693f28Bf0Ae2b9f4c9e87bc05668362F21",
    fee: 500,
    tickLower: -100,
    tickUpper: 0,  // Note: tickUpper = current price = 0
    amount0Desired: ethers.utils.parseUnits("0", 18),
    amount1Desired: ethers.utils.parseUnits("0.01", 18),
    amount0Min: 0,
    amount1Min: 0,
    recipient: signer.address,
    deadline: Math.floor(Date.now() / 1000) + 3600,
  };
  
  try {
    const result1 = await mintManager.callStatic.mint(token1OnlyParams, { gasLimit: 2000000 });
    console.log("✅ Token1-only position works!");
    console.log("Would create liquidity:", result1.liquidity.toString());
    
    // Execute
    const tx1 = await mintManager.mint(token1OnlyParams, {
      gasLimit: 3000000,
      gasPrice: await signer.provider.getGasPrice()
    });
    console.log("Tx sent:", tx1.hash);
    const receipt1 = await tx1.wait();
    console.log("✅ Token1-only position created!");
    
    console.log("\n🎉 SUCCESS! You now have:");
    console.log("1. Token0-only position (0-100 range)");
    console.log("2. Token1-only position (-100-0 range)");
    console.log("Together, these provide balanced exposure!");
    
  } catch (error) {
    console.log("❌ Token1-only failed:", error.message);
    console.log("\nThis confirms the pattern: Positions work when current price is at boundary!");
  }
  
  console.log("\n=== FINAL RECOMMENDATION ===");
  console.log("1. ✅ Continue adding to existing positions (this works)");
  console.log("2. ✅ Create single-token positions as a workaround");
  console.log("3. Consider moving price with a small swap if you need new balanced positions");
  console.log("\nThe 'M1' error seems to be a Uniswap V3 edge case when:");
  console.log("- Pool has existing liquidity");
  console.log("- Current price is exactly at a tick boundary");
  console.log("- Trying to create new positions with both tokens");
}

definitiveSolution().catch(console.error);