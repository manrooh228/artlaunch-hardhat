// SPDX-License-Identifier: Adilbek
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
        string prototypeUrl;
        string imageUrl;
        string experience;
        uint256 fundingGoal;
        uint256 deadline;
        uint256 amountRaised;
        Category category;
        bool goalReached;
        bool thanked;
    }
    mapping(uint256 => Campaign) public campaigns;

    mapping(uint256 => address[]) private campaignContributors;
    mapping(uint256 => mapping(address => bool)) private hasContributed;

    event CampaignCreated(uint256 id, string title, uint256 goal);
    event GoalAchieved(uint256 id, string message);
    event ImageUpdated(uint256 id, string imageUrl);
    event ThanksToContributor(uint256 indexed campaignId, address indexed contributor, string message);

    constructor(address _tokenAddress) {
        rewardToken = ArtToken(_tokenAddress);
    }


    function createCampaign(
        string memory title,
        string memory description,
        string memory prototypeUrl,
        string memory imageUrl,
        string memory experience,
        uint256 fundingGoal,
        uint256 durationInDays,
        Category category
    ) public {
        campaignCount++;
        campaigns[campaignCount] = Campaign({
            creator: payable(msg.sender),
            title: title,
            description: description,
            prototypeUrl: prototypeUrl,
            imageUrl: imageUrl,
            experience: experience,
            fundingGoal: fundingGoal,
            deadline: block.timestamp + (durationInDays * 1 days),
            amountRaised: 0,
            category: category,
            goalReached: false,
            thanked: false
        });
        emit CampaignCreated(campaignCount, title, fundingGoal);
    }

    function updateImage(uint256 id, string memory newImageUrl) public {
        Campaign storage c = campaigns[id];
        require(msg.sender == c.creator, "Only creator can update");
        
        c.imageUrl = newImageUrl;
        emit ImageUpdated(id, newImageUrl);
    }


    function contribute(uint256 id) public payable {
        Campaign storage c = campaigns[id];
        //require(block.timestamp < c.deadline, "Campaign ended");
        require(msg.value > 0, "Send ETH");

        c.amountRaised += msg.value;
        
        rewardToken.mint(msg.sender, msg.value * 1000);

        if (c.amountRaised >= c.fundingGoal && !c.goalReached) {
            c.goalReached = true;
            emit GoalAchieved(id, "Funding Goal Reached!");
        }
    }

    function sendThanks(uint256 id, string memory message) public {
        Campaign storage c = campaigns[id];
        require(msg.sender == c.creator, "Only creator");
        require(c.goalReached, "Goal not reached");
        
        c.thanked = true;
        
        emit GoalAchieved(id, message);
        
        address[] memory contributors = campaignContributors[id];
        for (uint256 i = 0; i < contributors.length; i++) {
            emit ThanksToContributor(id, contributors[i], message);
        }
    }

    function getContributors(uint256 id) public view returns (address[] memory) {
        return campaignContributors[id];
    }
    
    function hasUserContributed(uint256 id, address user) public view returns (bool) {
        return hasContributed[id][user];
    }
    
    function getContributorCount(uint256 id) public view returns (uint256) {
        return campaignContributors[id].length;
    }
    
    function getCampaign(uint256 id) public view returns (
        address creator,
        string memory title,
        string memory description,
        string memory prototypeUrl,
        string memory imageUrl,
        string memory experience,
        uint256 fundingGoal,
        uint256 deadline,
        uint256 amountRaised,
        Category category,
        bool goalReached,
        bool thanked
    ) {
        Campaign storage c = campaigns[id];
        return (
            c.creator,
            c.title,
            c.description,
            c.prototypeUrl,
            c.imageUrl,
            c.experience,
            c.fundingGoal,
            c.deadline,
            c.amountRaised,
            c.category,
            c.goalReached,
            c.thanked
        );
    }
}
