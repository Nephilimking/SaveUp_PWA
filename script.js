// === SAVEUP: Full Script with Secure Gemini Proxy ===

// DOM Elements
const goalView = document.getElementById("goalView");
const dashboardView = document.getElementById("dashboardView");
const setGoalBtn = document.getElementById("setGoalBtn");
const editGoalBtn = document.getElementById("editGoalBtn");
const targetAmountInput = document.getElementById("targetAmount");
const deadlineInput = document.getElementById("deadline");
const savedAmountDisplay = document.getElementById("savedAmount");
const goalAmountDisplay = document.getElementById("goalAmount");
const weeklyTargetDisplay = document.getElementById("weeklyTarget");
const progressBar = document.getElementById("progressBar");
const progressPercentageDisplay = document.getElementById("progressPercentage");
const contributionAmountInput = document.getElementById("contributionAmount");
const addContributionBtn = document.getElementById("addContributionBtn");
const quickAddBtns = document.querySelectorAll(".quick-add-btn");
const contributionsList = document.getElementById("contributionsList");
const cashRadio = document.getElementById("cashRadio");
const upiRadio = document.getElementById("upiRadio");
const upiExposureDisplay = document.getElementById("upiExposure");
const logoutBtn = document.getElementById("logoutBtn");

// --- AI Analysis Elements ---
const analyzeHabitsBtn = document.getElementById("analyzeHabitsBtn");
const analysisMessageDisplay = document.getElementById("analysisMessage");
const analysisLoading = document.getElementById("analysisLoading");

// --- App State ---
let savingsGoal = {
  targetAmount: 0,
  deadline: "",
  savedAmount: 0,
  contributions: []
};

// === PWA Service Worker ===
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("sw.js")
        .then(() => console.log("ServiceWorker registered successfully."))
        .catch((err) => console.error("ServiceWorker registration failed:", err));
    });
  }
}

// === App Initialization ===
document.addEventListener("DOMContentLoaded", init);

function init() {
  registerServiceWorker();
  loadData();
  updateUI();

  const today = new Date().toISOString().split("T")[0];
  deadlineInput.setAttribute("min", today);

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("saveup_session");
    window.location.href = "login.html";
  });

  document.getElementById("savingsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    handleGoalSubmit();
  });

  editGoalBtn.addEventListener("click", () => {
    targetAmountInput.value = savingsGoal.targetAmount;
    deadlineInput.value = savingsGoal.deadline;
    showGoalView();
  });

  document.getElementById("contributionForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const amount = parseFloat(contributionAmountInput.value);
    const method = cashRadio.checked ? "cash" : "upi";
    handleAddContribution(amount, method);
    contributionAmountInput.value = "";
  });

  quickAddBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const amount = parseFloat(btn.dataset.amount);
      handleAddContribution(amount, "cash");
    });
  });

  analyzeHabitsBtn.addEventListener("click", generateSpendingAnalysis);
}

// === Local Storage ===
function loadData() {
  try {
    const savedData = localStorage.getItem("saveupSavings");
    if (savedData) {
      savingsGoal = JSON.parse(savedData);
      savingsGoal.targetAmount = parseFloat(savingsGoal.targetAmount) || 0;
      savingsGoal.savedAmount = parseFloat(savingsGoal.savedAmount) || 0;
      savingsGoal.contributions = savingsGoal.contributions || [];
      if (savingsGoal.targetAmount > 0) showDashboard();
    }
  } catch (e) {
    console.error("Error loading data:", e);
  }
}

function saveData() {
  try {
    localStorage.setItem("saveupSavings", JSON.stringify(savingsGoal));
  } catch (e) {
    console.error("Error saving data:", e);
  }
}

