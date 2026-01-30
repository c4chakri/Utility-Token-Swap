require("dotenv").config();
const { Contract, BigNumber ,Wallet} = require("ethers");
const ethers = require("ethers");
const bn = require("bignumber.js");
const fs = require("fs/promises");

bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });


require("dotenv").config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const provider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC_URL);
const wallet = new Wallet(PRIVATE_KEY);
const signer = wallet.connect(provider);


const UTILITY1_ADDRESS = process.env.UTILITY1_ADDRESS;
const UTILITY2_ADDRESS = process.env.UTILITY2_ADDRESS;
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;
const POSITION_MANAGER_ADDRESS = process.env.POSITION_MANAGER_ADDRESS;

console.table({
  UTILITY1_ADDRESS,
  UTILITY2_ADDRESS,
  FACTORY_ADDRESS,
  POSITION_MANAGER_ADDRESS
})
const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
};

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
    return poolAddress;
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
    
  
    // Deploy UTILITY1/UTILITY2 pair with 1% fee and 1:3 price ratio
    const utility1Utility2 = await deployPool(
      UTILITY1_ADDRESS,
      UTILITY2_ADDRESS,
      10000, // 1% fee
      encodePriceSqrt(1, 3) // UTILITY1 is worth 1/3 of UTILITY2
    );
  
  
    // Record addresses to the .env file
    const addresses = [
      `UTILITY1_UTILITY2=${utility1Utility2}`
    ];
  
    await fs.appendFile(".env", `\n${addresses.join("\n")}\n`);
    console.log("Pool addresses successfully recorded.");
    console.table({
      
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
npx hardhat run --network sepolia DeployPools/deployPool.js

*/