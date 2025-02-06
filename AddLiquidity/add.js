/*************************************UPDATED LIQUIDITY SCRIPT*************************************/

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
// Import necessary contract ABIs
const artifacts = {
    UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
    NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
    UniswapV3Pool: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"),
    utility: require("../artifacts/contracts/UT1.sol/Utility1.json"),
};

// Fetch pool data
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

// Approve tokens for a specific user
async function approveTokens(signer) {
    const utilityContract = new Contract(UTILITY1_ADDRESS, artifacts.utility.abi, signer);
    const utility2Contract = new Contract(UTILITY2_ADDRESS, artifacts.utility.abi, signer);

    await utilityContract.approve(positionManagerAddress, ethers.utils.parseUnits("1000", 18));
    await utility2Contract.approve(positionManagerAddress, ethers.utils.parseUnits("1000", 18));

    await utility2Contract.connect(signer).approve(positionManagerAddress, ethers.utils.parseUnits("1000", 18));
    await utilityContract.connect(signer).approve(positionManagerAddress, ethers.utils.parseUnits("1000", 18));

    const provider = ethers.provider;
    const factory = new Contract(
        FACTORY_ADDRESS,
        artifacts.UniswapV3Factory.abi,
        provider
    );


   


}

// Add liquidity to a specific pool
async function addLiquidity(poolAddress, token0Address, token1Address, token0Symbol, token1Symbol, signer, provider) {
    try {

        const poolContract = new Contract(poolAddress, artifacts.UniswapV3Pool.abi, provider);
        const poolData = await getPoolData(poolContract);

        const tokenA = new Token(11155111, token0Address, 18, token0Symbol, token0Symbol);
        const tokenB = new Token(11155111, token1Address, 18, token1Symbol, token1Symbol);

        const token0 = token0Address.toLowerCase() < token1Address.toLowerCase() ? tokenA : tokenB;
        const token1 = token0Address.toLowerCase() < token1Address.toLowerCase() ? tokenB : tokenA;

        const pool = new Pool(
            token0,
            token1,
            poolData.fee,
            poolData.sqrtPriceX96,
            poolData.liquidity,
            poolData.tick
        );
        const tickSpacing = await poolContract.tickSpacing();
        let tickLower = nearestUsableTick(poolData.tick, poolData.tickSpacing) - poolData.tickSpacing * 2;
        let tickUpper = nearestUsableTick(poolData.tick, poolData.tickSpacing) + poolData.tickSpacing * 2;
        tickLower = Math.floor(tickLower / tickSpacing) * tickSpacing;
        tickUpper = Math.ceil(tickUpper / tickSpacing) * tickSpacing;
        const position = new Position({
            pool,
            liquidity: JSBI.BigInt(ethers.utils.parseUnits("1000", 18).toString()),
            tickLower,
            tickUpper,
        });

        const { amount0: amount0Desired, amount1: amount1Desired } = position.mintAmounts;

        const params = {
            token0: token0Address,
            token1: token1Address,
            fee: poolData.fee,
            tickLower,
            tickUpper,
            amount0Desired: ethers.BigNumber.from(amount0Desired.toString()), // Convert to BigNumber
            amount1Desired: ethers.BigNumber.from(amount1Desired.toString()), // Convert to BigNumber
            amount0Min: 0,
            amount1Min: 0,
            recipient: signer.address,
            deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        };


        const nonfungiblePositionManager = new Contract(
            positionManagerAddress,
            artifacts.NonfungiblePositionManager.abi,
            signer
        );

        try {
            console.log("Adding liquidity...");
            
            const tx = await nonfungiblePositionManager.connect(signer).mint(params, { gasLimit: 2000000 });
            await tx.wait();
            console.log(`Added liquidity to ${token0Symbol}/${token1Symbol} pool at ${poolAddress}`);

        } catch (error) {
            console.error("Transaction Reverted:",error, error.reason || error);
        }

    } catch (error) {
        console.log("Error adding liquidity:", error.message || error);

    }

}

// Main function
async function main() {
    const [owner, signer] = await ethers.getSigners();
    const provider = ethers.provider;

    // Approve tokens
    await approveTokens(signer);

    
  await addLiquidity(UTILITY1_UTILITY2, UTILITY2_ADDRESS, UTILITY1_ADDRESS, "UTILITY1", "UTILITY2", signer, provider);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

/*
npx hardhat run --network localhost Utils/add.js
*/

