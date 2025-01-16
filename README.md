# Uniswap V3 Tutorial Project

This project demonstrates the implementation of Uniswap V3 features using Hardhat and Next.js.
## The project is to be using a traditional React setup h the following architecture:
Frontend: React with Context API
API Layer: Direct blockchain interactions via Ethers.js
Smart Contract Integration: Hardhat + Node.js
The API calls are handled through:

Web3Modal for wallet connections
Ethers.js providers for blockchain communication
Custom caching layer implemented in SwapContext.js

Smart Contract & Blockchain:
Ethereum
Uniswap V3 Protocol
Web3.js/Ethers.js for blockchain interaction

Frontend Development:
React.js
Web3Modal for wallet connections
Context API for state management

Libraries & Tools:
BigNumber.js for precise numerical calculations
Axios for API calls
Hardhat for development environment
JSON-RPC for blockchain communication

Smart Contract Dependencies:
Uniswap V3 Core contracts
Uniswap V3 Periphery contracts
NFT Position Manager

Development Tools:
Node.js
npm/yarn package manager

The project implements key Uniswap V3 features including:

Pool creation and management
Token swapping
Liquidity provision
Price calculations and updates
Wallet integration


## Setup

1. NVM version: `nvm install 18.12.1`
2. NPM version: `npm install -g npm@8.19.2`
3. Node.js version: 18.12.1
4. NPM version: 8.19.2
5. nvm use 18.12.1

## Development

1. Clean Hardhat artifacts: `npx hardhat clean`
2. Start local blockchain: `npx hardhat node --show-stack-traces`
3. Run development server: `npm run dev`

## Deployment

