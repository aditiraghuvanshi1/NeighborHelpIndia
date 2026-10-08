// MULTI-SCENARIO DATASET FEATURING 7 LOCALIZED SITUATIONS
const defaultTasks = [
    {
        id: 1,
        title: "Need help fetching medicine from pharmacy",
        desc: "I need someone to pick up my regular blood pressure prescription from Apollo Pharmacy down the street. Walking has been tough with my knee pain this week.",
        location: "Indiranagar, Bengaluru",
        category: "Household",
        isClaimed: false,
        isUrgent: true 
    },
    {
        id: 2,
        title: "Setup smart TV and JioFiber remote",
        desc: "The new internet connection is too confusing. I just need someone to help configure Hotstar and Netflix on the TV so I can watch my evening serials.",
        location: "Andheri West, Mumbai",
        category: "Tech Support",
        isClaimed: false,
        isUrgent: false
    },
    {
        id: 3,
        title: "Lift heavy steel almirah into bedroom",
        desc: "The delivery workers left a heavy Godrej almirah in the entryway. Need 2 minutes of extra muscle help to safely push it into the primary bedroom.",
        location: "Salt Lake, Block CL, Kolkata",
        category: "Heavy Lifting",
        isClaimed: false,
        isUrgent: false
    },
    {
        id: 4,
        title: "Teach digital payment steps for electricity bill",
        desc: "I want to learn how to pay my electricity and water bills using Google Pay or Paytm safely so I don't have to stand in queues at the office.",
        location: "T Nagar, Chennai",
        category: "Tech Support",
        isClaimed: false,
        isUrgent: false
    },
    {
        id: 5,
        title: "Accompaniment to park for evening walk",
        desc: "Recovering from surgery and feeling unsteady. Just looking for a polite neighbor to walk along with me in the local community park for 20 minutes.",
        location: "Sector 15, Rohini, New Delhi",
        category: "Other",
        isClaimed: false,
        isUrgent: false
    },
    {
        id: 6,
        title: "Urgent: Assist carrying heavy water cans",
        desc: "The regular water supply line is under repair. Bought 2 large 20-litre Bisleri bottles but cannot carry them up to the second floor alone.",
        location: "Hazratganj, Lucknow",
        category: "Heavy Lifting",
        isClaimed: false,
        isUrgent: true
    },
    {
        id: 7,
        title: "Help filing physical pension voucher copies",
        desc: "Have a stack of bank receipts and statements that need to be organized chronologically into cardboard file folders for tax documentation tracking.",
        location: "Bani Park, Jaipur",
        category: "Household",
        isClaimed: false,
        isUrgent: false
    }
];

// DATA STATE SYNCHRONIZATION VIA LOCALSTORAGE
let tasks = JSON.parse(localStorage.getItem('indiaNetworkTasks')) || defaultTasks;
let activeProfile = JSON.parse(localStorage.getItem('neighborActiveUser')) || { name: "Guest", role: "helper", coins: 0 };
let leaders = JSON.parse(localStorage.getItem('helperLeaderboard')) || [];

// LIVE GEMINI 1.5 FLASH ENDPOINT HOOK
const GEMINI_API_KEY = "YOUR_FREE_GEMINI_API_KEY_HERE"; // Insert your live key here

const taskForm = document.getElementById('task-form');
const taskBoard = document.getElementById('task-board');
const filterSelect = document.getElementById('filter-select');
const searchInput = document.getElementById('search-input');
const nameDisplay = document.getElementById('display-profile-name');

if (nameDisplay) nameDisplay.innerText = activeProfile.name;

document.addEventListener('DOMContentLoaded', () => {
    syncStateToUI();
    renderTasks();
    initElderMode(); // Keep the winning high-contrast feature active!
});

function saveGlobalState() {
    localStorage.setItem('indiaNetworkTasks', JSON.stringify(tasks));
    localStorage.setItem('neighborActiveUser', JSON.stringify(activeProfile));
    localStorage.setItem('helperLeaderboard', JSON.stringify(leaders));
}

