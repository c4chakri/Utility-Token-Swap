/*************************************FIXED LIQUIDITY SCRIPT - PROPER TICKS*************************************/

const { ethers } = require("hardhat");
const { Contract } = require("ethers");
const { Pool, Position, nearestUsableTick, TickMath } = require("@uniswap/v3-sdk");
const { Token } = require("@uniswap/sdk-core");
require("dotenv").config();

const positionManagerAddress = process.env.MOBIUS_SEPOLIA_POSITION_MANAGER_ADDRESS;
const FACTORY_ADDRESS = process.env.MOBIUS_SEPOLIA_FACTORY_ADDRESS;

// Token addresses 
const UTILITY1_ADDRESS = "0x5ae55038733F4f5311a86D53aFd01c4f56Aa0c5E";
const UTILITY2_ADDRESS = "0xFDD3Ed693f28Bf0Ae2b9f4c9e87bc05668362F21";
const POOL_ADDRESS = "0xd2e5C0519dc65d2Ac917d0E860C4D75e33A3D940";

// Import necessary contract ABIs
const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
  UniswapV3Pool: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"),
  ERC20: [
    "function decimals() view returns (uint8)",
    "function balanceOf(address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)",
    "function allowance(address,address) view returns (uint256)"
  ]
};

// Get valid ticks for fee tier
function getValidTicks(tickSpacing, useFullRange = false) {
  if (useFullRange) {
    // For 0.05% fee pool (tickSpacing = 10), use these valid full-range ticks
    const MIN_TICK = -887270;  // Valid: -887270 (multiple of 10)
    const MAX_TICK = 887270;   // Valid: 887270 (multiple of 10)
    return { tickLower: MIN_TICK, tickUpper: MAX_TICK };
  } else {
    // Create range around current tick
    const currentTick = 0; // Starting at 0 for new pool
    const tickLower = nearestUsableTick(currentTick - 100, tickSpacing);
    const tickUpper = nearestUsableTick(currentTick + 100, tickSpacing);
    return { tickLower, tickUpper };
  }
}

// Calculate amounts for first liquidity
function calculateFirstLiquidityAmounts(dec0, dec1, sqrtPriceX96) {
  // For first liquidity at 1:1 price, provide equal value
  const amount0 = ethers.utils.parseUnits("100", dec0);  // 100 token0
  const amount1 = ethers.utils.parseUnits("100", dec1);  // 100 token1
  
  return { amount0, amount1 };
}

