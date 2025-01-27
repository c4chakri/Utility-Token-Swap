// async function main() {
//   const [owner] = await ethers.getSigners();


//   Shoaib = await ethers.getContractFactory("Shoaib");
//   shoaib = await Shoaib.deploy();

//   Rayyan = await ethers.getContractFactory("Rayyan");
//   rayyan = await Rayyan.deploy();

//   PopUp = await ethers.getContractFactory("PopUp");
//   popUp = await PopUp.deploy();

//   SchoolOfArchPlanning = await ethers.getContractFactory("SchoolOfArchPlanning");
//   schoolOfArchPlanning = await SchoolOfArchPlanning.deploy();

//   SchoolOfLaw = await ethers.getContractFactory("SchoolOfLaw");
//   schoolOfLaw = await SchoolOfLaw.deploy();

//   SchoolOLibArtsHumanities = await ethers.getContractFactory("SchoolOLibArtsHumanities");
//   schoolOLibArtsHumanities = await SchoolOLibArtsHumanities.deploy();

//   SchoolOfArtsDesign = await ethers.getContractFactory("SchoolOfArtsDesign");
//   schoolOfArtsDesign = await SchoolOfArtsDesign.deploy();

//   SchoolOfScience = await ethers.getContractFactory("SchoolOfScience");
//   schoolOfScience = await SchoolOfScience.deploy();

//   SchoolOfBusiness = await ethers.getContractFactory("SchoolOfBusiness");
//   schoolOfBusiness = await SchoolOfBusiness.deploy();

//   SchoolOfTech = await ethers.getContractFactory("SchoolOfTech");
//   schoolOfTech = await SchoolOfTech.deploy();


//   console.log("schoolOfArchPlanningAddress=", `'${schoolOfArchPlanning.address}'`);
//   console.log("schoolOfLawAddrss=", `'${schoolOfLaw.address}'`);
//   console.log("schoolOLibArtsHumanitiesAddress=", `'${schoolOLibArtsHumanities.address}'`); 
//   console.log("schoolOfScienceAddrss=", `'${schoolOfScience.address}'`);
//   console.log("schoolOfArtsDesignAddress=", `'${schoolOfArtsDesign.address}'`);
//   console.log("schoolOfBusinessAddress=", `'${schoolOfBusiness.address}'`);
//   console.log("schoolOfTechAddress=", `'${schoolOfTech.address}'`);

//   console.log("shoaibAddress=", `'${shoaib.address}'`);
//   console.log("rayyanAddrss=", `'${rayyan.address}'`);
//   console.log("popUpAddress=", `'${popUp.address}'`);

// }

// /*
//   npx hardhat run --network localhost scripts/deployToken.js
//   */

// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });

const fs = require("fs");
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

  SchoolOfArchPlanning = await ethers.getContractFactory("SchoolOfArchPlanning");
  schoolOfArchPlanning = await SchoolOfArchPlanning.deploy();

  SchoolOfLaw = await ethers.getContractFactory("SchoolOfLaw");
  schoolOfLaw = await SchoolOfLaw.deploy();

  SchoolOLibArtsHumanities = await ethers.getContractFactory("SchoolOLibArtsHumanities");
  schoolOLibArtsHumanities = await SchoolOLibArtsHumanities.deploy();

  SchoolOfArtsDesign = await ethers.getContractFactory("SchoolOfArtsDesign");
  schoolOfArtsDesign = await SchoolOfArtsDesign.deploy();

  SchoolOfScience = await ethers.getContractFactory("SchoolOfScience");
  schoolOfScience = await SchoolOfScience.deploy();

  SchoolOfBusiness = await ethers.getContractFactory("SchoolOfBusiness");
  schoolOfBusiness = await SchoolOfBusiness.deploy();

  SchoolOfTech = await ethers.getContractFactory("SchoolOfTech");
  schoolOfTech = await SchoolOfTech.deploy();

  // minting to sender
  // await tether.connect(owner).mint(signer2.address, ethers.utils.parseEther("100000"));
  // await usdc.connect(owner).mint(signer2.address, ethers.utils.parseEther("100000"));
  // await wrappedBitcoin.connect(owner).mint(signer2.address, ethers.utils.parseEther("100000"));
  // await schoolOfArchPlanning.connect(owner).mint(signer2.address, ethers.utils.parseEther("100000"));
  // await schoolOfLaw.connect(owner).mint(signer2.address, ethers.utils.parseEther("100000"));
  // await schoolOLibArtsHumanities.connect(owner).mint(signer2.address, ethers.utils.parseEther("100000"));
  // await schoolOfArtsDesign.connect(owner).mint(signer2.address, ethers.utils.parseEther("100000"));
  // await schoolOfScience.connect(owner).mint(signer2.address, ethers.utils.parseEther("100000"));
  // await schoolOfBusiness.connect(owner).mint(signer2.address, ethers.utils.parseEther("100000"));
  // await schoolOfTech.connect(owner).mint(signer2.address, ethers.utils.parseEther("100000"));

  // record addresses
  let addresses = [
    `NEXT_PUBLIC_USDC_ADDRESS=${usdc.address}`,
    `NEXT_PUBLIC_TETHER_ADDRESS=${tether.address}`,
    `NEXT_PUBLIC_WRAPPED_BITCOIN_ADDRESS=${wrappedBitcoin.address}`,
    `NEXT_PUBLIC_SCHOOL_OF_ARCH_PLANNING_ADDRESS=${schoolOfArchPlanning.address}`,
    `NEXT_PUBLIC_SCHOOL_OF_LAW_ADDRESS=${schoolOfLaw.address}`,
    `NEXT_PUBLIC_SCHOOL_OF_ARTS_HUMANITIES_ADDRESS=${schoolOLibArtsHumanities.address}`,
    `NEXT_PUBLIC_SCHOOL_OF_ARTS_DESIGN_ADDRESS=${schoolOfArtsDesign.address}`,
    `NEXT_PUBLIC_SCHOOL_OF_SCIENCE_ADDRESS=${schoolOfScience.address}`,
    `NEXT_PUBLIC_SCHOOL_OF_BUSINESS_ADDRESS=${schoolOfBusiness.address}`,
    `NEXT_PUBLIC_SCHOOL_OF_TECH_ADDRESS=${schoolOfTech.address}`,
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
        SchoolOfArchPlanning: schoolOfArchPlanning.address,
        SchoolOfLaw: schoolOfLaw.address,
        SchoolOLibArtsHumanities: schoolOLibArtsHumanities.address,
        SchoolOfArtsDesign: schoolOfArtsDesign.address,
        SchoolOfScience: schoolOfScience.address,
        SchoolOfBusiness: schoolOfBusiness.address,
        SchoolOfTech: schoolOfTech.address
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

