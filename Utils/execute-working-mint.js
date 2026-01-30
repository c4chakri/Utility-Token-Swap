// execute-working-mint.js
const { ethers } = require("hardhat");

async function executeWorkingMint() {
  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);
  
  const POSITION_MANAGER = "0x06b96FF90F504A455a36CF7b2643dDFa0714812e";
  const TOKEN0 = "0x5ae55038733F4f5311a86D53aFd01c4f56Aa0c5E";
  const TOKEN1 = "0xFDD3Ed693f28Bf0Ae2b9f4c9e87bc05668362F21";
  
  // Check token approvals first
  const erc20ABI = [
    "function approve(address,uint256) returns (bool)",
    "function allowance(address,address) view returns (uint256)"
  ];
  
  const token0Contract = new ethers.Contract(TOKEN0, erc20ABI, signer);
  const token1Contract = new ethers.Contract(TOKEN1, erc20ABI, signer);
  
  const allowance0 = await token0Contract.allowance(signer.address, POSITION_MANAGER);
  const allowance1 = await token1Contract.allowance(signer.address, POSITION_MANAGER);
  
  console.log("\n=== APPROVAL CHECK ===");
  console.log("Token0 allowance:", allowance0.toString());
  console.log("Token1 allowance:", allowance1.toString());
  
  if (allowance0.eq(0)) {
    console.log("Approving token0...");
    await token0Contract.approve(POSITION_MANAGER, ethers.constants.MaxUint256);
  }
  
  if (allowance1.eq(0)) {
    console.log("Approving token1...");
    await token1Contract.approve(POSITION_MANAGER, ethers.constants.MaxUint256);
  }
  
  // Position Manager ABI
  const positionManagerABI = [
    "function mint(tuple(address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)"
  ];
  
  const positionManager = new ethers.Contract(POSITION_MANAGER, positionManagerABI, signer);
  
  // Use the exact parameters that worked in callStatic
  const mintParams = {
    token0: TOKEN0,
    token1: TOKEN1,
    fee: 500, // 0.05% fee tier
    tickLower: 0,    // Aligned tick (multiple of 10)
    tickUpper: 100,  // Aligned tick (multiple of 10)
    amount0Desired: ethers.utils.parseUnits("1.0", 18), // 1 token
    amount1Desired: ethers.utils.parseUnits("1.0", 18), // 1 token
    amount0Min: 0,
    amount1Min: 0,
    recipient: signer.address,
    deadline: Math.floor(Date.now() / 1000) + 3600,
  };
  
  console.log("\n=== EXECUTING WORKING MINT ===");
  console.log("Params:", JSON.stringify(mintParams, null, 2));
  
  try {
    // First verify with callStatic again
    console.log("\n1. Verifying with callStatic...");
    const callResult = await positionManager.callStatic.mint(mintParams, {
      gasLimit: 2000000
    });
    
    console.log("✅ Call static successful!");
    console.log("Expected liquidity:", callResult.liquidity.toString());
    console.log("Expected amount0 used:", callResult.amount0.toString());
    console.log("Expected amount1 used:", callResult.amount1.toString());
    
    // Execute the actual mint
    console.log("\n2. Executing mint transaction...");
    const tx = await positionManager.mint(mintParams, {
      gasLimit: 3000000,
      gasPrice: await signer.provider.getGasPrice()
    });
    
    console.log("Transaction sent:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("\n✅ TRANSACTION CONFIRMED!");
    console.log("Block:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());
    console.log("Status:", receipt.status === 1 ? "SUCCESS" : "FAILED");
    
    if (receipt.status === 1) {
      console.log("\n🎉 FIRST LIQUIDITY ADDED SUCCESSFULLY!");
      
      // Check for events
      console.log("\n=== TRANSACTION EVENTS ===");
      console.log("Total logs:", receipt.logs.length);
      
      // Parse events if any
      if (receipt.logs.length > 0) {
        const iface = new ethers.utils.Interface([
          "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
          "event IncreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
          "event Mint(address sender, address indexed owner, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount, uint256 amount0, uint256 amount1)"
        ]);
        
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog(log);
            console.log(`Event: ${parsed.name}`);
            console.log("  Args:", parsed.args);
          } catch {
            // Not our event
          }
        }
      }
      
      // Now try adding more liquidity with different ranges
      console.log("\n=== NEXT: TRYING ADDITIONAL LIQUIDITY RANGES ===");
      await tryAdditionalRanges(signer, positionManager);
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    
    // If this specific mint fails, try with even smaller amounts
    console.log("\n⚠️  Trying with even smaller amounts...");
    
    const smallerParams = {
      ...mintParams,
      amount0Desired: ethers.utils.parseUnits("0.0001", 18), // 0.0001 tokens
      amount1Desired: ethers.utils.parseUnits("0.0001", 18), // 0.0001 tokens
    };
    
    try {
      const tx = await positionManager.mint(smallerParams, {
        gasLimit: 3000000,
        gasPrice: await signer.provider.getGasPrice()
      });
      
      const receipt = await tx.wait();
      console.log("✅ Success with smaller amounts!");
      console.log("Tx hash:", receipt.transactionHash);
    } catch (smallerError) {
      console.error("❌ Even smaller amounts failed:", smallerError.message);
    }
  }
}

async function tryAdditionalRanges(signer, positionManager) {
  console.log("\n=== TRYING ADDITIONAL RANGES ===");
  
  const rangesToTry = [
    { name: "Wider range around current", lower: -100, upper: 100 },
    { name: "Asymmetric range", lower: -50, upper: 150 },
    { name: "Very narrow range", lower: -10, upper: 10 },
  ];
  
  for (const range of rangesToTry) {
    console.log(`\nTrying: ${range.name} (${range.lower} to ${range.upper})`);
    
    const params = {
      token0: "0x5ae55038733F4f5311a86D53aFd01c4f56Aa0c5E",
      token1: "0xFDD3Ed693f28Bf0Ae2b9f4c9e87bc05668362F21",
      fee: 500,
      tickLower: range.lower,
      tickUpper: range.upper,
      amount0Desired: ethers.utils.parseUnits("0.01", 18), // 0.01 tokens
      amount1Desired: ethers.utils.parseUnits("0.01", 18), // 0.01 tokens
      amount0Min: 0,
      amount1Min: 0,
      recipient: signer.address,
      deadline: Math.floor(Date.now() / 1000) + 3600,
    };
    
    try {
      // Align ticks to multiples of 10
      params.tickLower = Math.floor(params.tickLower / 10) * 10;
      params.tickUpper = Math.ceil(params.tickUpper / 10) * 10;
      
      console.log(`Aligned ticks: ${params.tickLower} to ${params.tickUpper}`);
      
      const result = await positionManager.callStatic.mint(params, { gasLimit: 2000000 });
      console.log(`✅ Works! Liquidity: ${result.liquidity.toString()}`);
      
      // Optionally execute
      // const tx = await positionManager.mint(params, { gasLimit: 3000000 });
      // await tx.wait();
      // console.log("Executed!");
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
}

executeWorkingMint().catch(console.error);