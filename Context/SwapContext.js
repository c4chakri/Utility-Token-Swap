import React, { useState, useEffect } from "react";
import { ethers, BigNumber } from "ethers";
import Web3Modal from "web3modal";
import { Token, CurrencyAmount, TradeType, Percent } from "@uniswap/sdk-core";
import axios from "axios";

require("dotenv").config();

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS;
const TETHER_ADDRESS = process.env.NEXT_PUBLIC_TETHER_ADDRESS;
const SCHOOL_OF_ARCH_PLANNING_ADDRESS = process.env.NEXT_PUBLIC_SCHOOL_OF_ARCH_PLANNING_ADDRESS;
const SCHOOL_OF_LAW_ADDRESS = process.env.NEXT_PUBLIC_SCHOOL_OF_LAW_ADDRESS;
const SCHOOL_OF_ARTS_HUMANITIES_ADDRESS = process.env.NEXT_PUBLIC_SCHOOL_OF_ARTS_HUMANITIES_ADDRESS;
const SCHOOL_OF_ARTS_DESIGN_ADDRESS = process.env.NEXT_PUBLIC_SCHOOL_OF_ARTS_DESIGN_ADDRESS;
const SCHOOL_OF_SCIENCE_ADDRESS = process.env.NEXT_PUBLIC_SCHOOL_OF_SCIENCE_ADDRESS;
const SCHOOL_OF_BUSINESS_ADDRESS = process.env.NEXT_PUBLIC_SCHOOL_OF_BUSINESS_ADDRESS;
const SCHOOL_OF_TECH_ADDRESS = process.env.NEXT_PUBLIC_SCHOOL_OF_TECH_ADDRESS;


console.log("USDC_ADDRESS: ", USDC_ADDRESS);

//INTERNAL IMPORT
import {
  checkIfWalletConnected,
  connectWallet,
  connectingWithSingleSwapToken,
  connectingWithIWTHToken,
  connectingWithDAIToken,
  connectingWithUserStorageContract,
  connectingWithMultiHopContract,
} from "../Utils/appFeatures";

import { getPrice } from "../Utils/fetchingPrice";
import { swapUpdatePrice } from "../Utils/swapUpdatePrice";
import { addLiquidityExternal } from "../Utils/addLiquidity";
import { getLiquidityData } from "../Utils/checkLiquidity";
import { connectingWithPoolContract } from "../Utils/deployPool";

import { IWETHABI } from "./constants";
import ERC20 from "./ERC20.json";

export const SwapTokenContext = React.createContext();

const cache = new Map();
const CACHE_DURATION = 60000; // 1 minute
//Latest update by sam
export const cachedFetch = async (key, fetchFunction) => {
  if (
    cache.has(key) &&
    Date.now() - cache.get(key).timestamp < CACHE_DURATION
  ) {
    return cache.get(key).data;
  }
  const data = await fetchFunction();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};

