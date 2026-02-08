const CONTRACT_ADDRESSES = {
    artLaunch: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    artToken: "0x5FbDB2315678afecb367f032d93F642f64180aa3"
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

let currentCategory = 'all';
let provider;
let signer;
let artLaunchContract;
let artTokenContract;
let userAddress;


window.addEventListener('DOMContentLoaded', async () => {
    
    if (typeof ethers === 'undefined') {
        console.error('Ethers.js не загружен!');
        alert('error.');
        return;
    }
    
    await checkWalletConnection();
    setupEventListeners();
    await loadCampaigns();
});
function setupEventListeners() {
    document.getElementById('connectWallet').addEventListener('click', connectWallet);
    
    document.querySelectorAll('.nav-link[data-category]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.dataset.category;
            updateSectionTitle();
            filterCampaigns();
        }); 
    });
    
    const toggleBtn = document.getElementById('toggleCreate');
    const createForm = document.getElementById('createForm');
    if (toggleBtn && createForm) {
        toggleBtn.addEventListener('click', () => {
            if (!signer) {
                alert('connect wallet!');
                return;
            }
            
            const isHidden = createForm.classList.contains('hidden');
            createForm.classList.toggle('hidden');
            
            if (isHidden) {
                toggleBtn.textContent = 'Cancel';
                toggleBtn.classList.remove('btn-success');
                toggleBtn.classList.add('btn-secondary');
                setTimeout(() => {
                    createForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            } else {
                toggleBtn.textContent = 'Create Project';
                toggleBtn.classList.remove('btn-secondary');
                toggleBtn.classList.add('btn-success');
            }
        });
    }
    
    const campaignForm = document.getElementById('campaignForm');
    if (campaignForm) {
        campaignForm.addEventListener('submit', handleCreateCampaign);
    }
}
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
        
        document.getElementById('createSection').classList.remove('hidden');
        
        await loadUserProjects();
        
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Error connecting wallet');
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

async function loadCampaigns() {
    const grid = document.getElementById('campaignsGrid');
    grid.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-2">Загрузка проектов...</p></div>';
    
    try {
        if (CONTRACT_ADDRESSES.artLaunch === "") {
            grid.innerHTML = '<div class="col-12"><div class="alert alert-warning">No contract entered.</div></div>';
            return;
        }
        
        if (!provider) {
            provider = new ethers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/demo');
            artLaunchContract = new ethers.Contract(
                CONTRACT_ADDRESSES.artLaunch,
                ARTLAUNCH_ABI,
                provider
            );
        }
        
        const count = await artLaunchContract.campaignCount();
        
        if (Number(count) === 0) {
            grid.innerHTML = '<div class="col-12 text-center py-5"><p class="text-muted">Theres no projects!</p></div>';
            return;
        }
        
        grid.innerHTML = '';
        
        // Load each campaign
        for (let i = 1; i <= Number(count); i++) {
            const campaign = await artLaunchContract.campaigns(i);
            const card = createCampaignCard(i, campaign);
            grid.appendChild(card);
        }
        
        filterCampaigns();
        
    } catch (error) {
        console.error('Error loading campaigns:', error);
        grid.innerHTML = `<div class="col-12"><div class="alert alert-danger">❌ Ошибка загрузки проектов: ${error.message}<br><small>Убедитесь, что контракты задеплоены и адреса правильные.</small></div></div>`;
    }
}

// сreate campaign card
function createCampaignCard(id, campaign) {
    const col = document.createElement('div');
    col.className = 'col-md-4';
    col.dataset.id = id;
    col.dataset.category = campaign.category;
    
    const categoryNames = ['Art', 'Games', 'Startup'];
    const categoryClasses = ['bg-art', 'bg-games', 'bg-startup'];
    
    const raised = parseFloat(ethers.formatEther(campaign.amountRaised));
    const goal = parseFloat(ethers.formatEther(campaign.fundingGoal));
    const progress = goal > 0 ? (raised / goal) * 100 : 0;
    
    const now = Math.floor(Date.now() / 1000);
    const deadline = Number(campaign.deadline);
    const daysLeft = Math.max(0, Math.ceil((deadline - now) / 86400));
    
    col.innerHTML = `
        <div class="card h-100 campaign-card">
            <img src="${campaign.prototypeUrl}" class="card-img-top" alt="${campaign.title}" 
                 style="height: 200px; object-fit: cover;" 
                 onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg'">
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
                        <div class="text-muted">collected</div>
                    </div>
                    <div>
                        <strong>${goal.toFixed(3)} ETH</strong>
                        <div class="text-muted">goal</div>
                    </div>
                    <div>
                        <strong>${daysLeft}</strong>
                        <div class="text-muted">day</div>
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

function filterCampaigns() {
    const cards = document.querySelectorAll('#campaignsGrid > div[data-category]');
    cards.forEach(card => {
        if (currentCategory === 'all' || card.dataset.category === currentCategory) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// update section title
function updateSectionTitle() {
    const titles = {
        'all': 'All projects',
        '0': 'Projects: Art',
        '1': 'Projects: Games',
        '2': 'Projects: Startups'
    };
    document.getElementById('sectionTitle').textContent = titles[currentCategory];
}

async function loadUserProjects() {
    const myProjectsSection = document.getElementById('myProjectsSection');
    const myProjectsList = document.getElementById('myProjectsList');
    
    try {
        const count = await artLaunchContract.campaignCount();
        const userProjects = [];
        
        for (let i = 1; i <= Number(count); i++) {
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
        alert('Connect your wallet');
        return;
    }
    
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
        
        const fundingGoalWei = ethers.parseEther(fundingGoal);
        
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
        
        submitBtn.textContent = 'Acception await...';
        await tx.wait();
        
        alert('Success!');
        form.reset();
        
        // Hide the form and reset toggle button
        const createForm = document.getElementById('createForm');
        const toggleBtn = document.getElementById('toggleCreate');
        createForm.classList.add('hidden');
        toggleBtn.textContent = 'Create';
        toggleBtn.classList.remove('btn-secondary');
        toggleBtn.classList.add('btn-success');
        
        // Reload campaigns
        await loadCampaigns();
        await loadUserProjects();
        
    } catch (error) {
        console.error('Error creating campaign:', error);
        alert('Error: ' + (error.reason || error.message));
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}



