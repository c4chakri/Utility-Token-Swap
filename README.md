npx hardhat run --network localhost Utils/01_deployContracts.js && \
npx hardhat run --network localhost Utils/02_deployTokens.js && \
npx hardhat run --network localhost scripts/deployPool.js && \
npx hardhat run --network localhost Utils/addAllLiquidity.js
