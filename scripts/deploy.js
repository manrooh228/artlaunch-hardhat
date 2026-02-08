const hre = require("hardhat");

async function main() {
  
  const ArtToken = await hre.ethers.getContractFactory("ArtToken");
  const token = await ArtToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("ArtToken deployed to:", tokenAddress);

  const ArtLaunch = await hre.ethers.getContractFactory("ArtLaunch");
  const launch = await ArtLaunch.deploy(tokenAddress);
  await launch.waitForDeployment();
  const launchAddress = await launch.getAddress();
  console.log("ArtLaunch deployed to:", launchAddress);


  const tx = await token.setMinter(launchAddress);
  await tx.wait();
  console.log("Minter set to ArtLaunch contract");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
})