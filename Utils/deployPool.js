import { ethers, BigNumber } from "ethers";
import Web3Modal from "web3modal";

require("dotenv").config();

// Configure bignumber.js for high precision calculations
const bn = require("bignumber.js");
bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });

// Uniswap V3 contract addresses
//These are the ywo contracts will allow us ti add liquidity to the pool for new token like SHOW, RAY, and more
const UNISWAP_V3_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS;
const NON_FUNGABLE_MANAGER = process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS;

// Import Uniswap V3 contract ABIs
const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
};

// Function to create a contract instance for the Uniswap V3 Factory
export const fetchPoolContract = (signerOrProvider) =>
  new ethers.Contract(
    UNISWAP_V3_FACTORY_ADDRESS,
    artifacts.UniswapV3Factory.abi,
    signerOrProvider
  );

// Function to create a contract instance for the Nonfungible Position Manager
export const fetchPositionContract = (signerOrProvider) =>
  new ethers.Contract(
    NON_FUNGABLE_MANAGER,
    artifacts.NonfungiblePositionManager.abi,
    signerOrProvider
  );

// Function to encode the price as a square root ratio
const encodePriceSqrt = (reserve1, reserve0) => {
  return BigNumber.from(
    new bn(reserve1.toString())
      .div(reserve0.toString())
      .sqrt()
      .multipliedBy(new bn(2).pow(96))
      .integerValue(3)
      .toString()
  );
};

// Main function to connect with the pool contract and create a new pool if necessary
export const connectingWithPoolContract = async (
  address1,
  address2,
  fee,
  tokenFee1,
  tokenFee2
) => {
  // Connect to the user's wallet
  const web3modal = new Web3Modal();
  const connection = await web3modal.connect();
  const provider = new ethers.providers.Web3Provider(connection);
  const signer = provider.getSigner();

  console.log(signer);

  // Create an instance of the Position Manager contract
  const createPoolContract = await fetchPositionContract(signer);

  // Calculate the initial price for the pool
  const price = encodePriceSqrt(tokenFee1, tokenFee2);
  console.log(price);

  // Create and initialize the pool if it doesn't exist
  const transaction = await createPoolContract
    .connect(signer)
    .createAndInitializePoolIfNecessary(address1, address2, fee, price, {
      gasLimit: 30000000,
    });

  // Wait for the transaction to be mined
  await transaction.wait();
  console.log(transaction);

  // Get the factory contract instance
  const factory = await fetchPoolContract(signer);

  // Get the address of the newly created or existing pool
  const poolAddress = await factory.getPool(address1, address2, fee);

  return poolAddress;
};