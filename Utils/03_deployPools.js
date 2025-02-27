require("dotenv").config();
const { Contract, BigNumber } = require("ethers");
const ethers = require("ethers");
const bn = require("bignumber.js");
const fs = require("fs/promises");

bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });

const TETHER_ADDRESS = process.env.NEXT_PUBLIC_TETHER_ADDRESS;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS;
const SOL_ADDRESS = process.env.NEXT_PUBLIC_SCHOOL_OF_LAW_ADDRESS;
const SOS_ADDRESS = process.env.NEXT_PUBLIC_SCHOOL_OF_SCIENCE_ADDRESS;

const WRAPPED_BITCOIN_ADDRESS = process.env.NEXT_PUBLIC_WRAPPED_BITCOIN_ADDRESS;
const WETH_ADDRESS = process.env.NEXT_PUBLIC_WETH_ADDRESS;
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
    console.log(
      "Pool deployed for token0:",
      token0,
      "and token1:",
      token1,
      "at:",
      newPoolAddress
    );
    return newPoolAddress;
  } catch (error) {
    console.error("Error deploying pool:", error.message || error);
    throw error;
  }
}

async function main() {
  try {
    // Deploy USDT/USDC pair
    const usdtUsdc = await deployPool(
      TETHER_ADDRESS,
      USDC_ADDRESS,
      500,
      encodePriceSqrt(1, 1) // Customize the ratio if necessary
    );

    // Deploy USDT/SOL pair
    const usdtSol = await deployPool(
      TETHER_ADDRESS,
      SOL_ADDRESS,
      500,
      encodePriceSqrt(1, 1)
    );

    // Deploy USDC/SOS pair
    const usdcSos = await deployPool(
      USDC_ADDRESS,
      SOS_ADDRESS,
      500,
      encodePriceSqrt(1, 1)
    );

    // Deploy SOL/SOS pair
    const solSos = await deployPool(
      SOL_ADDRESS,
      SOS_ADDRESS,
      500,
      encodePriceSqrt(1, 1)
    );

    // Record addresses to the .env file
    const addresses = [
      `NEXT_PUBLIC_USDT_USDC=${usdtUsdc}`,
      `NEXT_PUBLIC_USDT_SOL=${usdtSol}`,
      `NEXT_PUBLIC_USDC_SOS=${usdcSos}`,
      `NEXT_PUBLIC_SOL_SOS=${solSos}`,
    ];

    await fs.appendFile(".env", `\n${addresses.join("\n")}\n`);
    console.log("Pool addresses successfully recorded.");
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