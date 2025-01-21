require("dotenv").config();
const { ethers } = require("hardhat");
// const TETHER_ADDRESS = process.env.NEXT_PUBLIC_TETHER_ADDRESS;
// const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS;


const NEXT_PUBLIC_UT1 = process.env.NEXT_PUBLIC_UT1;
const NEXT_PUBLIC_UT2 = process.env.NEXT_PUBLIC_UT2;

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS;
const POSITION_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS;

const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
};

const { Contract, BigNumber } = require("ethers");
const BN = require("bignumber.js");
const { promisify } = require("util");
const fs = require("fs");
// const ethers = require("ethers");

BN.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });

const provider = ethers.provider;

function encodePriceSqrt(reserve1, reserve0) {
  return BigNumber.from(
    new BN(reserve1.toString())
      .div(reserve0.toString())
      .sqrt()
      .multipliedBy(new BN(2).pow(96))
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
  const [owner] = await ethers.getSigners();

  // Ensure token0 < token1
  if (token0 > token1) {
    [token0, token1] = [token1, token0];
  }

  console.log("Deploying pool with parameters:");
  console.log("Token0:", token0);
  console.log("Token1:", token1);
  console.log("Fee:", fee);
  console.log("Price:", price.toString());

  // Check if pool already exists
  const poolAddress = await factory.getPool(token0, token1, fee);
  if (poolAddress !== ethers.constants.AddressZero) {
    console.error("Pool already exists at:", poolAddress);
    return poolAddress;
  }

  try {
    const tx = await nonfungiblePositionManager
      .connect(owner)
      .createAndInitializePoolIfNecessary(token0, token1, fee, price, {
        gasLimit: 8000000, // Increased gas limit
      });
    await tx.wait();

    const newPoolAddress = await factory.getPool(token0, token1, fee);
    console.log("Pool deployed at:", newPoolAddress);
    return newPoolAddress;
  } catch (error) {
    console.error("Error deploying pool:", error.message || error);
    throw error;
  }
}

async function main() {
  try {
    // const usdtUsdc500 = await deployPool(
    //   TETHER_ADDRESS,
    //   USDC_ADDRESS,
    //   500, // Pool fee tier
    //   encodePriceSqrt(1, 1) // Initial price
    // );

    const UT_POOL = await deployPool(
      NEXT_PUBLIC_UT1,
      NEXT_PUBLIC_UT2,
      500, // Pool fee tier
      encodePriceSqrt(1, 1) // Initial price
    );

    const addresses = [
      `NEXT_PUBLIC_UT_POOL=${UT_POOL}`
    ];

    const data = "\n" + addresses.join("\n");
    const writeFile = promisify(fs.appendFile);
    const filePath = ".env";

    await writeFile(filePath, data);
    console.log("Addresses recorded.",addresses);
  } catch (error) {
    console.error("Error in main function:", error.message || error);
    throw error;
  }
}




/*
  Run the script using:
  npx hardhat run --network localhost Utils/03_deployPools.js
*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
    
  });
