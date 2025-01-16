import booToken from "./BooToken.json";
import lifeToken from "./LifeToken.json";
import singleSwapToken from "./SingleSwapToken.json";
import swapMultiHop from "./SwapMultiHop.json";
import IWETH from "./IWETH.json";
import userStorgeData from "./UserStorageData.json";

require("dotenv").config();

const SINGLE_SWAP_TOKEN = process.env.NEXT_PUBLIC_SINGLE_SWAP_TOKEN;
const SWAP_MULTI_HOP = process.env.NEXT_PUBLIC_SWAP_MULTI_HOP;
const USER_STORAGE_DATA = process.env.NEXT_PUBLIC_USER_STORAGE_DATA;


//SINGLE SWAP TOKEN
export const SingleSwapTokenAddress = SINGLE_SWAP_TOKEN;
export const SingleSwapTokenABI = singleSwapToken.abi;

// SWAP MULTIHOP
export const SwapMultiHopAddress = SWAP_MULTI_HOP;
export const SwapMultiHopABI = swapMultiHop.abi;

//IWETH
export const IWETHAddress = "0x2d13826359803522cCe7a4Cfa2c1b582303DD0B4";
export const IWETHABI = IWETH.abi;

//USER STORAGE DAta

export const userStorageDataAddrss =USER_STORAGE_DATA;
export const userStorageDataABI = userStorgeData.abi;