// ELDER ACCESSIBILITY ACCELERATOR PANEL RULES
function initElderMode() {
    const elderBtn = document.getElementById('elder-mode-btn');
    if (!elderBtn) return;

    const isElderActive = localStorage.getItem('elderModeActive') === 'true';
    if (isElderActive) {
        document.body.classList.add('elder-mode');
        elderBtn.innerText = "⚡ Disable Elder Mode (सामान्य फॉन्ट)";
    }

    elderBtn.addEventListener('click', () => {
        const activeState = document.body.classList.toggle('elder-mode');
        localStorage.setItem('elderModeActive', activeState);
        
        if (activeState) {
            elderBtn.innerText = "⚡ Disable Elder Mode (सामान्य फॉन्ट)";
        } else {
            elderBtn.innerText = "⚡ Enable Elder Mode (बड़ा फॉन्ट)";
        }
    });
}

// MITRA COINS WALLET ENGINE & GAME MILESTONE CHECKS
function syncStateToUI() {
    const coinCounter = document.getElementById('karma-score');
    const badgeText = document.getElementById('karma-badge-text');
    const leaderboardBox = document.getElementById('leaderboard-container');

    if (activeProfile.role === 'helper') {
        if (coinCounter) coinCounter.innerText = activeProfile.coins;
        
        let rank = "Getting Started 🌱";
        if (activeProfile.coins >= 50) rank = "Local Helper 🛠️";
        if (activeProfile.coins >= 100) rank = "Neighborhood Hero 🦸‍♂️";
        if (activeProfile.coins >= 200) rank = "Community Legend 👑";
        if (badgeText) badgeText.innerText = rank;

        const ms1 = document.getElementById('ms-1');
        const ms2 = document.getElementById('ms-2');
        const ms3 = document.getElementById('ms-3');

        if (ms1 && activeProfile.coins >= 50) { ms1.className = "unlocked"; ms1.innerText = "✅ 50 Coins: Silver Savior Badge Unlocked!"; }
        if (ms2 && activeProfile.coins >= 100) { ms2.className = "unlocked"; ms2.innerText = "✅ 100 Coins: Community Hero Certificate Ready!"; }
        if (ms3 && activeProfile.coins >= 200) { ms3.className = "unlocked"; ms3.innerText = "✅ 200 Coins: Metro Pass Ride Voucher Active!"; }
    }

    if (activeProfile.role === 'adult' && leaderboardBox) {
        leaderboardBox.innerHTML = '';
        leaders.sort((a,b) => b.coins - a.coins);
        leaders.forEach(lead => {
            const row = document.createElement('div');
            row.className = "leaderboard-row";
            row.innerHTML = `<span><strong>${escapeHTML(lead.name)}</strong> (${lead.badge})</span>
                             <span style="color:#1565c0; font-weight:bold;">🪙 ${lead.coins}</span>`;
            leaderboardBox.appendChild(row);
        });
    }
}

// RE-RENDER TASK FEED USING FILTERS AND SEARCH CRITERIA
function renderTasks() {
    if (!taskBoard) return;
    taskBoard.innerHTML = '';

    const selectedCategory = filterSelect ? filterSelect.value : 'All';
    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let viewableList = tasks.filter(t => {
        const catMatch = (selectedCategory === 'All' || t.category === selectedCategory);
        const searchMatch = (
            t.title.toLowerCase().includes(searchQuery) ||
            t.desc.toLowerCase().includes(searchQuery) ||
            t.location.toLowerCase().includes(searchQuery)
        );
        return catMatch && searchMatch;
    });

    viewableList.sort((a, b) => {
        if (a.isClaimed !== b.isClaimed) return a.isClaimed - b.isClaimed;
        if (a.isUrgent !== b.isUrgent) return b.isUrgent - a.isUrgent;
        return b.id - a.id;
    });

    if (viewableList.length === 0) {
        taskBoard.innerHTML = `<p style="padding:20px; color:#718096; text-align:center;">No requests match your current filters.</p>`;
        return;
    }

    viewableList.forEach(task => {
        const card = document.createElement('article');
        let classes = 'task-card';
        if (task.isClaimed) classes += ' claimed';
        if (!task.isClaimed && task.isUrgent) classes += ' urgent-card';
        card.className = classes;

        let actionMarkup = '';
        if (activeProfile.role === 'helper') {
            actionMarkup = task.isClaimed 
                ? `<button class="btn btn-claimed" disabled>Already Claimed</button>` 
                : `<button class="btn btn-success" onclick="claimTask(${task.id})">I Can Help!</button>`;
        } else {
            actionMarkup = task.isClaimed 
                ? `<span style="color:var(--success-color); font-weight:bold;">Status: Neighbor Arriving 👍</span>` 
                : `<span style="color:#718096; font-style:italic;">Status: Live (Awaiting Helper...)</span>`;
        }

        card.innerHTML = `
            ${(!task.isClaimed && task.isUrgent) ? `<span class="urgent-badge">⚠️ CRITICAL NEED</span>` : ''}
            <h3>${escapeHTML(task.title)}</h3>
            <div class="task-meta">
                <span class="badge">${escapeHTML(task.category)}</span>
                <span class="location-tag">📍 ${escapeHTML(task.location)}</span>
            </div>
            <p>${escapeHTML(task.desc)}</p>
            <div style="margin-top:12px;">${actionMarkup}</div>
        `;
        taskBoard.appendChild(card);
    });
}

