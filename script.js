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
        // Use consistent key: saveupSavings
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
// --- END Data Persistence ---


// --- UI Update Functions ---
function updateUI() {
    const { targetAmount, savedAmount } = savingsGoal;

    // 1. Progress Bar Update
    const progressPercentage = targetAmount > 0 
        ? Math.min(100, (savedAmount / targetAmount) * 100) 
        : 0;
    
    progressBar.style.width = `${progressPercentage.toFixed(1)}%`;
    savedAmountDisplay.textContent = savedAmount.toLocaleString('en-IN');
    goalAmountDisplay.textContent = targetAmount.toLocaleString('en-IN');
    progressPercentageDisplay.textContent = `${progressPercentage.toFixed(1)}%`;
    
    // 2. Weekly Target Update
    if (savingsGoal.deadline && targetAmount > 0) {
        const weeksLeft = calculateWeeksLeft();
        const neededToSave = targetAmount - savedAmount;
        
        const weeklyTarget = weeksLeft > 0 
            ? Math.ceil(neededToSave / weeksLeft)
            : 0; 

        weeklyTargetDisplay.textContent = Math.max(0, weeklyTarget).toLocaleString('en-IN');
    }

    // 3. Update History and Insights
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
        
        const methodIcon = contribution.method === 'cash' ? 'dollar-sign' : 'credit-card';
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

// --- UPI Tax Exposure Insight ---
function calculateUpiExposure() {
    const cashContributions = savingsGoal.contributions.filter(c => c.method === 'cash');
    const upiContributions = savingsGoal.contributions.filter(c => c.method === 'upi');

    const totalCashAmount = cashContributions.reduce((sum, c) => sum + c.amount, 0);
    const totalUpiAmount = upiContributions.reduce((sum, c) => sum + c.amount, 0);
    
    const cashCount = cashContributions.length;
    const upiCount = upiContributions.length;

    if (cashCount < 3 || upiCount < 3) {
        upiExposureDisplay.innerHTML = 'Log at least 3 drops of **Cash** and **UPI** to unlock your personal savings insight.';
        return;
    }

    const avgCash = totalCashAmount / cashCount;
    const avgUpi = totalUpiAmount / upiCount;
    const diff = Math.abs(avgCash - avgUpi);

    let message;
    if (avgCash > avgUpi) {
        message = `<span class="text-growth-green font-semibold">Cash drops are larger!</span> You save an average of ₹${diff.toFixed(0)} more per drop when using cash. Stop the digital leak!`;
    } else if (avgUpi > avgCash) {
        message = `<span class="text-gray-300 font-semibold">UPI drops are larger!</span> You save an average of ₹${diff.toFixed(0)} more per drop when using UPI.`;
    } else {
        message = 'Your savings averages are consistent across both methods. Great discipline!';
    }

    upiExposureDisplay.innerHTML = message;
}
// --- END UPI Tax Exposure Insight ---


// --- Gemini Motivation Logic ---
const API_MODEL = 'gemini-2.5-flash-preview-09-2025';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${API_MODEL}:generateContent?key=`;
const apiKey = ""; // Canvas will provide this

async function fetchWithBackoff(payload, maxRetries = 5) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(API_URL + apiKey, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                return response.json();
            }
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
    throw new Error('API request failed after multiple retries.');
}

async function generateMotivation() {
    if (savingsGoal.targetAmount === 0) {
        motivationMessageDisplay.innerHTML = "Set your goal first to unlock personalized motivation!";
        return;
    }

    const progress = (savingsGoal.savedAmount / savingsGoal.targetAmount) * 100;
    const target = savingsGoal.targetAmount.toLocaleString('en-IN');
    const saved = savingsGoal.savedAmount.toLocaleString('en-IN');
    const weeksLeft = Math.floor(calculateWeeksLeft());
    const weeklyTarget = weeklyTargetDisplay.textContent;

    const userQuery = `You are an encouraging and relatable financial coach for an Indian college student. Their goal is ₹${target} (a micro-goal) and they have saved ₹${saved}, reaching ${progress.toFixed(1)}% completion with ${weeksLeft} weeks remaining. Their weekly savings target is ${weeklyTarget}. Generate a concise, single-paragraph motivational message (1-2 sentences max) in an inspiring tone that encourages them to stick to the weekly target and achieve their goal. Focus on the final reward.`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: {
            parts: [{ text: "Act as a positive, relatable financial coach." }]
        }
    };

    motivationLoading.classList.remove('hidden');
    generateMotivationBtn.disabled = true;
    motivationMessageDisplay.classList.add('italic');
    motivationMessageDisplay.textContent = '...Generating personalized encouragement...';

    try {
        const result = await fetchWithBackoff(payload);
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "Couldn't generate a message, but you've got this!";
        
        motivationMessageDisplay.textContent = text;
        motivationMessageDisplay.classList.remove('italic');

    } catch (error) {
        console.error("Gemini API Error:", error);
        motivationMessageDisplay.textContent = "Oops! Couldn't connect to the motivation service. Check your connection or try again later.";
    } finally {
        motivationLoading.classList.add('hidden');
        generateMotivationBtn.disabled = false;
    }
}
// --- END Gemini Motivation Logic ---


// --- Event Handlers ---
function handleGoalSubmit() {
    const targetAmount = parseFloat(targetAmountInput.value);
    const deadline = deadlineInput.value;
    
    if (isNaN(targetAmount) || targetAmount <= 0) {
        console.error('Please enter a valid target amount.');
        return;
    }
    
    if (!deadline || new Date(deadline) < new Date()) {
        console.error('Please select a future deadline.');
        return;
    }
    
    const isNewGoal = savingsGoal.targetAmount === 0;
    
    savingsGoal.targetAmount = targetAmount;
    savingsGoal.deadline = deadline;
    
    if (isNewGoal) {
        savingsGoal.savedAmount = 0;
        savingsGoal.contributions = [];
        motivationMessageDisplay.textContent = "Click below to get a personalized boost! ✨";
    }

    saveData();
    showDashboard();
    updateUI();
}

function handleAddContribution(amount, method) {
    if (savingsGoal.targetAmount === 0) {
        console.error('Please set a savings goal first.');
        return;
    }
    
    if (amount <= 0) {
        console.error('Amount must be positive.');
        return;
    }
    
    savingsGoal.savedAmount += amount;
    savingsGoal.contributions.push({
        amount,
        method,
        date: new Date().toISOString()
    });
    
    saveData();
    updateUI();
}

// Event Listeners Setup
document.addEventListener('DOMContentLoaded', init);

// Event listener for setting the initial goal
setGoalBtn.addEventListener('click', handleGoalSubmit);

// Event listener for editing the goal
editGoalBtn.addEventListener('click', () => {
    targetAmountInput.value = savingsGoal.targetAmount;
    deadlineInput.value = savingsGoal.deadline;
    showGoalView();
});

// Event listener for manual contribution button
addContributionBtn.addEventListener('click', () => {
    const amount = parseFloat(contributionAmountInput.value);
    const method = cashRadio.checked ? 'cash' : 'upi';
    
    if (!isNaN(amount) && amount > 0) {
        handleAddContribution(amount, method);
        contributionAmountInput.value = ''; // Clear input field
    } else {
        console.error('Invalid contribution amount.');
    }
});

// Event listener for Quick Add buttons
quickAddBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const amount = parseFloat(btn.dataset.amount);
        // Quick Add contributions are assumed to be Cash (positive behavioral reinforcement)
        // This is a deliberate choice to encourage the "Cash" savings behavior.
        handleAddContribution(amount, 'cash'); 
    });
});

// Event listener for Gemini Motivation button
generateMotivationBtn.addEventListener('click', generateMotivation);

// --- View Switching ---
function showDashboard() {
    goalView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
}

function showGoalView() {
    goalView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
}