Deploy contracts to local network:
```shell
1. npx hardhat run --network localhost scripts/uniswapContract.js
After Deploying the screept make sure to add the contract address in the script/deployPool.js and Utils/deployPool.js files.
in Utils/deployPool.js we have to change these 2 address UNISWAP_V3_FACTORY_ADDRESS, NON_FUNGABLE_MANAGER
which are namely factoryAddress= '0x5f58879Fe3a4330B6D85c1015971Ea6e5175AeDD' and positionManagerAddress= '0x8dF2a20225a5577fB173271c3777CF45305e816d'

2. npx hardhat run --network localhost scripts/deployToken.js
change the contract addresses in deploy.Pool.js, Script/addLiquidity.js and Swapcontext.js in addToken


3. npx hardhat run --network localhost scripts/deploy.js
and change contract address in Context/contant.js

npx hardhat run scripts/deploy.js --network localhost

## Contract Addresses

WETH: '0x7A28cf37763279F774916b85b5ef8b64AB421f79'

Factory: '0x2BB8B93F585B43b06F3d523bf30C203d3B6d4BD4'

SwapRouter: '0xB7ca895F81F20e05A5eb11B05Cbaab3DAe5e23cd'

NFTDescriptor: '0xd0EC100F1252a53322051a95CF05c32f0C174354'

PositionDescriptor: '0x2d13826359803522cCe7a4Cfa2c1b582303DD0B4'

PositionManager: '0xCa57C1d3c2c35E667745448Fef8407dd25487ff8'

schoolOfArchPlanningAddress= '0x9A8Ec3B44ee760b629e204900c86d67414a67e8f'
schoolOfLawAddrss= '0xA899118f4BCCb62F8c6A37887a4F450D8a4E92E0'
schoolOLibArtsHumanitiesAddress= '0xb60971942E4528A811D24826768Bc91ad1383D21'
schoolOfScienceAddrss= '0xF94AB55a20B32AC37c3A105f12dB535986697945'
schoolOfArtsDesignAddress= '0xD185B4846E5fd5419fD4D077dc636084BEfC51C0'
schoolOfBusinessAddress= '0xBCF063A9eB18bc3C6eB005791C61801B7cB16fe4'
schoolOfTechAddress= '0xF62eEc897fa5ef36a957702AA4a45B58fE8Fe312'
shoaibAddress= '0x1D87585dF4D48E52436e26521a3C5856E4553e3F'
rayyanAddrss= '0x810090f35DFA6B18b5EB59d298e2A2443a2811E2'
popUpAddress= '0x2B8F5e69C35c1Aff4CCc71458CA26c2F313c3ed3'

## Project Structure
Utils/: Contains utility functions for contract interactions and wallet connections.
scripts/: Deployment and interaction scripts.
contracts/: Smart contract source code.
test/: Test files for smart contracts.

## Important Notes
After deploying contracts, update addresses in scripts/deployPool.js and Utils/deployPool.js.
Update token addresses in deploy.Pool.js and SwapContext.js.
Import deployed tokens to MetaMask for testing.
Deploy UserStorageData contract and update address in Context/constant.js.
Use your Etherscan API key in priceHelper.js.
==> XRZ9CR89DKHF8YAXDBW1MZVXN2E5RC7W58




## Troubleshooting
If encountering RPC errors, try disconnecting and reconnecting MetaMask.(MetaMask - RPC Error: Internal JSON-RPC error. 
Object)
==>Clear the catche from meta mask or restart the application and then create the liquidity.  Above error is not in code error is in metamask.
For persistent errors, delete artifacts/ and cache/ folders, redeploy contracts, and update addresses.

## Additional Information
Project directory: /Users/admin/Documents/Woxsen/uniswap-project/uniswap-tutorial-code
Frontend data is fetched dynamically from the Utils folder.
Static data can be printed by running scripts from the scripts folder.
The storeUserData.sol contract is used to track user liquidity additions on-chain.
Subgraph URL    // const URL = "https://gateway.thegraph.com/api/3198a333666bd4c1de617212fe8883d0/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV"
=> While setting the min and max price it is we are setting our price of our token per swaping token.







@@@@@@@@@@@@@@@@@@@@@@THIS IS THE NEW PROJECT AFTER COMPLETEING AN PILOT PROJECT @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@



Fetch price needs an qutorAddress which we are giving in fetchingPrice.js

Task 1.
HeroSection.jsx 
here in this script we have hardcode poolAddress instead of going with this hardcoded pool address how we can create multiaddresses of the pool for the differsnt tokens ina an array for that what will be the logic to check for the name of the token and on base of that we define a pool and simply here and that will give the data . 

Task 2.
Currently we arehaving single swap functionality but we have to implement multyhope functionality for the swap..


"SchoolOfArchPlanning", "SOAP"
"SchoolOfLaw", "SOL"
"SchoolOLibArtsHumanities", "SOLAH"
"SchoolOfArtsDesign", "SOAD"
"SchoolOfScience", "SOC"
"SchoolOfBusiness", "SOB"
"SchoolOfTech", "SOT"

##################################################After Updation of Script######################################################################
Now we have make code dynamic and when we deploy script atomatically contract address has been saved in .env file and fetch in respected file where ever they need 
we have to deploy these three script.
If you want to deploy scripts then first delete the existing .env file. then deploy 
1) npx hardhat run --network localhost Utils/01_deployContracts.js
2) npx hardhat run --network localhost Utils/02_deployTokens.js
3) npx hardhat run --network localhost scripts/deploy.js 

NEXT_PUBLIC_WETH_ADDRESS=0xdcaa80371BDF9ff638851713f145Df074428Db19
NEXT_PUBLIC_FACTORY_ADDRESS=0xcf23CE2ffa1DDd9Cc2b445aE6778c4DBD605a1A0
NEXT_PUBLIC_SWAP_ROUTER_ADDRESS=0x427EE58a6c574032085AEB90Dd05dEea6F054930
NEXT_PUBLIC_NFT_DESCRIPTOR_ADDRESS=0x2963ff0196a901ec3F56d7531e7C4Ce8F226462B
NEXT_PUBLIC_POSITION_DESCRIPTOR_ADDRESS=0xba840136E489cB5eCf9D9988421F3a9F45e0c341
NEXT_PUBLIC_POSITION_MANAGER_ADDRESS=0xA13d4a67745D4Ed129AF590c495897eE2C7F8Cfc
NEXT_PUBLIC_USDC_ADDRESS=0x23228469b3439d81DC64e3523068976201bA08C3
NEXT_PUBLIC_TETHER_ADDRESS=0xEd8D7d3A98CB4ea6C91a80dcd2220719c264531f
NEXT_PUBLIC_WRAPPED_BITCOIN_ADDRESS=0xfD3e0cEe740271f070607aEddd0Bf4Cf99C92204
NEXT_PUBLIC_SCHOOL_OF_ARCH_PLANNING_ADDRESS=0x01D4648B896F53183d652C02619c226727477C82
NEXT_PUBLIC_SCHOOL_OF_LAW_ADDRESS=0x2ca60d89144D4cdf85dA87af4FE12aBF9265F28C
NEXT_PUBLIC_SCHOOL_OF_ARTS_HUMANITIES_ADDRESS=0xf4fa0d1C10c47cDe9F65D56c3eC977CbEb13449A
NEXT_PUBLIC_SCHOOL_OF_ARTS_DESIGN_ADDRESS=0xA343B1FC2897b8C49A72A9A0B2675cB9c7664e8c
NEXT_PUBLIC_SCHOOL_OF_SCIENCE_ADDRESS=0x88B9Ad010A699Cc0c8C5C5EA8bAF90A0C375df1a
NEXT_PUBLIC_SCHOOL_OF_BUSINESS_ADDRESS=0xf975A646FCa589Be9fc4E0C28ea426A75645fB1f
NEXT_PUBLIC_SCHOOL_OF_TECH_ADDRESS=0xAaC7D4A36DAb95955ef3c641c23F1fA46416CF71
NEXT_PUBLIC_SINGLE_SWAP_TOKEN=0x2fe19128A8257182fdD77f90eA96D27cA342897A
NEXT_PUBLIC_SWAP_MULTI_HOP=0x2f6f107D4Afd43c451B74DA41A6DDA53D2Bf24B1
NEXT_PUBLIC_USER_STORAGE_DATA=0xb9b0c96e4E7181926D2A7ed331C9C346dfa59b4D# Utility-Token-Swap
