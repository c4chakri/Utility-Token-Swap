const { ethers } = require("ethers");

const {
  abi: IUniswapV3PoolABI,
} = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const {
  abi: QuoterABI,
} = require("@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json");

const { getAbi, getPoolImmutables } = require("./priceHelpers");
import { cachedFetch } from '../Context/SwapContext';


// const MAINNET_URL = "https://rpc.ankr.com/eth";
const MAINNET_URL = "https://mainnet.infura.io/v3/ef01014d6bf84e7c93586cd070d990af"

const provider = new ethers.providers.JsonRpcProvider(MAINNET_URL);

//This contract will give us price or output we will get before we swap the token
const qutorAddress = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";

export const getPrice = async (inputAmount, poolAddress) => {
  const cacheKey = `price_${inputAmount}_${poolAddress}`;
  
  return cachedFetch(cacheKey, async () => {
  const poolContract = new ethers.Contract(
    poolAddress,
    IUniswapV3PoolABI,
    provider
  );

  //   console.log(poolContract);

  const tokenAddrss0 = await poolContract.token0()
  const tokenAddrss1 = await poolContract.token1();

  // console.log(tokenAddrss0, tokenAddrss1);

  const tokenAbi0 = await getAbi(tokenAddrss0);
  const tokenAbi1 = await getAbi(tokenAddrss1);

  const tokenContract0 = new ethers.Contract(tokenAddrss0, tokenAbi0, provider);
  const tokenContract1 = new ethers.Contract(tokenAddrss1, tokenAbi1, provider);

  const tokenSymbol0 = await tokenContract0.symbol();
  const tokenSymbol1 = await tokenContract1.symbol();
  const tokenDecimals0 = await tokenContract0.decimals();
  const tokenDecimals1 = await tokenContract1.decimals();

  const quoterContract = new ethers.Contract(qutorAddress, QuoterABI, provider);

  const immutables = await getPoolImmutables(poolContract);

  const amountIn = ethers.utils.parseUnits(
    inputAmount.toString(),
    tokenDecimals0
  );

  // Determine the correct order of tokens
  const [baseToken, quoteToken] = tokenSymbol0 < tokenSymbol1 
    ? [tokenContract0, tokenContract1] 
    : [tokenContract1, tokenContract0];


    // Use the correct order for quotation
  const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
    baseToken.address,
    quoteToken.address,
    immutables.fee,
    amountIn,
    0
  );


  const amountOut = ethers.utils.formatUnits(quotedAmountOut, tokenDecimals1);

  return [amountOut, tokenSymbol0, tokenSymbol1];
});
};



// export const getPrice = async (inputAmount, poolAddress) => {
//   const cacheKey = `price_${inputAmount}_${poolAddress}`;
  
//   return cachedFetch(cacheKey, async () => {
//   const poolContract = new ethers.Contract(
//     poolAddress,
//     IUniswapV3PoolABI,
//     provider
//   );

//   //   console.log(poolContract);

//   const tokenAddrss0 = await poolContract.token0();
//   const tokenAddrss1 = await poolContract.token1();

//   console.log(tokenAddrss0, tokenAddrss1);

//   const tokenAbi0 = await getAbi(tokenAddrss0);
//   const tokenAbi1 = await getAbi(tokenAddrss1);

//   const tokenContract0 = new ethers.Contract(tokenAddrss0, tokenAbi0, provider);
//   const tokenContract1 = new ethers.Contract(tokenAddrss1, tokenAbi1, provider);

//   const tokenSymbol0 = await tokenContract0.symbol();
//   const tokenSymbol1 = await tokenContract1.symbol();
//   const tokenDecimals0 = await tokenContract0.decimals();
//   const tokenDecimals1 = await tokenContract1.decimals();

//   const quoterContract = new ethers.Contract(qutorAddress, QuoterABI, provider);

//   const immutables = await getPoolImmutables(poolContract);

//   const amountIn = ethers.utils.parseUnits(
//     inputAmount.toString(),
//     tokenDecimals0
//   );

//   const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
//     immutables.token0,
//     immutables.token1,
//     immutables.fee,
//     amountIn,
//     0
//   );

//   const amountOut = ethers.utils.formatUnits(quotedAmountOut, tokenDecimals1);

//   return [amountOut, tokenSymbol0, tokenSymbol1];
// });
// };