// FORM HANDLER INTEGRATED WITH MULTI-LINGUAL GEMINI INTERFACES
if (taskForm) {
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('task-title');
        const desc = document.getElementById('task-desc');
        const loc = document.getElementById('task-location');
        const cat = document.getElementById('task-category');
        const urg = document.getElementById('task-urgent');
        const subBtn = taskForm.querySelector('button[type="submit"]');

        const fallbackTxt = subBtn.innerText;
        subBtn.innerText = "✨ Gemini Safety Guard Processing...";
        subBtn.disabled = true;

        let processedDesc = desc.value;

        if (GEMINI_API_KEY && GEMINI_API_KEY !== "YOUR_FREE_GEMINI_API_KEY_HERE") {
            try {
                // GEMINI AGENT TRANSLATES HINDI/HINGLISH ON THE FLY AND FILTERS AD-SPAM
                const queryPrompt = `You are a translator and safety monitor for an Indian community app. 
                Analyze this request description text: "${desc.value}". 
                It may be typed in English, pure Hindi, or common multi-lingual Hinglish (e.g., "mujhe cylinder uthane me help chahiye").
                Task 1: If it contains crypto spam, commercial ads, explicit sales, scams, or vulgarity, reply with exactly the word "REJECTED".
                Task 2: If it is safe, TRANSLATE it cleanly into proper English so young volunteers can understand it immediately, fix any grammar issues, and make it concise. Reply with ONLY the final polished English description text. Do not include any introductory remarks.`;

                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents: [{ parts: [{ text: queryPrompt }] }] })
                });
                const responseData = await res.json();
                const parseString = responseData.contents[0].parts[0].text.trim();

                if (parseString.includes("REJECTED")) {
                    alert("🚨 Gemini AI Warning: Post flagged as promotional or commercial advertisement. Keep posts focused on community favors!");
                    subBtn.innerText = fallbackTxt;
                    subBtn.disabled = false;
                    return;
                } else {
                    processedDesc = parseString;
                }
            } catch (err) {
                console.error("Gemini translation error, using raw fallback string context:", err);
            }
        }

        const taskObject = {
            id: Date.now(),
            title: title.value,
            desc: processedDesc,
            location: loc.value,
            category: cat.value,
            isClaimed: false,
            isUrgent: urg.checked
        };

        tasks.unshift(taskObject);
        saveGlobalState();
        renderTasks();
        taskForm.reset();

        subBtn.innerText = fallbackTxt;
        subBtn.disabled = false;
    });
}

// WALLET SYSTEM EARNING TRANSACTION SYSTEM
window.claimTask = function(id) {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex !== -1) {
        tasks[taskIndex].isClaimed = true;

        const bonusPayout = tasks[taskIndex].isUrgent ? 25 : 10;
        activeProfile.coins += bonusPayout;

        saveGlobalState();
        syncStateToUI();
        renderTasks();

        const modal = document.getElementById('contact-modal');
        const modalText = document.getElementById('modal-body-text');
        if (modal && modalText) {
            modalText.innerHTML = `You have accepted this task! Please contact the community coordinator line at <strong>+91 98765 43210</strong> to finalize details for <em>"${escapeHTML(tasks[taskIndex].title)}"</em>. <br><br><strong>Earned: +${bonusPayout} Mitra Coins!</strong>`;
            modal.style.display = 'flex';
        }
    }
};

if (filterSelect) filterSelect.addEventListener('change', renderTasks);
if (searchInput) searchInput.addEventListener('input', renderTasks);

const modalClose = document.getElementById('close-modal-btn');
if (modalClose) {
    modalClose.addEventListener('click', () => { document.getElementById('contact-modal').style.display = 'none'; });
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, t => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[t] || t));
}