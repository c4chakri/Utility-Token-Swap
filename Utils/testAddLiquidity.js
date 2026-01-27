/*************************************
 * UNISWAP V3 - FIRST LIQUIDITY ADDITION
 *************************************/

const { ethers } = require("hardhat");
const { Contract } = require("ethers");
const { Pool, Position, nearestUsableTick } = require("@uniswap/v3-sdk");
const { Token } = require("@uniswap/sdk-core");
const JSBI = require("jsbi");
require("dotenv").config();

/* ================= ENV ================= */
const POSITION_MANAGER = "0x06b96FF90F504A455a36CF7b2643dDFa0714812e";
const POOL_ADDRESS = "0xd2e5C0519dc65d2Ac917d0E860C4D75e33A3D940";

/* ================= MAIN FUNCTION ================= */
async function addFirstLiquidity() {
  const [signer] = await ethers.getSigners();
  const provider = ethers.provider;

  console.log("LP Signer:", signer.address);

  // 1. Get pool contract
  const PoolABI = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json").abi;
  const pool = new Contract(POOL_ADDRESS, PoolABI, provider);

  const [token0, token1, fee, liquidity, slot0, tickSpacing] =
    await Promise.all([
      pool.token0(),
      pool.token1(),
      pool.fee(),
      pool.liquidity(),
      pool.slot0(),
      pool.tickSpacing(),
    ]);

  console.log("\n=== POOL STATE ===");
  console.log("token0:", token0);
  console.log("token1:", token1);
  console.log("fee:", fee.toString());
  console.log("currentTick:", slot0.tick.toString());
  console.log("tickSpacing:", tickSpacing.toString());
  console.log("sqrtPriceX96:", slot0.sqrtPriceX96.toString());
  console.log("Current liquidity:", liquidity.toString());

  // 2. Get tokens
  const ERC20ABI = [
    "function decimals() view returns (uint8)", 
    "function balanceOf(address) view returns (uint256)", 
    "function approve(address,uint256) returns (bool)"
  ];
  
  const token0Contract = new Contract(token0, ERC20ABI, signer);
  const token1Contract = new Contract(token1, ERC20ABI, signer);

  const [dec0, dec1, bal0, bal1] = await Promise.all([
    token0Contract.decimals(),
    token1Contract.decimals(),
    token0Contract.balanceOf(signer.address),
    token1Contract.balanceOf(signer.address),
  ]);

  console.log("\n=== TOKEN BALANCES ===");
  console.log(`Token0 balance: ${ethers.utils.formatUnits(bal0, dec0)}`);
  console.log(`Token1 balance: ${ethers.utils.formatUnits(bal1, dec1)}`);

  // 3. Approve
  console.log("\n=== APPROVALS ===");
  await token0Contract.approve(POSITION_MANAGER, ethers.constants.MaxUint256);
  await token1Contract.approve(POSITION_MANAGER, ethers.constants.MaxUint256);
  console.log("✅ Approved");

  // 4. Check if pool is initialized (has liquidity)
  if (liquidity.toString() === "0") {
    console.log("\n⚠️  Pool has ZERO liquidity - this is the first position!");
    console.log("You need to initialize the pool with your first liquidity.");
    
    // For first liquidity, we need to create a position that covers a wide price range
    const currentTick = slot0.tick; // Should be 0 for new pool
    const MIN_TICK = -887272;
    const MAX_TICK = 887272;
    
    // For first liquidity, use a very wide range or full range
    const tickLower = currentTick - 10000;  // Very wide range for first liquidity
    const tickUpper = currentTick + 10000;
    
    // Or use full range for simplicity
    // const tickLower = MIN_TICK;
    // const tickUpper = MAX_TICK;
    
    console.log("\n=== FIRST LIQUIDITY PARAMETERS ===");
    console.log("Using tick range:", tickLower, "to", tickUpper);
    
    // 5. For first liquidity, we need to provide both tokens in a ratio
    // Since price is 1:1 (sqrtPriceX96 = 2^96), provide equal amounts
    const amount0 = ethers.utils.parseUnits("100", dec0);  // 100 token0
    const amount1 = ethers.utils.parseUnits("100", dec1);  // 100 token1
    
    console.log("Amount0 to deposit:", ethers.utils.formatUnits(amount0, dec0));
    console.log("Amount1 to deposit:", ethers.utils.formatUnits(amount1, dec1));
    
    // 6. Create SDK tokens (sorted properly)
    const sdkToken0 = new Token(11155111, token0, dec0);
    const sdkToken1 = new Token(11155111, token1, dec1);
    
    // 7. Create a mock pool for SDK calculations
    // For first liquidity, we need to handle this specially
    const sqrtPriceX96 = slot0.sqrtPriceX96.toString();
    
    // Create position manually since pool has no liquidity
    const position = new Position({
      pool: new Pool(sdkToken0, sdkToken1, fee, sqrtPriceX96, "0", currentTick),
      liquidity: calculateLiquidityForAmounts(
        tickLower,
        tickUpper,
        currentTick,
        sqrtPriceX96,
        amount0.toString(),
        amount1.toString(),
        dec0,
        dec1
      ),
      tickLower,
      tickUpper
    });
    
    console.log("\n=== POSITION CALCULATION ===");
    console.log("Liquidity amount:", position.liquidity.toString());
    
    if (position.liquidity.toString() === "0") {
      console.log("⚠️  Calculated zero liquidity. Using minimal liquidity...");
      // Use a minimal liquidity amount
      const minLiquidity = JSBI.BigInt("1000");
      
      const position2 = new Position({
        pool: new Pool(sdkToken0, sdkToken1, fee, sqrtPriceX96, "0", currentTick),
        liquidity: minLiquidity,
        tickLower,
        tickUpper
      });
      
      console.log("Mint amounts for min liquidity:", position2.mintAmounts);
      
      // 8. Prepare mint parameters
      const PositionManagerABI = require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json").abi;
      const manager = new Contract(POSITION_MANAGER, PositionManagerABI, signer);

      const mintParams = {
        token0: token0,
        token1: token1,
        fee: fee,
        tickLower: tickLower,
        tickUpper: tickUpper,
        amount0Desired: amount0.toString(),
        amount1Desired: amount1.toString(),
        amount0Min: 0,
        amount1Min: 0,
        recipient: signer.address,
        deadline: Math.floor(Date.now() / 1000) + 3600,
      };

      console.log("\n=== MINT PARAMS ===");
      console.log("amount0Desired:", mintParams.amount0Desired);
      console.log("amount1Desired:", mintParams.amount1Desired);
      console.log("tickLower:", mintParams.tickLower);
      console.log("tickUpper:", mintParams.tickUpper);

      // 9. Try callStatic
      try {
        console.log("\n⚠️  Trying to initialize pool with first liquidity...");
        const result = await manager.callStatic.mint(mintParams, {gasLimit: 1000000});
        console.log("✅ Call static successful!");
        console.log("TokenId:", result.tokenId.toString());
        console.log("Liquidity:", result.liquidity.toString());
        console.log("Amount0:", result.amount0.toString());
        console.log("Amount1:", result.amount1.toString());
        
        // 10. Execute
        console.log("\n=== EXECUTING MINT ===");
        const tx = await manager.mint(mintParams, {
          gasLimit: 1500000,
          gasPrice: await provider.getGasPrice(),
        });
        
        console.log("⏳ Waiting for transaction...");
        const receipt = await tx.wait();
        console.log("✅ First liquidity added!");
        console.log("Transaction hash:", receipt.transactionHash);
        
      } catch (err) {
        console.error("❌ Error:", err.message);
        
        // Try alternative: Use even wider range
        if (err.message.includes("M1")) {
          console.log("\nTrying with FULL RANGE...");
          
          const fullRangeParams = {
            token0: token0,
            token1: token1,
            fee: fee,
            tickLower: MIN_TICK,
            tickUpper: MAX_TICK,
            amount0Desired: amount0.toString(),
            amount1Desired: amount1.toString(),
            amount0Min: 0,
            amount1Min: 0,
            recipient: signer.address,
            deadline: Math.floor(Date.now() / 1000) + 3600,
          };
          
          try {
            const tx = await manager.mint(fullRangeParams, {
              gasLimit: 2000000,
              gasPrice: await provider.getGasPrice(),
            });
            const receipt = await tx.wait();
            console.log("✅ First liquidity added with full range!");
            console.log("Transaction hash:", receipt.transactionHash);
          } catch (err2) {
            console.error("❌ Still failing:", err2.message);
            
            // Last resort: Try with different amounts
            console.log("\nTrying with different ratio...");
            const altParams = {
              ...fullRangeParams,
              amount0Desired: ethers.utils.parseUnits("1000", dec0).toString(),
              amount1Desired: ethers.utils.parseUnits("1000", dec1).toString(),
            };
            
            try {
              const tx = await manager.mint(altParams, {
                gasLimit: 2000000,
                gasPrice: await provider.getGasPrice(),
              });
              const receipt = await tx.wait();
              console.log("✅ First liquidity added with larger amounts!");
              console.log("Transaction hash:", receipt.transactionHash);
            } catch (err3) {
              console.error("❌ Final error:", err3.message);
            }
          }
        }
      }
    }
  } else {
    console.log("Pool already has liquidity. Use normal add liquidity flow.");
  }
}

