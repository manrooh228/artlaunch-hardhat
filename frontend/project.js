const CONTRACT_ADDRESSES = {
    artLaunch: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
    artToken: "0x0165878A594ca255338adfa4d48449f69242Eb8F"
};

const ARTLAUNCH_ABI = [
    "function campaigns(uint256) view returns (address creator, string title, string description, string prototypeUrl, string imageUrl, string experience, uint256 fundingGoal, uint256 deadline, uint256 amountRaised, uint8 category, bool goalReached, bool thanked)",
    "function contribute(uint256 id) payable",
    "function sendThanks(uint256 id, string message)",
    "function updateImage(uint256 id, string imageUrl)",
    "event GoalAchieved(uint256 id, string message)",
    "event ImageUpdated(uint256 id, string imageUrl)"
];

const ARTTOKEN_ABI = [
    "function balanceOf(address) view returns (uint256)"
];


let provider;
let signer;
let artLaunchContract;
let artTokenContract;
let userAddress;
let campaignId;
let campaign;


window.addEventListener('DOMContentLoaded', async () => {
    if (typeof ethers === 'undefined') {
        console.error('Ethers.js не загружен!');
        alert('error.');
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    campaignId = urlParams.get('id');
    
    if (!campaignId) {
        alert('error fetching id');
        window.location.href = 'index.html';
        return;
    }
    
    await checkWalletConnection();
    setupEventListeners();
    await loadProject();
});





function setupEventListeners() {
    document.getElementById('connectWallet').addEventListener('click', connectWallet);

    const donationAmountInput = document.getElementById('donationAmount');
    if (donationAmountInput) {
        donationAmountInput.addEventListener('input', updateTokenReward);
    }
}

async function checkWalletConnection() {
    if (typeof window.ethereum === 'undefined') {
        console.log('metamask error');
        return;
    }
    
    try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            await connectWallet();
        }
    } catch (error) {
        console.error('Error checking wallet connection:', error);
    }
}





async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        alert('Please download MetaMask!');
        return;
    }
    try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();
        
        artLaunchContract = new ethers.Contract(
            CONTRACT_ADDRESSES.artLaunch,
            ARTLAUNCH_ABI,
            signer
        );
        
        artTokenContract = new ethers.Contract(
            CONTRACT_ADDRESSES.artToken,
            ARTTOKEN_ABI,
            provider
        );
        
        updateWalletUI();
        
        if (campaign) {
            updateProjectUI();
        }
        
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        
    } catch (error) {
        console.error('Error connecting wallet:', error);
        if (error.code === 4001) {
            alert('You canceled');
        } else {
            alert('error: ' + error.message);
        }
    }
}




async function updateWalletUI() {
    const connectBtn = document.getElementById('connectWallet');
    const walletInfo = document.getElementById('walletInfo');
    const addressSpan = document.getElementById('walletAddress');
    const balanceSpan = document.getElementById('artBalance');
    
    connectBtn.classList.add('hidden');
    walletInfo.classList.remove('hidden');
    
    addressSpan.textContent = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
    
    try {
        const balance = await artTokenContract.balanceOf(userAddress);
        const formattedBalance = ethers.formatEther(balance);
        balanceSpan.textContent = `${parseFloat(formattedBalance).toFixed(2)} ART`;
    } catch (error) {
        console.error('Error getting balance:', error);
        balanceSpan.textContent = '0 ART';
    }
}

function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        location.reload();
    } else {
        location.reload();
    }
}



async function loadProject() {
    const projectContent = document.getElementById('projectContent');
    
    try {
        const campaignData = await artLaunchContract.campaigns(campaignId);
        
        // Handle both old and new contract formats
        if (campaignData.length === 12) {
            // New format with imageUrl
            campaign = {
                creator: campaignData[0],
                title: campaignData[1],
                description: campaignData[2],
                prototypeUrl: campaignData[3],
                imageUrl: campaignData[4],
                experience: campaignData[5],
                fundingGoal: campaignData[6],
                deadline: campaignData[7],
                amountRaised: campaignData[8],
                category: campaignData[9],
                goalReached: campaignData[10],
                thanked: campaignData[11]
            };
        } else {
            alert('niggas')
        }
        
        renderProject();
        
    } catch (error) {
        console.error('Error loading project:', error);
        projectContent.innerHTML = '<div class="loading">Ошибка загрузки проекта</div>';
    }
}