export const SwapTokenContextProvider = ({ children }) => {
  //Update by sam
  const requestQueue = [];
  const processQueue = async () => {
    while (requestQueue.length > 0) {
      const request = requestQueue.shift();
      await request();
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  };

  const addToQueue = (request) => {
    requestQueue.push(request);
    if (requestQueue.length === 1) {
      processQueue();
    }
  };

  //USSTATE
  const [account, setAccount] = useState("");
  const [ether, setEther] = useState("");
  const [networkConnect, setNetworkConnect] = useState("");
  const [weth9, setWeth9] = useState("");
  const [dai, setDai] = useState("");

  const [tokenData, setTokenData] = useState([]);
  const [getAllLiquidity, setGetAllLiquidity] = useState([]);
  //TOP TOKENS
  const [topTokensList, setTopTokensList] = useState([]);

  const addToken = [
    USDC_ADDRESS,
    TETHER_ADDRESS,
    SCHOOL_OF_ARCH_PLANNING_ADDRESS, 
    SCHOOL_OF_LAW_ADDRESS,
    SCHOOL_OF_ARTS_HUMANITIES_ADDRESS,
    SCHOOL_OF_ARTS_DESIGN_ADDRESS,
    SCHOOL_OF_SCIENCE_ADDRESS,
    SCHOOL_OF_BUSINESS_ADDRESS,
    SCHOOL_OF_TECH_ADDRESS,
  ];

  //FETCH DATA
  const fetchingData = async () => {
    addToQueue(async () => {
      try {
         // Verify contract addresses exist before proceeding
         if (!addToken.every(address => address)) {
          console.log("Missing contract addresses");
          return;
        }

        //GET USER ACCOUNT
        const userAccount = await checkIfWalletConnected();
        setAccount(userAccount);
        //CREATE PROVIDER
        const web3modal = new Web3Modal();
        const connection = await web3modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        //CHECK Balance
        const balance = await provider.getBalance(userAccount);
        const convertBal = BigNumber.from(balance).toString();
        const ethValue = ethers.utils.formatEther(convertBal);
        setEther(ethValue);

        //GET NETWORK
        const newtork = await provider.getNetwork();
        setNetworkConnect(newtork.name);

        //ALL TOKEN BALANCE AND DATA
        addToken.map(async (el, i) => {
          //GETTING CONTRACT
          const contract = new ethers.Contract(el, ERC20, provider);
          //GETTING BALANCE OF TOKEN
          const userBalance = await contract.balanceOf(userAccount);
          const tokenLeft = BigNumber.from(userBalance).toString();
          const convertTokenBal = ethers.utils.formatEther(tokenLeft);
          //GET NAME AND SYMBOL

          const symbol = await contract.symbol();
          const name = await contract.name();

          tokenData.push({
            name: name,
            symbol: symbol,
            tokenBalance: convertTokenBal,
            tokenAddress: el,
          });
        });

        // Get liquidity data
        const userStorageData = await connectingWithUserStorageContract();
        const userLiquidity = await userStorageData.getAllTransactions();
        console.log(userLiquidity);

        userLiquidity.map(async (el, i) => {
           // Get token contracts to fetch names
          const token0Contract = new ethers.Contract(el.tokenAddress0, ERC20, provider);
          const token1Contract = new ethers.Contract(el.tokenAddress1, ERC20, provider);
          
          const token0Name = await token0Contract.name();
          const token1Name = await token1Contract.name();
          
          console.log(`Pool Address: ${el.poolAddress}`);
          console.log(`Token Pair: ${token0Name} - ${token1Name}`);
          console.log('------------------------');

          const liquidityData = await getLiquidityData(
            el.poolAddress,
            el.tokenAddress0,
            el.tokenAddress1
          );

          getAllLiquidity.push(liquidityData);
          console.log(getAllLiquidity);
        });

        // Fetch top tokens data from The Graph
        //const URL = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3";
        const URL =
          "https://gateway.thegraph.com/api/3198a333666bd4c1de617212fe8883d0/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV";

        const query = `
      {
        tokens(orderBy: volumeUSD, orderDirection: desc, first:20){
          id
          name
          symbol
           decimals
          volume
          volumeUSD
           totalSupply
           feesUSD
           txCount
           poolCount
           totalValueLockedUSD
           totalValueLocked
           derivedETH
        }
      }
      `;

        const axiosData = await axios.post(URL, { query: query });
        console.log(axiosData.data.data.tokens);
        setTopTokensList(axiosData.data.data.tokens);
      } catch (error) {
        console.log(error);
      }
    });
  };

  useEffect(() => {
    fetchingData();
  }, []);

  //CREATE AND ADD LIQUIDITY
  //This function can be applicable for only new tokens to add liquidity eg. SOT,SOB, SOL 
  const createLiquidityAndPool = async ({
    tokenAddress0,
    tokenAddress1,
    fee,
    tokenPrice1,
    tokenPrice2,
    slippage,
    deadline,
    tokenAmmountOne,
    tokenAmmountTwo,
  }) => {
    try {
      console.log(
        tokenAddress0,
        tokenAddress1,
        fee,
        tokenPrice1,
        tokenPrice2,
        slippage,
        deadline,
        tokenAmmountOne,
        tokenAmmountTwo
      );

      if (!tokenAddress0 || !tokenAddress1) {
        console.error("Invalid token addresses for pool creation.");
        return;
      }
      //CREATE POOL
      const createPool = await connectingWithPoolContract(
        tokenAddress0,
        tokenAddress1,
        fee,
        tokenPrice1,
        tokenPrice2,
        {
          gasLimit: 1500000,
        }
      );

      const poolAddress = createPool;
      console.log("New Pool Created with Address:",poolAddress);

      //CREATE LIQUIDITY
      const info = await addLiquidityExternal(
        tokenAddress0,
        tokenAddress1,
        poolAddress,
        fee,
        tokenAmmountOne,
        tokenAmmountTwo
      );
      console.log(info);

      //ADD DATA
      const userStorageData = await connectingWithUserStorageContract();

      const userLiqudity = await userStorageData.addToBlockchain(
        poolAddress,
        tokenAddress0,
        tokenAddress1
      );
    } catch (error) {
      console.log("Error creating liquidity and pool:",error);
    }
  };

  
  //SINGL SWAP TOKEN
  const singleSwapToken = async ({ token1, token2, swapAmount }) => {
    console.log("Attempting Swap:");
    console.log(`From: ${token1.name} (${token1.tokenAddress.tokenAddress})`);
    console.log(`To: ${token2.name} (${token2.tokenAddress.tokenAddress})`);
    console.log(`Amount: ${swapAmount}`);
    console.log('------------------------');
  
    try {
      // First check if pool exists for these tokens
      const userStorageData = await connectingWithUserStorageContract();
      const userLiquidity = await userStorageData.getAllTransactions();
      
      const pool = userLiquidity.find(el => 
        (el.tokenAddress0 === token1.tokenAddress.tokenAddress && el.tokenAddress1 === token2.tokenAddress.tokenAddress) ||
        (el.tokenAddress0 === token2.tokenAddress.tokenAddress && el.tokenAddress1 === token1.tokenAddress.tokenAddress)
      );
  
      if (!pool) {
        throw new Error(`No pool found for ${token1.name} - ${token2.name} pair`);
      }
  
      console.log("Found pool for swap:", pool.poolAddress);
      
      // Continue with swap using found pool
      let singleSwapToken = await connectingWithSingleSwapToken();
      let weth = await connectingWithIWTHToken();
      let dai = await connectingWithDAIToken();
  
      const decimals0 = 18;
      const inputAmount = swapAmount;
      const amountIn = ethers.utils.parseUnits(
        inputAmount.toString(),
        decimals0
      );
  
      await weth.deposit({ value: amountIn });
      console.log("Amount In:", amountIn.toString());
      
      await weth.approve(singleSwapToken.address, amountIn);
      
      const transaction = await singleSwapToken.swapExactInputSingle(
        token1.tokenAddress.tokenAddress,
        token2.tokenAddress.tokenAddress,
        amountIn,
        {
          gasLimit: 300000,
        }
      );
  
      await transaction.wait();
      console.log("Swap Transaction:", transaction.hash);
  
      const balance = await dai.balanceOf(account);
      const transferAmount = BigNumber.from(balance).toString();
      const ethValue = ethers.utils.formatEther(transferAmount);
      setDai(ethValue);
      console.log("Final Balance:", ethValue);
  
    } catch (error) {
      console.log("Swap error:", error);
      throw error;
    }
  };
  

  // const singleSwapToken = async ({ token1, token2, swapAmount }) => {
  //     // Validate both tokens exist
  // if (!token1 || !token2 || !token2.tokenAddress) {
  //   throw new Error("Invalid token selection");
  // }
  //   console.log("Attempting Swap:");
  //   console.log(`From: ${token1.name} (${token1.tokenAddress.tokenAddress})`);
  //   console.log(`To: ${token2.name} (${token2.tokenAddress.tokenAddress})`);
  //   console.log(`Amount: ${swapAmount}`);
  
  //   try {
  //     // Create provider
  //   const web3modal = new Web3Modal();
  //   const connection = await web3modal.connect();
  //   const provider = new ethers.providers.Web3Provider(connection);
  //   const signer = provider.getSigner();
  //   const userAccount = await signer.getAddress();

  //     const userStorageData = await connectingWithUserStorageContract();
  //     const userLiquidity = await userStorageData.getAllTransactions();
      
  //     // Check for existing pool
  //     const pool = userLiquidity.find(el => 
  //       (el.tokenAddress0 === token1.tokenAddress.tokenAddress && el.tokenAddress1 === token2.tokenAddress.tokenAddress) ||
  //       (el.tokenAddress0 === token2.tokenAddress.tokenAddress && el.tokenAddress1 === token1.tokenAddress.tokenAddress)
  //     );
  
  //     if (!pool) {
  //       throw new Error(`No pool found for ${token1.name} - ${token2.name} pair. Please create a pool first.`);
  //     }
  
  //     console.log("Found pool for swap:", pool.poolAddress);
      
  //     let singleSwapToken = await connectingWithSingleSwapToken();
  //     const decimals0 = 18;
  //     const amountIn = ethers.utils.parseUnits(swapAmount.toString(), decimals0);
  
  //     // Get token contracts
  //     const token1Contract = new ethers.Contract(token1.tokenAddress.tokenAddress, ERC20, signer);
  //     // await token1Contract.approve(singleSwapToken.address, amountIn);
  //     const swapContract = singleSwapToken.connect(signer);
    
  //     // Execute transactions
  //     // const approveTx = await token1Contract.approve(swapContract.address, amountIn);
  //     // await approveTx.wait();
  //     // console.log("Token transfer approved");
  //     try {
  //       const approveTx = await token1Contract.approve(swapContract.address, amountIn);
  //       await approveTx.wait();
  //       console.log("Token transfer approved");
  //     } catch (approveError) {
  //       console.log("Approval error:", approveError);
  //       return; // Stop if approval fails
  //     }
      
  //     //WHILE SWAPPIN PROGRAMM IS RUNNING AT THIS POINT WHEN TRYING TO SWAP GEETING AN JSON RPC ERROR.
  //     console.log("Executing swap...");
  //     const transaction = await singleSwapToken.swapExactInputSingle(
  //       token1.tokenAddress.tokenAddress,
  //       token2.tokenAddress.tokenAddress,
  //       amountIn,
  //       {
  //         gasLimit: ethers.utils.hexlify(800000),  // High gas limit for debugging
  //         gasPrice: ethers.utils.parseUnits("20", "gwei"),  // Set a static gas price
  //         from: userAccount
  //       }
  //     );
  
  //     await transaction.wait();
  //     console.log("Swap Transaction:", transaction.hash);
  
  //   } catch (error) {
  //     console.log("Swap error:", error);
  //     throw error;
  //   }
  // };
  

  return (
    <SwapTokenContext.Provider
      value={{
        singleSwapToken,
        connectWallet,
        getPrice,
        swapUpdatePrice,
        createLiquidityAndPool,
        addToQueue,
        getAllLiquidity,
        account,
        weth9,
        dai,
        networkConnect,
        ether,
        tokenData,
        topTokensList,
      }}
    >
      {children}
    </SwapTokenContext.Provider>
  );
};