/* ================= HELPER FUNCTIONS ================= */

function calculateLiquidityForAmounts(
  tickLower,
  tickUpper,
  currentTick,
  sqrtPriceX96,
  amount0,
  amount1,
  dec0,
  dec1
) {
  // Simplified calculation for first liquidity
  // For a wide range around current price, both tokens will be used
  const sqrtRatio = JSBI.BigInt(sqrtPriceX96);
  const sqrtRatioA = JSBI.BigInt(Math.floor(Math.sqrt(1.0001 ** tickLower) * 2 ** 96));
  const sqrtRatioB = JSBI.BigInt(Math.floor(Math.sqrt(1.0001 ** tickUpper) * 2 ** 96));
  
  // Use the smaller liquidity calculation
  let liquidity;
  if (currentTick < tickLower) {
    // Only token0 needed
    liquidity = JSBI.divide(
      JSBI.multiply(JSBI.BigInt(amount0), sqrtRatioA, sqrtRatioB),
      JSBI.subtract(sqrtRatioB, sqrtRatioA)
    );
  } else if (currentTick < tickUpper) {
    // Both tokens needed
    const liquidity0 = JSBI.divide(
      JSBI.multiply(JSBI.BigInt(amount0), sqrtRatio, sqrtRatioB),
      JSBI.subtract(sqrtRatioB, sqrtRatio)
    );
    const liquidity1 = JSBI.divide(
      JSBI.BigInt(amount1),
      JSBI.subtract(sqrtRatio, sqrtRatioA)
    );
    liquidity = JSBI.lessThan(liquidity0, liquidity1) ? liquidity0 : liquidity1;
  } else {
    // Only token1 needed
    liquidity = JSBI.divide(
      JSBI.BigInt(amount1),
      JSBI.subtract(sqrtRatioB, sqrtRatioA)
    );
  }
  
  return liquidity;
}

/* ================= RUN ================= */
addFirstLiquidity()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });