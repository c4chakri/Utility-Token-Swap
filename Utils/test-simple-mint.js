const { ethers } = require("hardhat");

async function testSimpleMint() {
  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);
  
  const POSITION_MANAGER = "0x06b96FF90F504A455a36CF7b2643dDFa0714812e";
  const UTILITY1 = "0x5ae55038733F4f5311a86D53aFd01c4f56Aa0c5E";
  const UTILITY2 = "0xFDD3Ed693f28Bf0Ae2b9f4c9e87bc05668362F21";
  
  // Sort tokens
  const token0 = UTILITY1 < UTILITY2 ? UTILITY1 : UTILITY2;
  const token1 = UTILITY1 < UTILITY2 ? UTILITY2 : UTILITY1;
  
  console.log("Token0:", token0);
  console.log("Token1:", token1);
  
  // Approve tokens
  const erc20Abi = ["function approve(address,uint256) returns (bool)"];
  const token0Contract = new ethers.Contract(token0, erc20Abi, signer);
  const token1Contract = new ethers.Contract(token1, erc20Abi, signer);
  
  await token0Contract.approve(POSITION_MANAGER, ethers.constants.MaxUint256);
  await token1Contract.approve(POSITION_MANAGER, ethers.constants.MaxUint256);
  console.log("Tokens approved");
  
  // Position Manager
  const managerAbi = [
    "function mint(tuple(address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)"
  ];
  
  const manager = new ethers.Contract(POSITION_MANAGER, managerAbi, signer);
  
  // Mint params - SUPER SIMPLE
  const params = {
    token0: token0,
    token1: token1,
    fee: 500, // 0.05%
    tickLower: -887270, // Valid tick for 0.05% pool
    tickUpper: 887270,  // Valid tick for 0.05% pool
    amount0Desired: ethers.utils.parseEther("0.1"), // 0.1 token
    amount1Desired: ethers.utils.parseEther("0.1"), // 0.1 token
    amount0Min: 0,
    amount1Min: 0,
    recipient: signer.address,
    deadline: Math.floor(Date.now() / 1000) + 3600,
  };
  
  console.log("\nMinting with params:", JSON.stringify(params, null, 2));
  
  try {
    // First try callStatic
    const result = await manager.callStatic.mint(params, { gasLimit: 3000000 });
    console.log("\n✅ Call static successful!");
    console.log("Liquidity:", result.liquidity.toString());
    
    // Execute
    const tx = await manager.mint(params, {
      gasLimit: 5000000,
      gasPrice: await signer.provider.getGasPrice()
    });
    
    console.log("Tx sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Success! Block:", receipt.blockNumber);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testSimpleMint();