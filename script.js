// DOM Elements
const goalView = document.getElementById('goalView');
const dashboardView = document.getElementById('dashboardView');
const setGoalBtn = document.getElementById('setGoalBtn');
const editGoalBtn = document.getElementById('editGoalBtn');
const targetAmountInput = document.getElementById('targetAmount');
const deadlineInput = document.getElementById('deadline');
const savedAmountDisplay = document.getElementById('savedAmount');
const goalAmountDisplay = document.getElementById('goalAmount');
const weeklyTargetDisplay = document.getElementById('weeklyTarget');
const progressBar = document.getElementById('progressBar');
const progressPercentageDisplay = document.getElementById('progressPercentage');
const contributionAmountInput = document.getElementById('contributionAmount');
const addContributionBtn = document.getElementById('addContributionBtn');
const quickAddBtns = document.querySelectorAll('.quick-add-btn');
const contributionsList = document.getElementById('contributionsList');
const cashRadio = document.getElementById('cashRadio');
const upiRadio = document.getElementById('upiRadio');
const upiExposureDisplay = document.getElementById('upiExposure');

// Gemini elements
const generateMotivationBtn = document.getElementById('generateMotivationBtn');
const motivationMessageDisplay = document.getElementById('motivationMessage');
const motivationLoading = document.getElementById('motivationLoading');

// State - Saved in LocalStorage
let savingsGoal = {
    targetAmount: 0,
    deadline: '',
    savedAmount: 0,
    contributions: []
};

// --- PWA Service Worker Registration ---
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').then(registration => {
                console.log('ServiceWorker registration successful for offline capability.');
            }).catch(err => {
                console.error('ServiceWorker registration failed: ', err);
            });
        });
    }
}
// --- END PWA Registration ---

// Initialize the app
function init() {
    registerServiceWorker();
    loadData();
    updateUI();
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    deadlineInput.setAttribute('min', today);
}

// --- Data Persistence (Local Storage) ---
function loadData() {
    try {
        const savedData = localStorage.getItem('saveupSavings');
        if (savedData) {
            savingsGoal = JSON.parse(savedData);
            if (savingsGoal.targetAmount > 0) {
                showDashboard();
            }
        }
    } catch (e) {
        console.error("Error loading data from LocalStorage:", e);
    }
}

function saveData() {
    try {
        localStorage.setItem('saveupSavings', JSON.stringify(savingsGoal));
    } catch (e) {
        console.error("Error saving data to LocalStorage:", e);
    }
}

function updateUI() {
    const { targetAmount, savedAmount } = savingsGoal;
    
    const progressPercentage = targetAmount > 0 ? Math.min(100, (savedAmount / targetAmount) * 100) : 0;
    progressBar.style.width = `${progressPercentage.toFixed(1)}%`;
    savedAmountDisplay.textContent = savedAmount.toLocaleString('en-IN');
    goalAmountDisplay.textContent = targetAmount.toLocaleString('en-IN');
    progressPercentageDisplay.textContent = `${progressPercentage.toFixed(1)}%`;
    
    if (savingsGoal.deadline && targetAmount > 0) {
        const weeksLeft = calculateWeeksLeft();
        const neededToSave = targetAmount - savedAmount;
        const weeklyTarget = weeksLeft > 0 ? Math.ceil(neededToSave / weeksLeft) : 0;
        weeklyTargetDisplay.textContent = Math.max(0, weeklyTarget).toLocaleString('en-IN');
    }
    
    updateContributionsList();
    calculateUpiExposure();
}

function calculateWeeksLeft() {
    if (!savingsGoal.deadline) return 0;
    const deadline = new Date(savingsGoal.deadline);
    const today = new Date();
    if (deadline < today) return 0;
    const timeDiff = deadline - today;
    const daysLeft = timeDiff / (1000 * 60 * 60 * 24);
    return Math.max(0, daysLeft / 7);
}

function updateContributionsList() {
    const recentContributions = [...savingsGoal.contributions].reverse().slice(0, 5);
    
    if (recentContributions.length === 0) {
        contributionsList.innerHTML = '<p class="text-gray-400 text-center py-4">No contributions yet</p>';
        return;
    }
    
    contributionsList.innerHTML = '';
    recentContributions.forEach(contribution => {
        const contributionItem = document.createElement('div');
        contributionItem.className = 'bg-gray-700 rounded-lg p-3 flex justify-between items-center contribution-item';
        
        // CHANGED: Use 'circle' instead of 'dollar-sign' for cash
        const methodIcon = contribution.method === 'cash' ? 'circle' : 'credit-card';
        const methodColor = contribution.method === 'cash' ? 'text-growth-green' : 'text-gray-400';
        
        contributionItem.innerHTML = `
            <div class="flex items-center">
                <i data-feather="${methodIcon}" class="w-5 h-5 mr-3 ${methodColor}"></i>
                <div>
                    <p class="font-medium">₹${contribution.amount.toLocaleString('en-IN')}</p>
                    <p class="text-xs text-gray-400">${new Date(contribution.date).toLocaleDateString()}</p>
                </div>
            </div>
            <div class="text-xs text-gray-300">
                ${contribution.method.toUpperCase()}
            </div>
        `;
        
        contributionsList.appendChild(contributionItem);
    });
    
    feather.replace();
}

