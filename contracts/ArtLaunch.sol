// SPDX-License-Identifier: Adil
pragma solidity ^0.8.20;

import "./ArtToken.sol";

contract ArtLaunch {
    ArtToken public rewardToken;
    uint256 public campaignCount;

    enum Category { Art, Games, Startup }

    struct Campaign {
        address payable creator;
        string title;
        string description;
        string prototypeUrl; // Ссылка на изображение/прототип
        string experience;   // Опыт автора/компании
        uint256 fundingGoal; // Цель в wei 
        uint256 deadline;    // Срок 
        uint256 amountRaised;
        Category category;
        bool goalReached;
        bool thanked;
    }

    mapping(uint256 => Campaign) public campaigns;
    
    event CampaignCreated(uint256 id, string title, uint256 goal);
    event GoalAchieved(uint256 id, string message);

    constructor(address _tokenAddress) {
        rewardToken = ArtToken(_tokenAddress);
    }

    // Создание кампании 
    function createCampaign(
        string memory _title,
        string memory _description,
        string memory _prototypeUrl,
        string memory _experience,
        uint256 _fundingGoal,
        uint256 _durationInDays,
        Category _category
    ) public {
        campaignCount++;
        campaigns[campaignCount] = Campaign({
            creator: payable(msg.sender),
            title: _title,
            description: _description,
            prototypeUrl: _prototypeUrl,
            experience: _experience,
            fundingGoal: _fundingGoal,
            deadline: block.timestamp + (_durationInDays * 1 days),
            amountRaised: 0,
            category: _category,
            goalReached: false,
            thanked: false
        });
        emit CampaignCreated(campaignCount, _title, _fundingGoal);
    }

    // Взнос и автоматическая выдача токенов
    function contribute(uint256 _id) public payable {
        Campaign storage c = campaigns[_id];
        require(block.timestamp < c.deadline, "Campaign ended");
        require(msg.value > 0, "Send ETH");

        c.amountRaised += msg.value;
        
        // 1000 ART
        rewardToken.mint(msg.sender, msg.value * 1000);

        if (c.amountRaised >= c.fundingGoal) {
            c.goalReached = true;
        }
    }

    // Функция благодарности при достижении цели
    function sendThanks(uint256 _id, string memory _message) public {
        Campaign storage c = campaigns[_id];
        require(msg.sender == c.creator, "Only creator");
        require(c.goalReached, "Goal not reached");
        
        c.thanked = true;
        emit GoalAchieved(_id, _message);
    }
}