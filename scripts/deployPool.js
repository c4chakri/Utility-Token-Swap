require("dotenv").config();
const { Contract, BigNumber } = require("ethers");
const ethers = require("ethers");
const bn = require("bignumber.js");
const fs = require("fs/promises");

bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });


const UTILITY1_ADDRESS = process.env.NEXT_PUBLIC_UTILITY1_ADDRESS;
const UTILITY2_ADDRESS = process.env.NEXT_PUBLIC_UTILITY2_ADDRESS;
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS;
const SWAP_ROUTER_ADDRESS = process.env.NEXT_PUBLIC_SWAP_ROUTER_ADDRESS;
const NFT_DESCRIPTOR_ADDRESS = process.env.NEXT_PUBLIC_NFT_DESCRIPTOR_ADDRESS;
const POSITION_DESCRIPTOR_ADDRESS = process.env.NEXT_PUBLIC_POSITION_DESCRIPTOR_ADDRESS;
const POSITION_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS;

const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
};

const hardhatURL = "http://localhost:8545";
const provider = new ethers.providers.JsonRpcProvider(hardhatURL);
const signer = provider.getSigner();

function encodePriceSqrt(reserve1, reserve0) {
  return BigNumber.from(
    new bn(reserve1.toString())
      .div(reserve0.toString())
      .sqrt()
      .multipliedBy(new bn(2).pow(96))
      .integerValue(3)
      .toString()
  );
}

const nonfungiblePositionManager = new Contract(
  POSITION_MANAGER_ADDRESS,
  artifacts.NonfungiblePositionManager.abi,
  provider
);

const factory = new Contract(
  FACTORY_ADDRESS,
  artifacts.UniswapV3Factory.abi,
  provider
);

async function deployPool(token0, token1, fee, price) {
  if (token0 > token1) {
    [token0, token1] = [token1, token0];
  }

  const poolAddress = await factory.getPool(token0, token1, fee);
  if (poolAddress && poolAddress !== ethers.constants.AddressZero) {
    console.log("Pool already exists at:", poolAddress);
    return poolAddress; // Don't proceed with creation
  }
  if (poolAddress !== ethers.constants.AddressZero) {
    console.log("Pool already exists at:", poolAddress);
    return poolAddress;
  }

  try {
    const tx = await nonfungiblePositionManager
      .connect(signer)
      .createAndInitializePoolIfNecessary(token0, token1, fee, price, {
        gasLimit: 8000000,
      });
    await tx.wait();

    const newPoolAddress = await factory.getPool(token0, token1, fee);

    return newPoolAddress;
  } catch (error) {
    console.error("Error deploying pool:", error.message || error);
    throw error;
  }
}

async function main() {
  try {
    // Deploy USDT/USDC pair with 0.05% fee and 1:1 price ratio
    // const usdtUsdc = await deployPool(
    //   TETHER_ADDRESS,
    //   USDC_ADDRESS,
    //   500,  // 0.05% fee
    //   encodePriceSqrt(1, 1)
    // );
  
    // // Deploy USDT/UTILITY1 pair with 0.3% fee and 2:1 price ratio
    // const usdtUtility1 = await deployPool(
    //   TETHER_ADDRESS,
    //   UTILITY1_ADDRESS,
    //   3000, // 0.3% fee
    //   encodePriceSqrt(2, 1) // USDT is worth 2x of UTILITY1
    // );
  
    // Deploy UTILITY1/UTILITY2 pair with 1% fee and 1:3 price ratio
    const utility1Utility2 = await deployPool(
      UTILITY1_ADDRESS,
      UTILITY2_ADDRESS,
      10000, // 1% fee
      encodePriceSqrt(1, 3) // UTILITY1 is worth 1/3 of UTILITY2
    );
  
    // // Deploy USDT/WBTC pair with 0.3% fee and 1:50 price ratio
    // const usdtWbtc = await deployPool(
    //   TETHER_ADDRESS,
    //   WRAPPED_BITCOIN_ADDRESS,
    //   3000,
    //   encodePriceSqrt(1, 50) // 1 WBTC = 50 USDT
    // );
  
    // // Deploy USDT/SOL pair with 0.05% fee and 1:120 price ratio
    // const usdtSol = await deployPool(
    //   TETHER_ADDRESS,
    //   SOL_ADDRESS,
    //   500,
    //   encodePriceSqrt(1, 120) // 1 SOL = 120 USDT
    // );
  
    // // Deploy USDC/SOS pair with 0.3% fee and 1:10000 price ratio
    // const usdcSos = await deployPool(
    //   USDC_ADDRESS,
    //   SOS_ADDRESS,
    //   3000,
    //   encodePriceSqrt(1, 10000) // 1 USDC = 10,000 SOS
    // );
  
    // // Deploy SOL/SOS pair with 1% fee and 1:5000 price ratio
    // const solSos = await deployPool(
    //   SOL_ADDRESS,
    //   SOS_ADDRESS,
    //   10000,
    //   encodePriceSqrt(1, 5000) // 1 SOL = 5,000 SOS
    // );
  
    // Record addresses to the .env file
    const addresses = [
      // `NEXT_PUBLIC_USDT_USDC=${usdtUsdc}`,
      // `NEXT_PUBLIC_USDT_SOL=${usdtSol}`,
      // `NEXT_PUBLIC_USDC_SOS=${usdcSos}`,
      // `NEXT_PUBLIC_SOL_SOS=${solSos}`,
      // `NEXT_PUBLIC_USDT_UTILITY1=${usdtUtility1}`,
      // `NEXT_PUBLIC_USDT_WBTC=${usdtWbtc}`,
      `NEXT_PUBLIC_UTILITY1_UTILITY2=${utility1Utility2}`
    ];
  
    await fs.appendFile(".env", `\n${addresses.join("\n")}\n`);
    console.log("Pool addresses successfully recorded.");
    console.table({
      // USDT_USDC: usdtUsdc,
      // USDT_SOL: usdtSol,
      // USDC_SOS: usdcSos,
      // SOL_SOS: solSos,
      // USDT_UTILITY1: usdtUtility1,
      // USDT_WBTC: usdtWbtc,
      UTILITY1_UTILITY2: utility1Utility2
    });
  
  } catch (error) {
    console.error("Error in main function:", error.reason || error.message || error);
    throw error;
  }
  
}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

/*
npx hardhat run --network localhost scripts/deployPool.js
*/