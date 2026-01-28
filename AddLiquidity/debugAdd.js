/*************************************UPDATED LIQUIDITY SCRIPT WITH DEBUGGING*************************************/

const { ethers } = require("hardhat");
const { Contract } = require("ethers");
const { Pool, Position, nearestUsableTick } = require("@uniswap/v3-sdk");
const { Token } = require("@uniswap/sdk-core");
const JSBI = require("jsbi");
require("dotenv").config();

const positionManagerAddress = process.env.POSITION_MANAGER_ADDRESS;
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;
// Pool addresses
const UTILITY1_UTILITY2 = process.env.UTILITY1_UTILITY2;

// Token addresses 
const UTILITY1_ADDRESS = process.env.UTILITY1_ADDRESS;
const UTILITY2_ADDRESS = process.env.UTILITY2_ADDRESS;

console.table({
    POSITION_MANAGER_ADDRESS: positionManagerAddress,
    FACTORY_ADDRESS: FACTORY_ADDRESS,
    UTILITY1_UTILITY2: UTILITY1_UTILITY2,
    UTILITY1_ADDRESS: UTILITY1_ADDRESS,
    UTILITY2_ADDRESS: UTILITY2_ADDRESS
});

// Import necessary contract ABIs
const artifacts = {
    UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
    NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
    UniswapV3Pool: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"),
    utility: require("../artifacts/contracts/UT1.sol/Utility1.json"),
};

// Fetch pool data
async function getPoolData(poolContract) {
    try {
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
    } catch (error) {
        console.error("Error fetching pool data:", error.message);
        throw error;
    }
}

// Check token allowances
async function checkAllowances(signer, tokenAddress, spender) {
    try {
        const tokenContract = new Contract(tokenAddress, artifacts.utility.abi, signer);
        const allowance = await tokenContract.allowance(signer.address, spender);
        const balance = await tokenContract.balanceOf(signer.address);
        
        console.log(`Allowance for token ${tokenAddress}:`, allowance.toString());
        console.log(`Balance for token ${tokenAddress}:`, balance.toString());
        
        return { allowance, balance };
    } catch (error) {
        console.error(`Error checking allowances for ${tokenAddress}:`, error.message);
        throw error;
    }
}

// Approve tokens for a specific user
async function approveTokens(signer) {
    try {
        const utilityContract = new Contract(UTILITY1_ADDRESS, artifacts.utility.abi, signer);
        const utility2Contract = new Contract(UTILITY2_ADDRESS, artifacts.utility.abi, signer);

        console.log("\n=== Approving Tokens ===");
        console.log("Signer address:", signer.address);
        
        // Check initial allowances
        console.log("\nChecking initial allowances...");
        await checkAllowances(signer, UTILITY1_ADDRESS, positionManagerAddress);
        await checkAllowances(signer, UTILITY2_ADDRESS, positionManagerAddress);

        // Approve if needed
        const approveAmount = ethers.utils.parseUnits("1000", 18);
        
        console.log("\nApproving tokens...");
        const tx1 = await utilityContract.approve(positionManagerAddress, approveAmount);
        console.log("UTILITY1 approval transaction sent:", tx1.hash);
        await tx1.wait();
        console.log("UTILITY1 approval confirmed");
        
        const tx2 = await utility2Contract.approve(positionManagerAddress, approveAmount);
        console.log("UTILITY2 approval transaction sent:", tx2.hash);
        await tx2.wait();
        console.log("UTILITY2 approval confirmed");

        // Verify final allowances
        console.log("\nVerifying final allowances...");
        await checkAllowances(signer, UTILITY1_ADDRESS, positionManagerAddress);
        await checkAllowances(signer, UTILITY2_ADDRESS, positionManagerAddress);
        
    } catch (error) {
        console.error("Error in approveTokens:", error.message);
        throw error;
    }
}

// Simulate the mint transaction first
async function simulateMint(nonfungiblePositionManager, params, signer) {
    try {
        console.log("\n=== Simulating Mint Transaction ===");
        
        // Try to estimate gas first
        const gasEstimate = await nonfungiblePositionManager.connect(signer).estimateGas.mint(params);
        console.log("Estimated gas:", gasEstimate.toString());
        
        // Try to call static (simulate the transaction)
        const result = await nonfungiblePositionManager.connect(signer).callStatic.mint(params);
        console.log("Static call successful. Result:", result);
        
        return true;
    } catch (error) {
        console.error("Simulation failed:", error.message);
        
        // Try to decode common errors
        if (error.message.includes("insufficient allowance")) {
            console.error("ERROR: Insufficient token allowance");
        } else if (error.message.includes("insufficient balance")) {
            console.error("ERROR: Insufficient token balance");
        } else if (error.message.includes("tick out of range")) {
            console.error("ERROR: Tick range is invalid");
        } else if (error.message.includes("invalid pool")) {
            console.error("ERROR: Invalid pool parameters");
        } else if (error.message.includes("price slippage")) {
            console.error("ERROR: Price slippage check failed");
        }
        
        return false;
    }
}