function calculateUpiExposure() {
    const cashContributions = savingsGoal.contributions.filter(c => c.method === 'cash');
    const upiContributions = savingsGoal.contributions.filter(c => c.method === 'upi');
    
    if (cashContributions.length === 0 && upiContributions.length === 0) {
        upiExposureDisplay.innerHTML = 'Log some contributions to see if Cash or UPI helps you save more!';
        return;
    }
    
    const cashAvg = cashContributions.length > 0 
        ? cashContributions.reduce((sum, c) => sum + c.amount, 0) / cashContributions.length 
        : 0;
    const upiAvg = upiContributions.length > 0 
        ? upiContributions.reduce((sum, c) => sum + c.amount, 0) / upiContributions.length 
        : 0;
    
    if (cashAvg > upiAvg && cashContributions.length > 0) {
        const diff = cashAvg - upiAvg;
        upiExposureDisplay.innerHTML = `<span class="font-semibold text-growth-green">Cash drops are larger!</span> You save an average of ₹${diff.toFixed(0)} more per drop when using cash. Stay cash-strong! 💪`;
    } else if (upiAvg > cashAvg && upiContributions.length > 0) {
        const diff = upiAvg - cashAvg;
        upiExposureDisplay.innerHTML = `<span class="font-semibold text-growth-green">UPI drops are larger!</span> You save an average of ₹${diff.toFixed(0)} more per drop when using UPI.`;
    } else {
        upiExposureDisplay.innerHTML = 'Your cash and UPI contributions are balanced!';
    }
}

// Gemini API Configuration
const API_MODEL = 'gemini-1.5-flash';
const API_BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${API_MODEL}:generateContent?key=`;
const apiKey = 'YOUR_API_KEY_HERE';

async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    throw new Error('All retry attempts failed');
}

async function generateMotivation() {
    const { targetAmount, savedAmount, deadline } = savingsGoal;
    const progress = (savedAmount / targetAmount) * 100;
    const weeksLeft = calculateWeeksLeft();
    const weeklyTarget = Math.ceil((targetAmount - savedAmount) / weeksLeft);
    
    const prompt = `You are a motivational coach with a witty, supportive tone tailored for young Indian college students saving money. Use relatable Indian context, humor, and slang where appropriate.

Context: A college student is trying to save money using a micro-savings approach for an Indian college student. Their goal is ₹${targetAmount} (a micro-goal) and they have saved ₹${saved}, reaching ${progress.toFixed(1)}% completion with ${weeksLeft} weeks remaining. Their weekly savings target is ${weeklyTarget}. Generate a concise, single-paragraph motivational message (2-3 sentences max) that:
- Acknowledges their progress with humor or praise
- Gently nudges them to keep going
- Uses conversational, friendly tone
- Optionally references Indian college life, chai, samosas, or relatable scenarios

Keep it SHORT, punchy, and authentic. No generic corporate speak.`;

    try {
        motivationLoading.classList.remove('hidden');
        generateMotivationBtn.disabled = true;
        
        const data = await fetchWithRetry(API_BASE_URL + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        
        const message = data.candidates[0].content.parts[0].text;
        motivationMessageDisplay.textContent = message;
        motivationMessageDisplay.classList.add('fade-in');
        
    } catch (error) {
        console.error('Error generating motivation:', error);
        motivationMessageDisplay.textContent = "Couldn't fetch motivation right now, but you're doing great! Keep those drops coming! 💪";
    } finally {
        motivationLoading.classList.add('hidden');
        generateMotivationBtn.disabled = false;
    }
}

function showDashboard() {
    goalView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
}

function showGoalView() {
    goalView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
}

function addContribution(amount, method) {
    if (amount <= 0 || isNaN(amount)) {
        alert('Please enter a valid amount');
        return;
    }
    
    const contribution = {
        amount: parseFloat(amount),
        method: method,
        date: new Date().toISOString()
    };
    
    savingsGoal.contributions.push(contribution);
    savingsGoal.savedAmount += contribution.amount;
    
    saveData();
    updateUI();
    
    contributionAmountInput.value = '';
}

// Event Listeners
setGoalBtn.addEventListener('click', () => {
    const targetAmount = parseFloat(targetAmountInput.value);
    const deadline = deadlineInput.value;
    
    if (!targetAmount || targetAmount <= 0) {
        alert('Please enter a valid target amount');
        return;
    }
    
    if (!deadline) {
        alert('Please select a deadline');
        return;
    }
    
    savingsGoal.targetAmount = targetAmount;
    savingsGoal.deadline = deadline;
    savingsGoal.savedAmount = 0;
    savingsGoal.contributions = [];
    
    saveData();
    showDashboard();
    updateUI();
});

editGoalBtn.addEventListener('click', () => {
    targetAmountInput.value = savingsGoal.targetAmount;
    deadlineInput.value = savingsGoal.deadline;
    showGoalView();
});

addContributionBtn.addEventListener('click', () => {
    const amount = parseFloat(contributionAmountInput.value);
    const method = cashRadio.checked ? 'cash' : 'upi';
    addContribution(amount, method);
});

quickAddBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const amount = parseFloat(btn.dataset.amount);
        const method = cashRadio.checked ? 'cash' : 'upi';
        addContribution(amount, method);
    });
});

generateMotivationBtn.addEventListener('click', generateMotivation);

// Initialize on page load
init();

