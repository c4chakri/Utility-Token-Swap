// Token addresses
schoolOfArchPlanningAddress = "0x9A8Ec3B44ee760b629e204900c86d67414a67e8f";
schoolOfLawAddrss = "0xA899118f4BCCb62F8c6A37887a4F450D8a4E92E0";
schoolOLibArtsHumanitiesAddress = "0xb60971942E4528A811D24826768Bc91ad1383D21";
schoolOfScienceAddrss = "0xF94AB55a20B32AC37c3A105f12dB535986697945";
schoolOfArtsDesignAddress = "0xD185B4846E5fd5419fD4D077dc636084BEfC51C0";
schoolOfBusinessAddress = "0xBCF063A9eB18bc3C6eB005791C61801B7cB16fe4";
schoolOfTechAddress = "0xF62eEc897fa5ef36a957702AA4a45B58fE8Fe312";
shoaibAddress = "0x1D87585dF4D48E52436e26521a3C5856E4553e3F";
rayyanAddrss = "0x810090f35DFA6B18b5EB59d298e2A2443a2811E2";
popUpAddress = "0x2B8F5e69C35c1Aff4CCc71458CA26c2F313c3ed3";

// Uniswap contract address
wethAddress = "0xDe1112a0960B9619da7F91D51fB571cdefE48B5E";
factoryAddress = "0x1D87585dF4D48E52436e26521a3C5856E4553e3F";
swapRouterAddress = "0x810090f35DFA6B18b5EB59d298e2A2443a2811E2";
nftDescriptorAddress = "0x2B8F5e69C35c1Aff4CCc71458CA26c2F313c3ed3";
positionDescriptorAddress = "0x9A8Ec3B44ee760b629e204900c86d67414a67e8f";
positionManagerAddress = "0xA899118f4BCCb62F8c6A37887a4F450D8a4E92E0";

const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
};

// const { waffle } = require("hardhat");
const { Contract, BigNumber } = require("ethers");
const bn = require("bignumber.js");
const Web3Modal = require("web3modal");
bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });

// const MAINNET_URL = "https://rpc.ankr.com/eth";
const MAINNET_URL =
  "https://mainnet.infura.io/v3/ef01014d6bf84e7c93586cd070d990af";

const provider = new ethers.providers.JsonRpcProvider(MAINNET_URL);

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
  positionManagerAddress,
  artifacts.NonfungiblePositionManager.abi,
  provider
);

const factory = new Contract(
  factoryAddress,
  artifacts.UniswapV3Factory.abi,
  provider
);

async function deployPool(token0, token1, fee, price) {
  // const [owner] = await ethers.getSigners();
  const MAINNET_URL = "test network url";

  const WALLET_ADDRESS = "your";
  const WALLET_SECRET = "your";
  const provider = new ethers.providers.JsonRpcProvider(MAINNET_URL);
  const wallet = new ethers.Wallet(WALLET_SECRET);
  const signer = wallet.connect(provider);
  const create = await nonfungiblePositionManager
    .connect(signer)
    .createAndInitializePoolIfNecessary(token0, token1, fee, price, {
      gasLimit: 5000000,
    });

  console.log(create);
  const poolAddress = await factory
    .connect(signer)
    .getPool(token0, token1, fee);
  return poolAddress;
}

async function main() {
  const shoRay = await deployPool(
    popUpAddress,
    rayyanAddrss,
    3000,
    encodePriceSqrt(1, 1)
  );

  console.log("SHO_RAY=", `'${shoRay}'`);
}

/*
  npx hardhat run --network goerli scripts/deployPool.js
  */

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