// === UI Updates ===
function formatRupee(amount) {
  if (isNaN(amount) || amount === null) return "0";
  return amount.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function updateUI() {
  const { targetAmount, savedAmount } = savingsGoal;
  const progress =
    targetAmount > 0 ? Math.min(100, (savedAmount / targetAmount) * 100) : 0;

  progressBar.style.width = `${progress.toFixed(1)}%`;
  savedAmountDisplay.textContent = formatRupee(savedAmount);
  goalAmountDisplay.textContent = formatRupee(targetAmount);
  progressPercentageDisplay.textContent = `${progress.toFixed(1)}%`;

  if (savingsGoal.deadline && targetAmount > 0) {
    const weeksLeft = calculateWeeksLeft();
    const needed = targetAmount - savedAmount;
    const weeklyTarget = weeksLeft > 0 ? Math.ceil(needed / weeksLeft) : 0;
    weeklyTargetDisplay.textContent = formatRupee(Math.max(0, weeklyTarget));
  }

  updateContributionsList();
  calculateUpiExposure();
}

function calculateWeeksLeft() {
  if (!savingsGoal.deadline) return 0;
  const deadline = new Date(savingsGoal.deadline);
  const today = new Date();
  if (deadline < today) return 0;
  const diff = deadline - today;
  return Math.max(0, diff / (1000 * 60 * 60 * 24 * 7));
}

function updateContributionsList() {
  const recent = [...savingsGoal.contributions].reverse().slice(0, 5);

  if (recent.length === 0) {
    contributionsList.innerHTML =
      '<p class="text-gray-400 text-center py-4">No contributions yet</p>';
    return;
  }

  contributionsList.innerHTML = "";
  recent.forEach((c) => {
    const div = document.createElement("div");
    div.className =
      "bg-gray-700 rounded-lg p-3 flex justify-between items-center contribution-item";

    const icon = c.method === "cash" ? "pocket" : "credit-card";
    const color = c.method === "cash" ? "text-growth-green" : "text-gray-400";

    div.innerHTML = `
      <div class="flex items-center">
        <i data-feather="${icon}" class="w-5 h-5 mr-3 ${color}"></i>
        <div>
          <p class="font-medium">₹${formatRupee(c.amount)}</p>
          <p class="text-xs text-gray-400">${new Date(c.date).toLocaleDateString()}</p>
        </div>
      </div>
      <div class="text-xs text-gray-300">${c.method.toUpperCase()}</div>`;
    contributionsList.appendChild(div);
  });

  feather.replace();
}

// === UPI vs Cash Insights ===
function calculateUpiExposure() {
  const cash = savingsGoal.contributions.filter((c) => c.method === "cash");
  const upi = savingsGoal.contributions.filter((c) => c.method === "upi");

  const totalCash = cash.reduce((sum, c) => sum + c.amount, 0);
  const totalUpi = upi.reduce((sum, c) => sum + c.amount, 0);

  const avgCash = cash.length ? totalCash / cash.length : 0;
  const avgUpi = upi.length ? totalUpi / upi.length : 0;

  if (cash.length < 3 || upi.length < 3) {
    upiExposureDisplay.innerHTML = `Log at least 3 contributions of both Cash and UPI. (Current: Cash ${cash.length}/3, UPI ${upi.length}/3)`;
    return;
  }

  const diff = Math.abs(avgCash - avgUpi);
  if (avgCash > avgUpi) {
    upiExposureDisplay.innerHTML = `<span class="font-semibold text-growth-green">Cash drops are larger!</span> You save ₹${diff.toFixed(0)} more per drop when using cash.`;
  } else if (avgUpi > avgCash) {
    upiExposureDisplay.innerHTML = `<span class="font-semibold text-red-500">UPI drops are larger!</span> You save ₹${diff.toFixed(0)} more digitally.`;
  } else {
    upiExposureDisplay.innerHTML = "Your saving averages are balanced. Great discipline!";
  }
}

// === Gemini AI (via backend proxy) ===
const API_URL = "/api/analyze";

async function fetchWithRetry(payload, retries = 3, delay = 1200) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) return await response.json();
      console.error(`Proxy error ${response.status}:`, await response.text());
    } catch (err) {
      console.warn(`Attempt ${i + 1} failed:`, err);
    }
    await new Promise((r) => setTimeout(r, delay));
  }
  throw new Error("All retry attempts failed");
}

// === Spending Analysis ===
async function generateSpendingAnalysis() {
  if (savingsGoal.contributions.length < 5) {
    analysisMessageDisplay.textContent =
      "Log at least 5 contributions first for meaningful AI analysis!";
    return;
  }

  const lastTen = savingsGoal.contributions
    .slice(-10)
    .map(
      (c) =>
        `Amount: ₹${c.amount.toFixed(0)}, Method: ${c.method.toUpperCase()}, Date: ${new Date(
          c.date
        ).toLocaleDateString()}`
    )
    .join("; ");

  const cashVsUpi = upiExposureDisplay.textContent;
  const insightStatus = cashVsUpi.includes("Log at least")
    ? "No behavioral insight yet."
    : cashVsUpi;

  const query = `
Analyze these savings drops and identify one spending leak or a strong saving habit. 
Give one actionable, practical tip in two sentences, starting with 'Forensic Analysis:'.

Insight: ${insightStatus}
Data: ${lastTen}
`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              "You are a concise financial coach for students. Give short, practical insights only."
          }
        ]
      },
      { role: "user", parts: [{ text: query }] }
    ]
  };

  analysisLoading.classList.remove("hidden");
  analyzeHabitsBtn.disabled = true;
  analysisMessageDisplay.classList.add("italic");
  analysisMessageDisplay.textContent = "...Analyzing your savings habits...";

  try {
    const result = await fetchWithRetry(payload);
    const text =
      result.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Analysis inconclusive. Keep logging drops!";
    analysisMessageDisplay.textContent = text;
  } catch (error) {
    console.error("Gemini Proxy Error:", error);
    analysisMessageDisplay.textContent =
      "Oops! Network error during analysis. Try again later.";
  } finally {
    analysisLoading.classList.add("hidden");
    analyzeHabitsBtn.disabled = false;
    analysisMessageDisplay.classList.remove("italic");
  }
}

// === Views ===
function showDashboard() {
  goalView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
  document.getElementById("historyView").classList.remove("hidden");
}

function showGoalView() {
  goalView.classList.remove("hidden");
  dashboardView.classList.add("hidden");
  document.getElementById("historyView").classList.add("hidden");
}

// === Goal Handlers ===
function handleGoalSubmit() {
  const target = parseFloat(document.getElementById("targetAmount").value);
  const deadline = document.getElementById("deadline").value;

  if (!target || target <= 0) return console.error("Enter a valid target amount");
  if (!deadline) return console.error("Select a deadline");

  const newGoal = savingsGoal.targetAmount === 0;
  savingsGoal.targetAmount = target;
  savingsGoal.deadline = deadline;
  if (newGoal) {
    savingsGoal.savedAmount = 0;
    savingsGoal.contributions = [];
  }

  saveData();
  showDashboard();
  updateUI();
}

function handleAddContribution(amount, method) {
  if (amount <= 0 || isNaN(amount)) {
    console.error("Invalid amount");
    return;
  }
  const contribution = {
    amount: parseFloat(amount),
    method,
    date: new Date().toISOString()
  };
  savingsGoal.contributions.push(contribution);
  savingsGoal.savedAmount += contribution.amount;
  saveData();
  updateUI();
}
