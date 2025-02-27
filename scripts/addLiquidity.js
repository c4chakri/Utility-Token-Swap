// // Token addresses
// schoolOfArchPlanningAddress = "0xBCF063A9eB18bc3C6eB005791C61801B7cB16fe4";
// schoolOfLawAddrss = "0xF62eEc897fa5ef36a957702AA4a45B58fE8Fe312";
// schoolOLibArtsHumanitiesAddress = "0x364C7188028348566E38D762f6095741c49f492B";
// schoolOfScienceAddrss = "0xF2cb3cfA36Bfb95E0FD855C1b41Ab19c517FcDB9";
// schoolOfArtsDesignAddress = "0x5147c5C1Cb5b5D3f56186C37a4bcFBb3Cd0bD5A7";
// schoolOfBusinessAddress = "0xC3549920b94a795D75E6C003944943D552C46F97";
// schoolOfTechAddress = "0xAB8Eb9F37bD460dF99b11767aa843a8F27FB7A6e";
// shoaibAddress = "0xb60971942E4528A811D24826768Bc91ad1383D21";
// rayyanAddrss = "0xD185B4846E5fd5419fD4D077dc636084BEfC51C0";
// popUpAddress = "0xF94AB55a20B32AC37c3A105f12dB535986697945";

// SHO_RAY = "0xEED35b5e260d3Da1741B3967Ad15127A802a2d80";

// // Uniswap contract address
// wethAddress = "0xDe1112a0960B9619da7F91D51fB571cdefE48B5E";
// factoryAddress = "0x1D87585dF4D48E52436e26521a3C5856E4553e3F";
// swapRouterAddress = "0x810090f35DFA6B18b5EB59d298e2A2443a2811E2";
// nftDescriptorAddress = "0x2B8F5e69C35c1Aff4CCc71458CA26c2F313c3ed3";
// positionDescriptorAddress = "0x9A8Ec3B44ee760b629e204900c86d67414a67e8f";
// positionManagerAddress = "0xA899118f4BCCb62F8c6A37887a4F450D8a4E92E0";

const artifacts = {
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
  Shoaib: require("../artifacts/contracts/Shoaib.sol/Shoaib.json"),
  Rayyan: require("../artifacts/contracts/Rayyan.sol/Rayyan.json"),
  UniswapV3Pool: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"),
};

const { Contract } = require("ethers");
const { Token } = require("@uniswap/sdk-core");
const { Pool, Position, nearestUsableTick } = require("@uniswap/v3-sdk");

//Its like API call
async function getPoolData(poolContract) {
  const [tickSpacing, fee, liquidity, slot0] = await Promise.all([
    poolContract.tickSpacing(),
    poolContract.fee(),
    poolContract.liquidity(),
    poolContract.slot0(),
  ]);

  console.log(tickSpacing, fee, liquidity, slot0);
  return {
    tickSpacing: tickSpacing,
    fee: fee,
    liquidity: liquidity,
    sqrtPriceX96: slot0[0],
    tick: slot0[1],
  };
}

async function main() {
  const MAINNET_URL = "test network your";

  const WALLET_ADDRESS = "Address";
  const WALLET_SECRET = "Your Wallet Private Key";
  const provider = new ethers.providers.JsonRpcProvider(MAINNET_URL);
  const wallet = new ethers.Wallet(WALLET_SECRET);
  const signer = wallet.connect(provider);

  const ShoaibContract = new Contract(
    shoaibAddress,
    artifacts.Shoaib.abi,
    provider
  );
  const RayyanContract = new Contract(
    rayyanAddrss,
    artifacts.Rayyan.abi,
    provider
  );

  await ShoaibContract.connect(signer).approve(
    positionManagerAddress,
    ethers.utils.parseEther("599900")
  );
  await RayyanContract.connect(signer).approve(
    positionManagerAddress,
    ethers.utils.parseEther("599900")
  );

  const poolContract = new Contract(
    SHO_RAY,
    artifacts.UniswapV3Pool.abi,
    provider
  );

  const poolData = await getPoolData(poolContract);

  const ShoaibToken = new Token(5, shoaibAddress, 18, "Shoaib", "SHO");
  const RayyanToken = new Token(5, rayyanAddrss, 18, "Rayyan", "RAY");

  const pool = new Pool(
    ShoaibToken,
    RayyanToken,
    poolData.fee,
    poolData.sqrtPriceX96.toString(),
    poolData.liquidity.toString(),
    poolData.tick
  );

  const position = new Position({
    pool: pool,
    liquidity: ethers.utils.parseUnits("2000", 18).toString(),
    tickLower:
      nearestUsableTick(poolData.tick, poolData.tickSpacing) -
      poolData.tickSpacing * 2,
    tickUpper:
      nearestUsableTick(poolData.tick, poolData.tickSpacing) +
      poolData.tickSpacing * 2,
  });
  console.log(position);
  const { amount0: amount0Desired, amount1: amount1Desired } =
    position.mintAmounts;

  params = {
    token0: shoaibAddress,
    token1: rayyanAddrss,
    fee: poolData.fee,
    tickLower:
      nearestUsableTick(poolData.tick, poolData.tickSpacing) -
      poolData.tickSpacing * 2,
    tickUpper:
      nearestUsableTick(poolData.tick, poolData.tickSpacing) +
      poolData.tickSpacing * 2,
    amount0Desired: amount0Desired.toString(),
    amount1Desired: amount1Desired.toString(),
    amount0Min: amount0Desired.toString(),
    amount1Min: amount1Desired.toString(),
    recipient: WALLET_ADDRESS,
    deadline: Math.floor(Date.now() / 1000) + 60 * 10,
  };

  const nonfungiblePositionManager = new Contract(
    positionManagerAddress,
    artifacts.NonfungiblePositionManager.abi,
    provider
  );

  const tx = await nonfungiblePositionManager
    .connect(signer)
    .mint(params, { gasLimit: "1000000" });
  const receipt = await tx.wait();
  console.log(receipt);
}

/*
  npx hardhat run --network localhost scripts/addLiquidity.js
  */

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
