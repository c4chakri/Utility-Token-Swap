const fs = require("fs");
const { ethers } = require("hardhat");
const { promisify } = require("util");
//
async function main() {
  const [owner, signer2] = await ethers.getSigners();

  Tether = await ethers.getContractFactory("Tether");
  tether = await Tether.deploy();

  Usdc = await ethers.getContractFactory("UsdCoin");
  usdc = await Usdc.deploy();

  WrappedBitcoin = await ethers.getContractFactory("WrappedBitcoin");
  wrappedBitcoin = await WrappedBitcoin.deploy();


  SchoolOfLaw = await ethers.getContractFactory("SchoolOfLaw");
  schoolOfLaw = await SchoolOfLaw.deploy();


  SchoolOfScience = await ethers.getContractFactory("SchoolOfScience");
  schoolOfScience = await SchoolOfScience.deploy();

  const ut1Params = [

    ethers.utils.parseEther("1000000000000000000000000000000"),
    "Utility1",
    "UT1",
    owner.address,
    [true, true, true, true, true, true, true, true],
    "150",
    owner.address,
    "18",
    [[2, 10], [3, 12], [6, 15], [9, 20], [12, 25], [24, 35]]


  ]

  Utility1 = await ethers.getContractFactory("Utility1");
  utility1 = await Utility1.deploy(...ut1Params);

  Utility2 = await ethers.getContractFactory("Utility2");
  utility2 = await Utility2.deploy(...ut1Params);

  // minting to sender
  await tether.connect(owner).mint(signer2.address, ethers.utils.parseEther("100000"));
  await usdc.connect(owner).mint(signer2.address, ethers.utils.parseEther("100000"));
  await wrappedBitcoin.connect(owner).mint(signer2.address, ethers.utils.parseEther("100000"));
  await schoolOfLaw.connect(owner).mint(signer2.address, ethers.utils.parseEther("100000"));
  await schoolOfScience.connect(owner).mint(signer2.address, ethers.utils.parseEther("100000"));

  await utility1.connect(owner).transferUnrestrictedTokens(signer2.address, ethers.utils.parseEther("100000"));
  await utility2.connect(owner).transferUnrestrictedTokens(signer2.address, ethers.utils.parseEther("100000"));

  // utility1 balance of signer2
  ut1Signer2Balance = await (utility1.balanceOf(signer2.address));


  await utility1.connect(signer2).transfer(owner.address, ethers.utils.parseEther("150"));
  ut1OwnerBalance = await (utility1.balanceOf(owner.address));

 await utility2.connect(signer2).transfer(owner.address, ethers.utils.parseEther("150"));
 ut2OwnerBalance = await (utility2.balanceOf(owner.address));


  // record addresses
  let addresses = [
    `NEXT_PUBLIC_USDC_ADDRESS=${usdc.address}`,
    `NEXT_PUBLIC_TETHER_ADDRESS=${tether.address}`,
    `NEXT_PUBLIC_WRAPPED_BITCOIN_ADDRESS=${wrappedBitcoin.address}`,
    `NEXT_PUBLIC_SCHOOL_OF_LAW_ADDRESS=${schoolOfLaw.address}`,
    `NEXT_PUBLIC_SCHOOL_OF_SCIENCE_ADDRESS=${schoolOfScience.address}`,
    `NEXT_PUBLIC_UTILITY1_ADDRESS=${utility1.address}`,
    `NEXT_PUBLIC_UTILITY2_ADDRESS=${utility2.address}`,
  ];
  const data = "\n" + addresses.join("\n");

  const writeFile = promisify(fs.appendFile);
  const filePath = ".env";
  return writeFile(filePath, data)
    .then(() => {
      console.log("Addresses recorded.");
      console.table({
        Tether: tether.address,
        UsdCoin: usdc.address,
        WrappedBitcoin: wrappedBitcoin.address,
        SchoolOfLaw: schoolOfLaw.address,
        SchoolOfScience: schoolOfScience.address,
        Utility1: utility1.address,
        Utility2: utility2.address
      })
    })
    .catch((error) => {
      console.error("Error logging addresses:", error);
      throw error;
    });
}

/*
  npx hardhat run --network localhost Utils/02_deployTokens.js
*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