function renderProject() {
    const template = document.getElementById('projectTemplate');
    const clone = template.content.cloneNode(true);
    

    const categoryNames = ['Искусство', 'Игры', 'Стартап'];
    const categoryClasses = ['bg-art', 'bg-games', 'bg-startup'];
    const categoryBadge = clone.querySelector('#categoryBadge');
    categoryBadge.textContent = categoryNames[campaign.category];
    categoryBadge.className = `badge ${categoryClasses[campaign.category]}`;
    




    const imageToShow = campaign.imageUrl || campaign.prototypeUrl;
    clone.querySelector('#projectTitle').textContent = campaign.title;
    clone.querySelector('#projectImage').src = imageToShow;
    clone.querySelector('#projectImage').alt = campaign.title;
    clone.querySelector('#creatorAddress').textContent = 
        `${campaign.creator.slice(0, 6)}...${campaign.creator.slice(-4)}`;
    clone.querySelector('#projectDescription').textContent = campaign.description;
    clone.querySelector('#projectExperience').textContent = campaign.experience;
    clone.querySelector('#prototypeLink').href = campaign.prototypeUrl;



    const raised = parseFloat(ethers.formatEther(campaign.amountRaised));
    const goal = parseFloat(ethers.formatEther(campaign.fundingGoal));
    const remaining = Math.max(0, goal - raised);
    const progress = goal > 0 ? (raised / goal) * 100 : 0;
    
    clone.querySelector('#amountRaised').textContent = raised.toFixed(4);
    clone.querySelector('#fundingGoal').textContent = goal.toFixed(4);
    clone.querySelector('#progressFill').style.width = `${Math.min(progress, 100)}%`;
    clone.querySelector('#progressPercent').textContent = progress.toFixed(1);
    clone.querySelector('#remainingAmount').textContent = `${remaining.toFixed(4)} ETH`;




    const now = Math.floor(Date.now() / 1000);
    const deadline = Number(campaign.deadline);
    const daysLeft = Math.max(0, Math.ceil((deadline - now) / 86400));
    const deadlineDate = new Date(deadline * 1000);
    
    clone.querySelector('#daysLeft').textContent = daysLeft;
    clone.querySelector('#deadlineDate').textContent = deadlineDate.toLocaleDateString('ru-RU');

    if (campaign.goalReached) {
        clone.querySelector('#goalReachedBadge').classList.remove('hidden');
    }

    if (campaign.thanked) {
        clone.querySelector('#thankedBadge').classList.remove('hidden');
    }
    
    const projectContent = document.getElementById('projectContent');
    projectContent.innerHTML = '';
    projectContent.appendChild(clone);
    
    updateProjectUI();
    
    setupFormHandlers();
}


function updateProjectUI() {
    const donationSection = document.getElementById('donationSection');
    const campaignEnded = document.getElementById('campaignEnded');
    const thanksSection = document.getElementById('thanksSection');
    
    const now = Math.floor(Date.now() / 1000);
    const deadline = Number(campaign.deadline);
    const isEnded = now >= deadline;
    
    const isCreator = userAddress && 
                     campaign.creator.toLowerCase() === userAddress.toLowerCase();
    
    if (isEnded) {
        donationSection.classList.add('hidden');
        campaignEnded.classList.remove('hidden');
    } else if (userAddress) {
        donationSection.classList.remove('hidden');
        campaignEnded.classList.add('hidden');
    }
    
    if (isCreator && campaign.goalReached && !campaign.thanked) {
        thanksSection.classList.remove('hidden');
    }
}


function setupFormHandlers() {
    const donationForm = document.getElementById('donationForm');
    if (donationForm) {
        donationForm.addEventListener('submit', handleDonation);
    }

    const thanksForm = document.getElementById('thanksForm');
    if (thanksForm) {
        thanksForm.addEventListener('submit', handleSendThanks);
    }
}

function updateTokenReward() {
    const amount = document.getElementById('donationAmount').value;
    const reward = amount ? parseFloat(amount) * 1000 : 0;
    document.getElementById('tokenReward').textContent = reward.toLocaleString();
}



async function handleDonation(e) {
    e.preventDefault();
    
    if (!signer) {
        alert('Connect wallet for donation');
        return;
    }
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        
        const amount = document.getElementById('donationAmount').value;
        const amountWei = ethers.parseEther(amount);
        
        // Send donation
        const tx = await artLaunchContract.contribute(campaignId, {
            value: amountWei
        });
        
        submitBtn.textContent = 'Await for confirmation...';
        await tx.wait();
        
        alert(`Thanks for Donation! You got ${parseFloat(amount) * 1000} ART tokens!`);
        
        // Reload project
        await loadProject();
        await updateWalletUI();
        
    } catch (error) {
        console.error('Error donating:', error);
        alert('Error: ' + (error.reason || error.message));
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}


async function handleSendThanks(e) {
    e.preventDefault();
    
    if (!signer) {
        alert('Connect wallet');
        return;
    }
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        
        const message = document.getElementById('thanksMessage').value;
        
        // Send thanks
        const tx = await artLaunchContract.sendThanks(campaignId, message);
        
        submitBtn.textContent = 'Await of confimation...';
        await tx.wait();
        
        alert('Thank is send!');
        
        // Reload project
        await loadProject();
        
    } catch (error) {
        console.error('Error sending thanks:', error);
        alert('Error: ' + (error.reason || error.message));
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}