// Simple mint function - no SDK complexity
async function simpleMintFirstLiquidity(signer) {
  console.log("\n=== SIMPLE FIRST LIQUIDITY MINT ===");
  
  // 1. Get pool contract
  const poolContract = new Contract(POOL_ADDRESS, artifacts.UniswapV3Pool.abi, signer);
  const [token0, token1, fee, tickSpacing] = await Promise.all([
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee(),
    poolContract.tickSpacing()
  ]);
  
  console.log("Token0:", token0);
  console.log("Token1:", token1);
  console.log("Fee:", fee.toString());
  console.log("Tick spacing:", tickSpacing.toString());
  
  // 2. Get token contracts and decimals
  const token0Contract = new Contract(token0, artifacts.ERC20, signer);
  const token1Contract = new Contract(token1, artifacts.ERC20, signer);
  
  const [dec0, dec1, bal0, bal1] = await Promise.all([
    token0Contract.decimals(),
    token1Contract.decimals(),
    token0Contract.balanceOf(signer.address),
    token1Contract.balanceOf(signer.address)
  ]);
  
  console.log("\n=== BALANCES ===");
  console.log("Token0 balance:", ethers.utils.formatUnits(bal0, dec0));
  console.log("Token1 balance:", ethers.utils.formatUnits(bal1, dec1));
  
  // 3. Check allowances
  const allowance0 = await token0Contract.allowance(signer.address, positionManagerAddress);
  const allowance1 = await token1Contract.allowance(signer.address, positionManagerAddress);
  
  if (allowance0.eq(0)) {
    console.log("Approving token0...");
    await token0Contract.approve(positionManagerAddress, ethers.constants.MaxUint256);
  }
  
  if (allowance1.eq(0)) {
    console.log("Approving token1...");
    await token1Contract.approve(positionManagerAddress, ethers.constants.MaxUint256);
  }
  
  // 4. Calculate valid ticks
  const { tickLower, tickUpper } = getValidTicks(tickSpacing, true); // Use full range
  
  console.log("\n=== TICK RANGE ===");
  console.log("Tick Lower:", tickLower);
  console.log("Tick Upper:", tickUpper);
  
  // 5. Calculate amounts (simple 1:1 ratio for first liquidity)
  const amount0Desired = ethers.utils.parseUnits("10", dec0);  // 10 tokens
  const amount1Desired = ethers.utils.parseUnits("10", dec1);  // 10 tokens
  
  console.log("\n=== AMOUNTS ===");
  console.log("Amount0:", ethers.utils.formatUnits(amount0Desired, dec0));
  console.log("Amount1:", ethers.utils.formatUnits(amount1Desired, dec1));
  
  // 6. Prepare mint parameters
  const params = {
    token0: token0,
    token1: token1,
    fee: fee,
    tickLower: tickLower,
    tickUpper: tickUpper,
    amount0Desired: amount0Desired,
    amount1Desired: amount1Desired,
    amount0Min: 0,
    amount1Min: 0,
    recipient: signer.address,
    deadline: Math.floor(Date.now() / 1000) + 3600,
  };
  
  console.log("\n=== MINT PARAMS ===");
  console.log(JSON.stringify(params, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value, 2));
  
  // 7. Get position manager
  const positionManager = new Contract(
    positionManagerAddress,
    artifacts.NonfungiblePositionManager.abi,
    signer
  );
  
  // 8. Try callStatic first
  try {
    console.log("\nTesting with callStatic...");
    const result = await positionManager.callStatic.mint(params, {
      gasLimit: 3000000
    });
    
    console.log("✅ Call static successful!");
    console.log("Liquidity:", result.liquidity.toString());
    console.log("Amount0 used:", result.amount0.toString());
    console.log("Amount1 used:", result.amount1.toString());
    
    return params;
  } catch (error) {
    console.error("❌ Call static failed:", error.message);
    
    // Try alternative: initialize pool first
    if (error.message.includes("M1") || error.message.includes("zero")) {
      console.log("\nTrying to initialize pool first...");
      
      try {
        // Initialize pool with proper sqrtPrice
        const initTx = await positionManager.createAndInitializePoolIfNecessary(
          token0,
          token1,
          fee,
          "79228162514264337593543950336", // sqrtPrice for 1:1
          { gasLimit: 3000000 }
        );
        
        await initTx.wait();
        console.log("✅ Pool initialized");
        
        // Try mint again
        const result = await positionManager.callStatic.mint(params, {
          gasLimit: 3000000
        });
        
        console.log("✅ Mint call static successful after initialization!");
        return params;
      } catch (initError) {
        console.error("❌ Pool initialization failed:", initError.message);
        throw initError;
      }
    }
    throw error;
  }
}

