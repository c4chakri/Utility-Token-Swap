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


npx hardhat run --network localhost DeploymentScripts/01_weth.js 
npx hardhat run --network localhost DeploymentScripts/02_Factory.js
npx hardhat run --network localhost DeploymentScripts/03_SwapRouter.js
npx hardhat run --network localhost DeploymentScripts/04_NFTDescriptor.js
npx hardhat run --network localhost DeploymentScripts/05_PositionDescriptor.js
npx hardhat run --network localhost DeploymentScripts/06_PositionManager.js


npx hardhat run --network localhost DeploymentScripts/01_weth.js && \
npx hardhat run --network localhost DeploymentScripts/02_Factory.js && \
npx hardhat run --network localhost DeploymentScripts/03_SwapRouter.js && \
npx hardhat run --network localhost DeploymentScripts/04_NFTDescriptor.js && \
npx hardhat run --network localhost DeploymentScripts/05_PositionDescriptor.js && \
npx hardhat run --network localhost DeploymentScripts/06_PositionManager.js


npx hardhat run --network localhost DeployTokens/DeployTokens.js

npx hardhat run --network localhost DeployPools/deployPool.js

npx hardhat run --network localhost AddLiquidity/AddLiquidity.js

npx hardhat run --network localhost AddLiquidity/CheckLiquidity.js

  npx hardhat run --network localhost Swap/swapUT.js
