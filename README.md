npx hardhat run --network localhost Utils/01_deployContracts.js && \
npx hardhat run --network localhost Utils/02_deployTokens.js && \
npx hardhat run --network localhost scripts/deployPool.js && \
npx hardhat run --network localhost Utils/addAllLiquidity.js && \
npx hardhat run --network localhost Utils/swapAllTokens.js




npx hardhat run --network localhost Utils/01_deployContracts.js ==> deploying all uniswap contracts

npx hardhat run --network localhost Utils/02_deployTokens.js  == > deploy utility tokens for swapping
npx hardhat run --network localhost scripts/deployPool.js ==> deployong pools
npx hardhat run --network localhost scripts/checkLiquidity.js ==> checkLiquidity of pools
npx hardhat run --network localhost Utils/addAllLiquidity.js ==> adding liquidity to the pools
npx hardhat run --network localhost Utils/swapTokens.js ===> swapping of tokens
