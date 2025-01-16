async function main() {
  const [owner] = await ethers.getSigners();


  Shoaib = await ethers.getContractFactory("Shoaib");
  shoaib = await Shoaib.deploy();

  Rayyan = await ethers.getContractFactory("Rayyan");
  rayyan = await Rayyan.deploy();

  PopUp = await ethers.getContractFactory("PopUp");
  popUp = await PopUp.deploy();

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


  console.log("schoolOfArchPlanningAddress=", `'${schoolOfArchPlanning.address}'`);
  console.log("schoolOfLawAddrss=", `'${schoolOfLaw.address}'`);
  console.log("schoolOLibArtsHumanitiesAddress=", `'${schoolOLibArtsHumanities.address}'`); 
  console.log("schoolOfScienceAddrss=", `'${schoolOfScience.address}'`);
  console.log("schoolOfArtsDesignAddress=", `'${schoolOfArtsDesign.address}'`);
  console.log("schoolOfBusinessAddress=", `'${schoolOfBusiness.address}'`);
  console.log("schoolOfTechAddress=", `'${schoolOfTech.address}'`);

  console.log("shoaibAddress=", `'${shoaib.address}'`);
  console.log("rayyanAddrss=", `'${rayyan.address}'`);
  console.log("popUpAddress=", `'${popUp.address}'`);

}

/*
  npx hardhat run --network localhost scripts/deployToken.js
  */

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
