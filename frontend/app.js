const CONTRACT_ADDRESSES = {
    artLaunch: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    artToken: "0x5FbDB2315678afecb367f032d93F642f64180aa3"
};

//Адильбек Осыган Функции дополни пж
const ARTLAUNCH_ABI = [
    "function campaignCount() view returns (uint256)",
    "function campaigns(uint256) view returns (address creator, string title, string description, string prototypeUrl, string experience, uint256 fundingGoal, uint256 deadline, uint256 amountRaised, uint8 category, bool goalReached, bool thanked)",
    "function createCampaign(string title, string description, string prototypeUrl, string experience, uint256 fundingGoal, uint256 durationInDays, uint8 category)",
    "function contribute(uint256 id) payable",
    "event CampaignCreated(uint256 id, string title, uint256 goal)",
    "event GoalAchieved(uint256 id, string message)"
];

const ARTTOKEN_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)"
];

let provider;
let signer;
let artLaunchContract;
let artTokenContract;
let userAddress;


window.addEventListener('DOMContentLoaded', async () => {
    await checkWalletConnection();
    setupEventListeners();
    await loadCampaigns();
});

async function checkWalletConnection() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await connectWallet();
            }
        } catch (error) {
            console.error('Error checking wallet connection:', error);
        }
    }
}

// Handle create campaign
async function handleCreateCampaign(e) {
    // e.preventDefault();
    
    // if (!signer) {
    //     alert('Connect your wallet');
    //     return;
    // }
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creation...';
        
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const prototypeUrl = document.getElementById('prototypeUrl').value;
        const experience = document.getElementById('experience').value;
        const fundingGoal = document.getElementById('fundingGoal').value;
        const duration = document.getElementById('duration').value;
        const category = document.getElementById('category').value;
        
        //converting currency of goal//

        
        //create campaign//
        
        
        
        const createForm = document.getElementById('createForm');
        const toggleBtn = document.getElementById('toggleCreate');
        createForm.classList.add('hidden');
        toggleBtn.textContent = 'Create Project';
        toggleBtn.classList.remove('btn-secondary');
        toggleBtn.classList.add('btn-success');
        
        
    } catch (error) {
        // console.error('Error creating campaign:', error);
        // alert('error: ' + (error.reason || error.message));
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}


