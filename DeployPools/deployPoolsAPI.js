const { ethers, BigNumber, Contract,Wallet } = require("ethers");
const bn = require("bignumber.js");
require("dotenv").config();
bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });

const ERC20_ABI = [
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)"
];

const VALID_FEES = [500, 3000, 10000];

function encodeSqrtPriceX96(price, decimalsA, decimalsB) {
    if (!price || price <= 0 || !isFinite(price)) return null;

    const adjusted = new bn(price.toString())
        .multipliedBy(new bn(10).pow(decimalsB))
        .dividedBy(new bn(10).pow(decimalsA));

    return BigNumber.from(
        adjusted.sqrt().multipliedBy(new bn(2).pow(96)).integerValue(3).toString()
    );
}

const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
};

async function deployPool({
    tokenA,
    tokenB,
    fee,
    price,
    signer,
    provider,
    factory,
    positionManager
}) {
    try {
        if (!ethers.utils.isAddress(tokenA) || !ethers.utils.isAddress(tokenB)) {
            return { success: false, error: "INVALID_TOKEN_ADDRESS" };
        }

        if (tokenA.toLowerCase() === tokenB.toLowerCase()) {
            return { success: false, error: "IDENTICAL_TOKENS" };
        }

        if (!VALID_FEES.includes(fee)) {
            return { success: false, error: "INVALID_FEE_TIER", allowed: VALID_FEES };
        }

        if (!price || typeof price !== "number" || price <= 0) {
            return { success: false, error: "INVALID_PRICE_VALUE" };
        }

        if (!signer || !provider) {
            return { success: false, error: "SIGNER_OR_PROVIDER_MISSING" };
        }

        if (signer.provider?.network?.chainId !== provider.network?.chainId) {
            return { success: false, error: "SIGNER_PROVIDER_NETWORK_MISMATCH" };
        }

        const tokenAContract = new Contract(tokenA, ERC20_ABI, provider);
        const tokenBContract = new Contract(tokenB, ERC20_ABI, provider);

        let decimalsA, decimalsB;

        try {
            [decimalsA, decimalsB] = await Promise.all([
                tokenAContract.decimals(),
                tokenBContract.decimals()
            ]);
        } catch {
            return { success: false, error: "ERC20_DECIMALS_NOT_SUPPORTED" };
        }

        try {
            await Promise.all([
                tokenAContract.totalSupply(),
                tokenBContract.totalSupply()
            ]);
        } catch {
            return { success: false, error: "ERC20_NON_STANDARD_TOKEN" };
        }

        let token0 = tokenA;
        let token1 = tokenB;
        let priceForEncoding = price;

        if (token0.toLowerCase() > token1.toLowerCase()) {
            [token0, token1] = [token1, token0];
            priceForEncoding = 1 / price;
            [decimalsA, decimalsB] = [decimalsB, decimalsA];
        }

        const sqrtPriceX96 = encodeSqrtPriceX96(
            priceForEncoding,
            decimalsA,
            decimalsB
        );

        if (!sqrtPriceX96 || sqrtPriceX96.lte(0)) {
            return { success: false, error: "PRICE_ENCODING_FAILED" };
        }

        const existingPool = await factory.getPool(token0, token1, fee);

        if (existingPool !== ethers.constants.AddressZero) {
            return {
                success: true,
                status: "ALREADY_EXISTS",
                poolAddress: existingPool
            };
        }

        const tx = await positionManager
            .connect(signer)
            .createAndInitializePoolIfNecessary(
                token0,
                token1,
                fee,
                sqrtPriceX96,
                { gasLimit: 8_000_000 }
            );

        const receipt = await tx.wait();

        if (!receipt.status) {
            return { success: false, error: "TRANSACTION_REVERTED" };
        }

        const poolAddress = await factory.getPool(token0, token1, fee);

        if (poolAddress === ethers.constants.AddressZero) {
            return { success: false, error: "POOL_NOT_CREATED" };
        }

        return {
            success: true,
            status: "CREATED",
            poolAddress,
            txHash: receipt.transactionHash
        };
    } catch (err) {
        if (err.code === "CALL_EXCEPTION") {
            return { success: false, error: "CALL_EXCEPTION", reason: err.reason };
        }

        if (err.code === "INSUFFICIENT_FUNDS") {
            return { success: false, error: "INSUFFICIENT_GAS_FUNDS" };
        }

        if (err.code === "NONCE_EXPIRED") {
            return { success: false, error: "NONCE_EXPIRED" };
        }

        if (err.code === "UNPREDICTABLE_GAS_LIMIT") {
            return { success: false, error: "GAS_ESTIMATION_FAILED" };
        }

        return {
            success: false,
            error: "UNKNOWN_ERROR",
            message: err.message
        };
    }
}


async function main() {
    // Implementation specific code to initialize provider, signer, factory, positionManager

    const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    
    const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;
    const POSITION_MANAGER_ADDRESS = process.env.POSITION_MANAGER_ADDRESS;


    const provider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const wallet = new Wallet(PRIVATE_KEY);
    const signer = wallet.connect(provider);
    

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



    // Example parameters
   const result =  await deployPool({
        tokenA: "0x144211D2c93D209Ed4E5b1822458c880E1F59aC7",
        tokenB: "0x9058DFd758B2B8Fd9163e0831264710e02283a44",
        fee: 3000,
        price: 1,
        signer,
        provider,
        factory,
        positionManager: nonfungiblePositionManager
    });
    console.log("Deploy Pool Result:", result);

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });