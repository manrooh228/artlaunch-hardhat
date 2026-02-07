const CONTRACT_ADDRESSES = {
    artLaunch: "",
    artToken: ""
};

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

// connect wallet
async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        alert('Please download MetaMask!');
        return;
    }

    try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
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
        
        document.getElementById('createSection').classList.remove('hidden');
        
        await loadUserProjects();
        
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Error connecting wallet');
    }
}

// update wallet UI
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
        const formattedBalance = ethers.utils.formatEther(balance);
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

async function loadCampaigns() {
    const grid = document.getElementById('campaignsGrid');
    grid.innerHTML = '<div class="loading">Загрузка проектов...</div>';
    
    try {
        const count = await artLaunchContract.campaignCount();
        
        if (count.toNumber() === 0) {
            grid.innerHTML = '<div class="loading">Пока нет проектов</div>';
            return;
        }
        
        grid.innerHTML = '';
        
        for (let i = 1; i <= count.toNumber(); i++) {
            const campaign = await artLaunchContract.campaigns(i);
            const card = createCampaignCard(i, campaign);
            grid.appendChild(card);
        }
        
        filterCampaigns();
        
    } catch (error) {
        console.error('Error loading campaigns:', error);
        grid.innerHTML = '<div class="loading">Ошибка загрузки проектов</div>';
    }
}

// сreate campaign card
function createCampaignCard(id, campaign) {
    const col = document.createElement('div');
    col.className = 'col-md-4';
    col.dataset.id = id;
    col.dataset.category = campaign.category;
    
    const categoryNames = ['Искусство', 'Игры', 'Стартап'];
    const categoryClasses = ['bg-art', 'bg-games', 'bg-startup'];
    
    const raised = parseFloat(ethers.utils.formatEther(campaign.amountRaised));
    const goal = parseFloat(ethers.utils.formatEther(campaign.fundingGoal));
    const progress = goal > 0 ? (raised / goal) * 100 : 0;
    
    const now = Math.floor(Date.now() / 1000);
    const deadline = campaign.deadline.toNumber();
    const daysLeft = Math.max(0, Math.ceil((deadline - now) / 86400));
    
    col.innerHTML = `
        <div class="card h-100 campaign-card">
            <img src="${campaign.prototypeUrl}" class="card-img-top" alt="${campaign.title}" 
                 style="height: 200px; object-fit: cover;" 
                 onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
            <div class="card-body">
                <span class="badge ${categoryClasses[campaign.category]} mb-2">${categoryNames[campaign.category]}</span>
                <h5 class="card-title">${campaign.title}</h5>
                <p class="card-text text-muted" style="height: 48px; overflow: hidden;">${campaign.description}</p>
                
                <div class="progress mb-2" style="height: 8px;">
                    <div class="progress-bar" style="width: ${Math.min(progress, 100)}%"></div>
                </div>
                
                <div class="d-flex justify-content-between small">
                    <div>
                        <strong>${raised.toFixed(3)} ETH</strong>
                        <div class="text-muted">собрано</div>
                    </div>
                    <div>
                        <strong>${goal.toFixed(3)} ETH</strong>
                        <div class="text-muted">цель</div>
                    </div>
                    <div>
                        <strong>${daysLeft}</strong>
                        <div class="text-muted">дней</div>
                    </div>
                </div>
                ${campaign.goalReached ? '<div class="alert alert-success mt-2 mb-0 py-1 text-center small">goal successed</div>' : ''}
            </div>
        </div>
    `;
    
    col.addEventListener('click', () => {
        window.location.href = `project.html?id=${id}`;
    });
    
    return col;
}

// update section title
function updateSectionTitle() {
    const titles = {
        'all': 'Все проекты',
        '0': 'Проекты: Искусство',
        '1': 'Проекты: Игры',
        '2': 'Проекты: Стартапы'
    };
    document.getElementById('sectionTitle').textContent = titles[currentCategory];
}

async function loadUserProjects() {
    const myProjectsSection = document.getElementById('myProjectsSection');
    const myProjectsList = document.getElementById('myProjectsList');
    
    try {
        const count = await artLaunchContract.campaignCount();
        const userProjects = [];
        
        for (let i = 1; i <= count.toNumber(); i++) {
            const campaign = await artLaunchContract.campaigns(i);
            if (campaign.creator.toLowerCase() === userAddress.toLowerCase()) {
                userProjects.push({ id: i, campaign });
            }
        }
        
        if (userProjects.length > 0) {
            myProjectsSection.classList.remove('hidden');
            myProjectsList.innerHTML = '';
            
            userProjects.forEach(({ id, campaign }) => {
                const card = createCampaignCard(id, campaign);
                myProjectsList.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Error loading user projects:', error);
    }
}

// Handle create campaign
async function handleCreateCampaign(e) {
    e.preventDefault();
    
    if (!signer) {
        alert('Подключите кошелёк');
        return;
    }
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Создание...';
        
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const prototypeUrl = document.getElementById('prototypeUrl').value;
        const experience = document.getElementById('experience').value;
        const fundingGoal = document.getElementById('fundingGoal').value;
        const duration = document.getElementById('duration').value;
        const category = document.getElementById('category').value;
        
        const fundingGoalWei = ethers.utils.parseEther(fundingGoal);
        
        // Create campaign
        const tx = await artLaunchContract.createCampaign(
            title,
            description,
            prototypeUrl,
            experience,
            fundingGoalWei,
            duration,
            category
        );
        
        submitBtn.textContent = 'Ожидание подтверждения...';
        await tx.wait();
        
        alert('Проект успешно создан!');
        form.reset();
        
        // Hide the form and reset toggle button
        const createForm = document.getElementById('createForm');
        const toggleBtn = document.getElementById('toggleCreate');
        createForm.classList.add('hidden');
        toggleBtn.textContent = '➕ Создать проект';
        toggleBtn.classList.remove('btn-secondary');
        toggleBtn.classList.add('btn-success');
        
        // Reload campaigns
        await loadCampaigns();
        await loadUserProjects();
        
    } catch (error) {
        console.error('Error creating campaign:', error);
        alert('Ошибка создания проекта: ' + (error.reason || error.message));
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}



