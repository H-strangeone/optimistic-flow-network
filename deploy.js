
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying OptiFlo contract...");

  // Get the contract factory
  const OptiFlo = await ethers.getContractFactory("OptiFlo");
  
  // Deploy the contract
  const optiflo = await OptiFlo.deploy();
  await optiflo.deployed();

  console.log(`OptiFlo contract deployed to: ${optiflo.address}`);
  console.log(`Update this address in src/utils/ethers.ts`);
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