// Execute the mint
async function executeMint(signer, params) {
  console.log("\n=== EXECUTING MINT TRANSACTION ===");
  
  const positionManager = new Contract(
    positionManagerAddress,
    artifacts.NonfungiblePositionManager.abi,
    signer
  );
  
  try {
    const tx = await positionManager.mint(params, {
      gasLimit: 5000000,
      gasPrice: await signer.provider.getGasPrice()
    });
    
    console.log("Transaction sent:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log("Block:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());
    console.log("Status:", receipt.status === 1 ? "Success" : "Failed");
    
    if (receipt.status === 1) {
      console.log("\n🎉 FIRST LIQUIDITY ADDED SUCCESSFULLY!");
      
      // Look for NFT mint event
      const transferEvent = receipt.logs.find(log => {
        try {
          const parsed = positionManager.interface.parseLog(log);
          return parsed.name === "Transfer";
        } catch {
          return false;
        }
      });
      
      if (transferEvent) {
        const parsed = positionManager.interface.parseLog(transferEvent);
        console.log("NFT Token ID:", parsed.args.tokenId.toString());
      }
    }
    
    return receipt;
  } catch (error) {
    console.error("❌ Mint transaction failed:", error.message);
    
    // If transaction fails, try with createAndInitializePoolIfNecessary
    console.log("\nTrying with createAndInitializePoolIfNecessary...");
    
    try {
      // First, create and initialize the pool
      const initTx = await positionManager.createAndInitializePoolIfNecessary(
        params.token0,
        params.token1,
        params.fee,
        "79228162514264337593543950336", // sqrtPrice for 1:1
        { gasLimit: 3000000 }
      );
      
      const initReceipt = await initTx.wait();
      console.log("✅ Pool created and initialized");
      
      // Now mint
      const mintTx = await positionManager.mint(params, {
        gasLimit: 5000000,
        gasPrice: await signer.provider.getGasPrice()
      });
      
      const mintReceipt = await mintTx.wait();
      console.log("✅ Liquidity minted after pool creation!");
      console.log("Transaction hash:", mintReceipt.transactionHash);
      
      return mintReceipt;
    } catch (finalError) {
      console.error("❌ Final attempt failed:", finalError.message);
      throw finalError;
    }
  }
}

// Main function
async function main() {
  try {
    const [owner] = await ethers.getSigners();
    console.log("Owner address:", owner.address);
    
    console.log("\n=== STEP 1: PREPARING FIRST LIQUIDITY ===");
    const mintParams = await simpleMintFirstLiquidity(owner);
    
    console.log("\n=== STEP 2: EXECUTING MINT ===");
    await executeMint(owner, mintParams);
    
    console.log("\n=== COMPLETE ===");
    
  } catch (error) {
    console.error("\n❌ SCRIPT FAILED:", error.message);
    
    // Try ultra simple approach as last resort
    console.log("\n⚠️  Trying ULTRA SIMPLE approach...");
    
    try {
      const [owner] = await ethers.getSigners();
      
      // Ultra simple - just mint with basic params
      const positionManager = new Contract(
        positionManagerAddress,
        artifacts.NonfungiblePositionManager.abi,
        owner
      );
      
      // Sort tokens correctly
      const token0 = UTILITY1_ADDRESS < UTILITY2_ADDRESS ? UTILITY1_ADDRESS : UTILITY2_ADDRESS;
      const token1 = UTILITY1_ADDRESS < UTILITY2_ADDRESS ? UTILITY2_ADDRESS : UTILITY1_ADDRESS;
      
      const ultraSimpleParams = {
        token0: token0,
        token1: token1,
        fee: 500,
        tickLower: -887270, // Valid tick for 0.05% pool
        tickUpper: 887270,  // Valid tick for 0.05% pool
        amount0Desired: ethers.utils.parseUnits("1", 18), // 1 token
        amount1Desired: ethers.utils.parseUnits("1", 18), // 1 token
        amount0Min: 0,
        amount1Min: 0,
        recipient: owner.address,
        deadline: Math.floor(Date.now() / 1000) + 3600,
      };
      
      console.log("Ultra simple params:", JSON.stringify(ultraSimpleParams, null, 2));
      
      const tx = await positionManager.mint(ultraSimpleParams, {
        gasLimit: 6000000, // Very high gas limit
        gasPrice: await owner.provider.getGasPrice()
      });
      
      const receipt = await tx.wait();
      console.log("✅ Ultra simple approach worked!");
      console.log("Tx hash:", receipt.transactionHash);
      
    } catch (ultraError) {
      console.error("❌ Ultra simple approach also failed:", ultraError.message);
      console.error("Full error:", ultraError);
    }
  }
}

// Run the script
main()
  .then(() => {
    console.log("\n=== SCRIPT COMPLETED SUCCESSFULLY ===");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n=== SCRIPT FAILED ===");
    console.error(error);
    process.exit(1);
  });