// add-balanced-liquidity.js
const { ethers } = require("hardhat");
const { Contract } = require("ethers");
const { Pool, Position, nearestUsableTick } = require("@uniswap/v3-sdk");
const { Token } = require("@uniswap/sdk-core");

async function addBalancedLiquidity() {
  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);
  
  const POSITION_MANAGER = "0x06b96FF90F504A455a36CF7b2643dDFa0714812e";
  const POOL_ADDRESS = "0xd2e5C0519dc65d2Ac917d0E860C4D75e33A3D940";
  const TOKEN0 = "0x5ae55038733F4f5311a86D53aFd01c4f56Aa0c5E";
  const TOKEN1 = "0xFDD3Ed693f28Bf0Ae2b9f4c9e87bc05668362F21";
  
  // 1. Get current pool state
  const poolABI = [
    "function token0() view returns (address)",
    "function token1() view returns (address)",
    "function fee() view returns (uint24)",
    "function tickSpacing() view returns (int24)",
    "function liquidity() view returns (uint128)",
    "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
  ];
  
  const pool = new Contract(POOL_ADDRESS, poolABI, signer);
  const [token0, token1, fee, tickSpacing, liquidity, slot0] = await Promise.all([
    pool.token0(),
    pool.token1(),
    pool.fee(),
    pool.tickSpacing(),
    pool.liquidity(),
    pool.slot0()
  ]);
  
  console.log("\n=== CURRENT POOL STATE ===");
  console.log("Token0:", token0);
  console.log("Token1:", token1);
  console.log("Fee:", fee.toString());
  console.log("Current tick:", slot0.tick.toString());
  console.log("Current liquidity:", liquidity.toString());
  console.log("sqrtPriceX96:", slot0.sqrtPriceX96.toString());
  
  // 2. Get token info
  const erc20ABI = [
    "function decimals() view returns (uint8)",
    "function balanceOf(address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)"
  ];
  
  const token0Contract = new Contract(token0, erc20ABI, signer);
  const token1Contract = new Contract(token1, erc20ABI, signer);
  
  const [dec0, dec1, bal0, bal1] = await Promise.all([
    token0Contract.decimals(),
    token1Contract.decimals(),
    token0Contract.balanceOf(signer.address),
    token1Contract.balanceOf(signer.address)
  ]);
  
  console.log("\n=== YOUR BALANCES ===");
  console.log("Token0 balance:", ethers.utils.formatUnits(bal0, dec0));
  console.log("Token1 balance:", ethers.utils.formatUnits(bal1, dec1));
  
  // 3. Calculate a range that will use BOTH tokens
  // Current price is at tick 0, so we need a range where 0 is BETWEEN lower and upper
  const currentTick = slot0.tick;
  
  // Options for different ranges (all will use both tokens since currentTick is between bounds)
  const rangeOptions = [
    { name: "Narrow range (both tokens)", lower: -100, upper: 100 },
    { name: "Medium range (both tokens)", lower: -500, upper: 500 },
    { name: "Wide range (both tokens)", lower: -1000, upper: 1000 },
  ];
  
  // 4. For each range, calculate how much liquidity we can add with 1 token each
  for (const range of rangeOptions) {
    console.log(`\n=== TRYING: ${range.name} ===`);
    
    // Align ticks to tickSpacing
    const tickLower = nearestUsableTick(range.lower, tickSpacing);
    const tickUpper = nearestUsableTick(range.upper, tickSpacing);
    
    console.log(`Range: ${tickLower} to ${tickUpper}`);
    console.log(`Current tick ${currentTick} is between bounds: ${currentTick > tickLower && currentTick < tickUpper}`);
    
    // 5. Create SDK tokens and pool
    const sdkToken0 = new Token(11155111, token0, dec0, "TOKEN0");
    const sdkToken1 = new Token(11155111, token1, dec1, "TOKEN1");
    
    const sdkPool = new Pool(
      sdkToken0,
      sdkToken1,
      fee,
      slot0.sqrtPriceX96.toString(),
      liquidity.toString(),
      currentTick
    );
    
    // 6. Try different amounts to find what works
    const amountOptions = [
      { name: "Small", amount0: ethers.utils.parseUnits("0.1", dec0), amount1: ethers.utils.parseUnits("0.1", dec1) },
      { name: "Medium", amount0: ethers.utils.parseUnits("1", dec0), amount1: ethers.utils.parseUnits("1", dec1) },
      { name: "Large", amount0: ethers.utils.parseUnits("10", dec0), amount1: ethers.utils.parseUnits("10", dec1) },
    ];
    
    for (const amountOption of amountOptions) {
      console.log(`\nTesting with ${amountOption.name} amounts:`);
      console.log(`Amount0: ${ethers.utils.formatUnits(amountOption.amount0, dec0)}`);
      console.log(`Amount1: ${ethers.utils.formatUnits(amountOption.amount1, dec1)}`);
      
      try {
        // Create position from amounts
        const position = Position.fromAmounts({
          pool: sdkPool,
          tickLower,
          tickUpper,
          amount0: amountOption.amount0.toString(),
          amount1: amountOption.amount1.toString(),
          useFullPrecision: true,
        });
        
        const { amount0: calcAmount0, amount1: calcAmount1 } = position.mintAmounts;
        const positionLiquidity = position.liquidity;
        
        console.log(`Calculated liquidity: ${positionLiquidity.toString()}`);
        console.log(`Would use token0: ${ethers.utils.formatUnits(calcAmount0.toString(), dec0)}`);
        console.log(`Would use token1: ${ethers.utils.formatUnits(calcAmount1.toString(), dec1)}`);
        
        if (positionLiquidity.toString() !== "0") {
          // 7. Prepare mint parameters
          const positionManagerABI = [
            "function mint(tuple(address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)"
          ];
          
          const positionManager = new Contract(POSITION_MANAGER, positionManagerABI, signer);
          
          const mintParams = {
            token0: token0,
            token1: token1,
            fee: fee,
            tickLower: tickLower,
            tickUpper: tickUpper,
            amount0Desired: amountOption.amount0,
            amount1Desired: amountOption.amount1,
            amount0Min: 0,
            amount1Min: 0,
            recipient: signer.address,
            deadline: Math.floor(Date.now() / 1000) + 3600,
          };
          
          // Try callStatic
          try {
            const result = await positionManager.callStatic.mint(mintParams, {
              gasLimit: 2000000
            });
            
            console.log(`✅ Works! Would create liquidity: ${result.liquidity.toString()}`);
            console.log(`Would use: ${ethers.utils.formatUnits(result.amount0, dec0)} token0 and ${ethers.utils.formatUnits(result.amount1, dec1)} token1`);
            
            // Ask if we should execute
            console.log("\n📋 This configuration works! Add this liquidity?");
            console.log("To execute, uncomment the execution code in the script.");
            
            // To actually execute, uncomment:
            /*
            console.log("Executing mint...");
            const tx = await positionManager.mint(mintParams, {
              gasLimit: 3000000,
              gasPrice: await signer.provider.getGasPrice()
            });
            console.log("Tx sent:", tx.hash);
            const receipt = await tx.wait();
            console.log("✅ Liquidity added!");
            return; // Exit after successful execution
            */
            
          } catch (callStaticError) {
            console.log(`❌ Call static failed: ${callStaticError.message}`);
          }
        } else {
          console.log("❌ Calculated zero liquidity");
        }
        
      } catch (error) {
        console.log(`❌ SDK calculation error: ${error.message}`);
      }
    }
  }
  
  // 8. If nothing works with both tokens, try adding to existing position
  console.log("\n=== ADDING TO EXISTING POSITION ===");
  console.log("You have NFT Token ID: 1");
  console.log("You can add more liquidity to your existing position (0-100 range)");
  
  const addLiquidityParams = {
    tokenId: 1,
    amount0Desired: ethers.utils.parseUnits("0.1", dec0),
    amount1Desired: ethers.utils.parseUnits("0.1", dec1),
    amount0Min: 0,
    amount1Min: 0,
    deadline: Math.floor(Date.now() / 1000) + 3600,
  };
  
  console.log("\nTo add to existing position, use:");
  console.log(`
  const positionManager = new ethers.Contract(
    "${POSITION_MANAGER}",
    [
      "function increaseLiquidity((uint256 tokenId, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, uint256 deadline)) returns (uint128 liquidity, uint256 amount0, uint256 amount1)"
    ],
    signer
  );
  
  await positionManager.increaseLiquidity(${JSON.stringify(addLiquidityParams, null, 2)});
  `);
}

addBalancedLiquidity().catch(console.error);