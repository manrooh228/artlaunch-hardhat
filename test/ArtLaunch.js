const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ArtLaunch Comprehensive Tests", function () {
  let artToken, artLaunch, owner, donor, attacker;

  beforeEach(async function () {
    [owner, donor, attacker] = await ethers.getSigners();

    const ArtToken = await ethers.getContractFactory("ArtToken");
    artToken = await ArtToken.deploy();

    const ArtLaunch = await ethers.getContractFactory("ArtLaunch");
    artLaunch = await ArtLaunch.deploy(await artToken.getAddress());

    await artToken.setMinter(await artLaunch.getAddress());
  });

  describe("1. Campaign Creation", function () {
    it("Should set all campaign parameters correctly", async function () {
      await artLaunch.createCampaign(
        "Indie Game", "Cool RPG", "http://proto", "Dev", ethers.parseEther("5"), 10, 1
      );
      const c = await artLaunch.campaigns(1);
      expect(c.title).to.equal("Indie Game");
      expect(c.fundingGoal).to.equal(ethers.parseEther("5"));
      expect(c.category).to.equal(1); // games
    });
  });

  describe("2. Contributions & Minting", function () {
    it("Should increase amountRaised and mint tokens (1 ETH = 1000 ART)", async function () {
      await artLaunch.createCampaign("Test", "Desc", "URL", "Exp", ethers.parseEther("10"), 1, 0);
      
      const contribution = ethers.parseEther("1");
      await artLaunch.connect(donor).contribute(1, { value: contribution });

      const campaign = await artLaunch.campaigns(1);
      expect(campaign.amountRaised).to.equal(contribution);

      const balance = await artToken.balanceOf(donor.address);
      expect(balance).to.equal(ethers.parseEther("1000"));
    });

    it("Should fail if contribution is 0 ETH", async function () {
      await artLaunch.createCampaign("Fail", "D", "U", "E", ethers.parseEther("10"), 1, 0);
      await expect(
        artLaunch.connect(donor).contribute(1, { value: 0 })
      ).to.be.revertedWith("Send ETH");
    });
  });

  describe("3. Deadline Logic", function () {
    it("Should fail if campaign deadline has passed", async function () {
      await artLaunch.createCampaign("Expired", "D", "U", "E", ethers.parseEther("10"), 1, 0);
      
      await network.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);
      await network.provider.send("evm_mine");

      await expect(
        artLaunch.connect(donor).contribute(1, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Campaign ended");
    });
  });

  describe("4. Goals & Rewards (Thanks)", function () {
    it("Should set goalReached to true when target is hit", async function () {
      await artLaunch.createCampaign("Goal", "D", "U", "E", ethers.parseEther("1"), 1, 0);
      await artLaunch.connect(donor).contribute(1, { value: ethers.parseEther("1") });
      
      const campaign = await artLaunch.campaigns(1);
      expect(campaign.goalReached).to.be.true;
    });

    it("Should allow creator to send thanks after goal is reached", async function () {
      await artLaunch.createCampaign("Thanks", "D", "U", "E", ethers.parseEther("1"), 1, 0);
      await artLaunch.connect(donor).contribute(1, { value: ethers.parseEther("1") });

      await expect(artLaunch.sendThanks(1, "Thank you all!"))
        .to.emit(artLaunch, "GoalAchieved")
        .withArgs(1, "Thank you all!");
    });

    it("Should prevent non-creators from sending thanks", async function () {
      await artLaunch.createCampaign("Security", "D", "U", "E", ethers.parseEther("1"), 1, 0);
      await artLaunch.connect(donor).contribute(1, { value: ethers.parseEther("1") });

      await expect(
        artLaunch.connect(attacker).sendThanks(1, "I am a hacker")
      ).to.be.revertedWith("Only creator");
    });
  });
});