require("dotenv").config();
const { Contract, BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const bn = require("bignumber.js");
const fs = require("fs/promises");

bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });

const FACTORY_ADDRESS = "0xF3B475F950d44DB53319029d87DED6F894f45E46";

const POSITION_MANAGER_ADDRESS = "0x06b96FF90F504A455a36CF7b2643dDFa0714812e";


const UTILITY1_ADDRESS = "0x5ae55038733F4f5311a86D53aFd01c4f56Aa0c5E";
const UTILITY2_ADDRESS = "0xFDD3Ed693f28Bf0Ae2b9f4c9e87bc05668362F21";

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



async function deployPool(token0, token1, fee, price) {

    const [signer, signer2] = await ethers.getSigners();

    const provider = ethers.utils.provider;

    console.log("Deploying pool for tokens:", token0, token1);
    console.log("Using signer:", signer.address);
    console.log("Provider network:", await provider.getNetwork());
    try {
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

        // Deploy Utility1/Utility2 pair
        const utility1Utility2 = await deployPool(
            UTILITY1_ADDRESS,
            UTILITY2_ADDRESS,
            500,
            encodePriceSqrt(1, 1)
        );

        console.log("Deployed Utility1/Utility2 pool at:", utility1Utility2);
        // Record addresses to the .env file

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
npx hardhat run --network localhost Utils/testDeployPools.js
*/