# ArtLaunch-hardhat
Platform for artists, indi-games, and other creators

Presentation link -> https://www.canva.com/design/DAHAyTVwjTo/KahIhUUTuRCtI0zbM1iOEA/edit?utm_content=DAHAyTVwjTo&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton 

## Deployment and execution instructions.
### Install packages
npm install
( If problems with openzeppelin 
npm install @openzeppelin/contracts )

### Start hardhat local-server
npx hardhat node

### Deploy contracts
npx hardhat run scripts/deploy.js --network localhost

### Start frontend
npx http-server frontend

### For testing smart contract 
npx hardhat test 



## Overview of the application architecture
The application is a decentralized crowdfunding platform (DApp), consisting of three main levels:

-Smart Contracts (Blockchain): A layer of data storage and business logic. The contracts manage campaigns, accept funds in ETH, and generate events.
-Frontend (UI/UX): An HTML/JavaScript web interface using the ethers library.js for communication with the blockchain.
-Provider/Wallet (MetaMask): A node for network access and transaction signing that ensures the security of user funds.

## Explanation of design and implementation decisions.

Filtering projects by category (Art (We decided to remove it for now, as it requires a different form of filling), Games, Startup)
We thought about adding thank-you notifications, but it led to many setbacks, so we had to cut it from the project.
We wanted to add to the project the ability to fill in our own representation of our product (everyone could customize their own product page in their own way) using the html-css constructor, but we didn't have enough time to implement this.
Notifications and interface updates are implemented through listening to smart contract events in real time.
We have added tokens in the form of rewards from donations, which are planned (not developed) in the future to be used to attract some of them to our own advertising, etc.


## Description of smart contract logic.
Creating campaigns: The createCampaign function initializes the project structure with a set deadline and funding goal.
Funds management: The contribute function accepts ETH and increases the project balance.
Goal tracking: The contract verifies the condition quantraised >= fundingGoal and changes the goalReached flag.

## Explanation of frontend-to-blockchain interaction

Data reading: Using JsonRpcProvider to get a list of all campaigns (campaigns, campaignCount) without having to connect a wallet.
Data Recording (Transactions): Using BrowserProvider and Signer (MetaMask) to create projects and send donations.
Event listeners: The artLaunchContract.on(filter, callback) command allows the application to respond to other users' actions (for example, the appearance of a new donation) instantly.

## Limitations and Future Improvements

The current version of ArtLaunch is a minimum viable product that demonstrates the core functionality of a decentralized crowdfunding platform. Due to limited development time, some planned features were not fully implemented. These include a reward token system for donors, a refund mechanism for unsuccessful campaigns, and customizable project pages for creators. The notification system is currently limited to real-time interface updates based on smart contract events, while more advanced user notifications are planned for future versions. Further improvements include expanding project categories, enhancing security, and deploying the platform to public Ethereum test networks.

## Conclusion 

ArtLaunch demonstrates the practical use of blockchain technology for decentralized crowdfunding. By combining smart contracts, a web-based frontend, and wallet integration, the platform provides a transparent, secure, and intermediary-free solution for creators and supporters.