// Add liquidity to a specific pool
async function addLiquidity(poolAddress, token0Address, token1Address, token0Symbol, token1Symbol, signer, provider) {
    try {
        console.log(`\n=== Adding Liquidity to ${token0Symbol}/${token1Symbol} Pool ===`);
        console.log("Pool address:", poolAddress);
        console.log("Token0:", token0Address, `(${token0Symbol})`);
        console.log("Token1:", token1Address, `(${token1Symbol})`);
        console.log("Signer:", signer.address);

        // Check if pool exists
        const poolContract = new Contract(poolAddress, artifacts.UniswapV3Pool.abi, provider);
        console.log("Checking pool existence...");
        
        try {
            const poolFee = await poolContract.fee();
            console.log("Pool fee:", poolFee.toString());
        } catch (error) {
            console.error("ERROR: Pool may not exist or is not a valid Uniswap V3 pool");
            return;
        }

        const poolData = await getPoolData(poolContract);
        console.log("Pool data fetched:");
        console.log("- Tick spacing:", poolData.tickSpacing.toString());
        console.log("- Fee:", poolData.fee.toString());
        console.log("- Liquidity:", poolData.liquidity.toString());
        console.log("- Current tick:", poolData.tick.toString());
        console.log("- SqrtPriceX96:", poolData.sqrtPriceX96.toString());

        // Create tokens
        const tokenA = new Token(11155111, token0Address, 18, token0Symbol, token0Symbol);
        const tokenB = new Token(11155111, token1Address, 18, token1Symbol, token1Symbol);

        // Determine token order
        const isToken0First = token0Address.toLowerCase() < token1Address.toLowerCase();
        const token0 = isToken0First ? tokenA : tokenB;
        const token1 = isToken0First ? tokenB : tokenA;
        
        console.log(`\nToken order (Uniswap requirement):`);
        console.log("- Token0:", token0.address, `(${token0.symbol})`);
        console.log("- Token1:", token1.address, `(${token1.symbol})`);

        // Create pool instance
        const pool = new Pool(
            token0,
            token1,
            poolData.fee,
            poolData.sqrtPriceX96,
            poolData.liquidity,
            poolData.tick
        );

        // Calculate tick range
        const tickSpacing = poolData.tickSpacing;
        let tickLower = nearestUsableTick(poolData.tick, tickSpacing) - tickSpacing * 2;
        let tickUpper = nearestUsableTick(poolData.tick, tickSpacing) + tickSpacing * 2;
        tickLower = Math.floor(tickLower / tickSpacing) * tickSpacing;
        tickUpper = Math.ceil(tickUpper / tickSpacing) * tickSpacing;
        
        console.log("\nCalculated position parameters:");
        console.log("- Tick lower:", tickLower);
        console.log("- Tick upper:", tickUpper);
        console.log("- Tick spacing:", tickSpacing.toString());
        console.log("- Current tick:", poolData.tick.toString());

        // Create position
        const positionLiquidity = ethers.utils.parseUnits("1000", 18);
        console.log("\nPosition liquidity:", positionLiquidity.toString());
        
        const position = new Position({
            pool,
            liquidity: JSBI.BigInt(positionLiquidity.toString()),
            tickLower,
            tickUpper,
        });

        const { amount0: amount0Desired, amount1: amount1Desired } = position.mintAmounts;
        
        console.log("\nRequired token amounts:");
        console.log("- Amount0 (Token0):", ethers.BigNumber.from(amount0Desired.toString()).toString());
        console.log("- Amount1 (Token1):", ethers.BigNumber.from(amount1Desired.toString()).toString());

        // Prepare mint parameters
        const params = {
            token0: token0.address,
            token1: token1.address,
            fee: poolData.fee,
            tickLower,
            tickUpper,
            amount0Desired: ethers.BigNumber.from(amount0Desired.toString()),
            amount1Desired: ethers.BigNumber.from(amount1Desired.toString()),
            amount0Min: 0,
            amount1Min: 0,
            recipient: signer.address,
            deadline: Math.floor(Date.now() / 1000) + 3600,
        };

        console.log("\nMint parameters:");
        console.log(JSON.stringify(params, (key, value) => 
            typeof value === 'bigint' ? value.toString() : value, 2));

        // Check token balances before proceeding
        console.log("\nChecking token balances...");
        const token0Contract = new Contract(token0.address, artifacts.utility.abi, signer);
        const token1Contract = new Contract(token1.address, artifacts.utility.abi, signer);
        
        const balance0 = await token0Contract.balanceOf(signer.address);
        const balance1 = await token1Contract.balanceOf(signer.address);
        
        console.log(`Balance ${token0.symbol}:`, balance0.toString());
        console.log(`Balance ${token1.symbol}:`, balance1.toString());
        
        if (balance0.lt(params.amount0Desired)) {
            console.error(`ERROR: Insufficient ${token0.symbol} balance. Required: ${params.amount0Desired.toString()}, Available: ${balance0.toString()}`);
            return;
        }
        
        if (balance1.lt(params.amount1Desired)) {
            console.error(`ERROR: Insufficient ${token1.symbol} balance. Required: ${params.amount1Desired.toString()}, Available: ${balance1.toString()}`);
            return;
        }

        // Initialize position manager
        const nonfungiblePositionManager = new Contract(
            positionManagerAddress,
            artifacts.NonfungiblePositionManager.abi,
            signer
        );

        // Simulate transaction first
        const simulationSuccess = await simulateMint(nonfungiblePositionManager, params, signer);
        if (!simulationSuccess) {
            console.error("Transaction simulation failed. Aborting real transaction.");
            return;
        }

        // Execute the transaction
        console.log("\nExecuting mint transaction...");
        const tx = await nonfungiblePositionManager.connect(signer).mint(params, { 
            gasLimit: 2000000 
        });
        
        console.log("Transaction sent:", tx.hash);
        
        const receipt = await tx.wait();
        console.log("Transaction confirmed in block:", receipt.blockNumber);
        console.log("Gas used:", receipt.gasUsed.toString());
        
        if (receipt.status === 1) {
            console.log(`✓ Successfully added liquidity to ${token0Symbol}/${token1Symbol} pool`);
            
            // Parse events if any
            if (receipt.events && receipt.events.length > 0) {
                console.log("\nTransaction events:");
                receipt.events.forEach((event, index) => {
                    console.log(`Event ${index}:`, event.event, event.args);
                });
            }
        } else {
            console.error("✗ Transaction failed with status 0");
        }

    } catch (error) {
        console.error("\n=== ERROR DETAILS ===");
        console.error("Error message:", error.message);
        
        // Extract revert reason if available
        if (error.reason) {
            console.error("Revert reason:", error.reason);
        }
        
        if (error.code) {
            console.error("Error code:", error.code);
        }
        
        if (error.transactionHash) {
            console.error("Transaction hash:", error.transactionHash);
        }
        
        // Check for specific common errors
        if (error.message.includes("TRANSFER_FROM_FAILED")) {
            console.error("ERROR: Token transfer failed. Check allowances.");
        } else if (error.message.includes("INSUFFICIENT_LIQUIDITY")) {
            console.error("ERROR: Insufficient liquidity in the pool.");
        } else if (error.message.includes("INVALID_TICK")) {
            console.error("ERROR: Invalid tick range specified.");
        } else if (error.message.includes("PRICE_SLIPPAGE_CHECK")) {
            console.error("ERROR: Price slippage check failed.");
        } else if (error.message.includes("allowance")) {
            console.error("ERROR: Token allowance issue detected.");
        } else if (error.message.includes("balance")) {
            console.error("ERROR: Token balance issue detected.");
        }
        
        // Log the transaction data for manual inspection
        if (error.transaction) {
            console.error("\nTransaction data for debugging:");
            console.error("Data:", error.transaction.data);
        }
        
        throw error;
    }
}

// Main function
async function main() {
    try {
        const [owner, signer] = await ethers.getSigners();
        const provider = ethers.provider;

        console.log("Starting liquidity addition process...");
        console.log("Network:", (await provider.getNetwork()).name);
        console.log("Chain ID:", (await provider.getNetwork()).chainId);
        console.log("Block number:", await provider.getBlockNumber());

        // Approve tokens
        await approveTokens(owner);

        // Add liquidity
        await addLiquidity(
            UTILITY1_UTILITY2, 
            UTILITY1_ADDRESS, 
            UTILITY2_ADDRESS, 
            "UTILITY1", 
            "UTILITY2", 
            owner, 
            provider
        );

        console.log("\n=== Process Complete ===");
        
    } catch (error) {
        console.error("\n=== FATAL ERROR ===");
        console.error("Process failed with error:", error.message);
        console.error("Stack trace:", error.stack);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });