// MULTI-SCENARIO DEFAULT DATASET
const defaultTasks = [
    {
        id: "task-1",
        title: "Need help fetching medicine from pharmacy",
        desc: "I need someone to pick up my regular blood pressure prescription from Apollo Pharmacy down the street. Walking has been tough with my knee pain this week.",
        location: "Indiranagar, Bengaluru",
        category: "Household",
        status: "open", // 'open' | 'pending_approval' | 'in_progress' | 'completed'
        isUrgent: true,
        helperName: null,
        friendlyRating: null
    },
    {
        id: "task-2",
        title: "Setup smart TV and JioFiber remote",
        desc: "The new internet connection is too confusing. I just need someone to help configure Hotstar and Netflix on the TV so I can watch my evening serials.",
        location: "Andheri West, Mumbai",
        category: "Tech Support",
        status: "open",
        isUrgent: false,
        helperName: null,
        friendlyRating: null
    },
    {
        id: "task-3",
        title: "Lift heavy steel almirah into bedroom",
        desc: "The delivery workers left a heavy Godrej almirah in the entryway. Need 2 minutes of extra muscle help to safely push it into the primary bedroom.",
        location: "Salt Lake, Block CL, Kolkata",
        category: "Heavy Lifting",
        status: "open",
        isUrgent: false,
        helperName: null,
        friendlyRating: null
    },
    {
        id: "task-4",
        title: "Teach digital payment steps for electricity bill",
        desc: "I want to learn how to pay my electricity and water bills using Google Pay or Paytm safely so I don't have to stand in queues at the office.",
        location: "T Nagar, Chennai",
        category: "Tech Support",
        status: "open",
        isUrgent: false,
        helperName: null,
        friendlyRating: null
    },
    {
        id: "task-5",
        title: "Accompaniment to park for evening walk",
        desc: "Recovering from surgery and feeling unsteady. Just looking for a polite neighbor to walk along with me in the local community park for 20 minutes.",
        location: "Sector 15, Rohini, New Delhi",
        category: "Other",
        status: "open",
        isUrgent: false,
        helperName: null,
        friendlyRating: null
    },
    {
        id: "task-6",
        title: "Urgent: Assist carrying heavy water cans",
        desc: "The regular water supply line is under repair. Bought 2 large 20-litre Bisleri bottles but cannot carry them up to the second floor alone.",
        location: "Hazratganj, Lucknow",
        category: "Heavy Lifting",
        status: "open",
        isUrgent: true,
        helperName: null,
        friendlyRating: null
    },
    {
        id: "task-7",
        title: "Help filing physical pension voucher copies",
        desc: "Have a stack of bank receipts and statements that need to be organized chronologically into cardboard file folders for tax documentation tracking.",
        location: "Bani Park, Jaipur",
        category: "Household",
        status: "open",
        isUrgent: false,
        helperName: null,
        friendlyRating: null
    }
];

// DETERMINE PAGE ROLE ISOLATION
const PAGE_ROLE = document.body.getAttribute('data-page-role') || (window.location.pathname.includes('adult') ? 'adult' : 'helper');

function getActiveProfile() {
    if (PAGE_ROLE === 'adult') {
        return JSON.parse(localStorage.getItem('neighborAdultUser')) || { name: "Elder Seeker", role: "adult" };
    } else {
        return JSON.parse(localStorage.getItem('neighborHelperUser')) || { name: "Volunteer Helper", role: "helper", coins: 0 };
    }
}

let activeProfile = getActiveProfile();

function getStoredTasks() {
    try {
        const stored = JSON.parse(localStorage.getItem('indiaNetworkTasks'));
        if (Array.isArray(stored) && stored.length > 0) {
            return stored.map((t, idx) => ({
                id: String(t.id || `task-${idx + 1}`),
                title: t.title || "Community Request",
                desc: t.desc || "",
                location: t.location || "Nearby",
                category: t.category || "Other",
                status: t.status || (t.isClaimed ? "completed" : "open"),
                isUrgent: Boolean(t.isUrgent),
                helperName: t.helperName || null,
                friendlyRating: t.friendlyRating || null
            }));
        }
    } catch (e) {
        console.warn("Storage read fallback:", e);
    }
    return defaultTasks;
}

let tasks = getStoredTasks();

let leaders = JSON.parse(localStorage.getItem('helperLeaderboard')) || [
    { name: "Arjun Mehta", coins: 140, badge: "Neighborhood Hero 🦸‍♂️", friendlyCount: 12 },
    { name: "Priya Sharma", coins: 85, badge: "Local Helper 🛠️", friendlyCount: 8 },
    { name: "Rohan Das", coins: 40, badge: "Getting Started 🌱", friendlyCount: 3 }
];

// DAILY HEALTH LOG STORE
function getDailyLogs() {
    const today = new Date().toISOString().split('T')[0];
    let allLogs = JSON.parse(localStorage.getItem('elderDailyHealthLogs')) || {};
    if (!allLogs[today]) {
        allLogs[today] = {
            medications: { Morning: false, Afternoon: false, Night: false },
            entries: []
        };
    }
    return { todayKey: today, data: allLogs };
}

const GEMINI_API_KEY = "YOUR_FREE_GEMINI_API_KEY_HERE";

function saveGlobalState() {
    localStorage.setItem('indiaNetworkTasks', JSON.stringify(tasks));
    localStorage.setItem('helperLeaderboard', JSON.stringify(leaders));
    if (PAGE_ROLE === 'adult') {
        localStorage.setItem('neighborAdultUser', JSON.stringify(activeProfile));
    } else {
        localStorage.setItem('neighborHelperUser', JSON.stringify(activeProfile));
    }
}

// SAFE INITIALIZATION ORDER
document.addEventListener('DOMContentLoaded', () => {
    activeProfile = getActiveProfile();

    const nameDisplay = document.getElementById('display-profile-name');
    if (nameDisplay) {
        nameDisplay.innerText = activeProfile.name || (PAGE_ROLE === 'adult' ? "Elder" : "Helper");
    }

    try { renderTasks(); } catch (err) { console.error("renderTasks error:", err); }
    try { syncStateToUI(); } catch (err) { console.error("syncStateToUI error:", err); }
    try { checkPendingApprovals(); } catch (err) { console.error("checkPendingApprovals error:", err); }
    try { checkActiveInProgressTasks(); } catch (err) { console.error("checkActiveInProgressTasks error:", err); }
    try { initDailyHealthLogUI(); } catch (err) { console.error("initDailyHealthLogUI error:", err); }
    try { initElderEmergencyData(); } catch (err) { console.error("initElderEmergencyData error:", err); }
    try { initElderMode(); } catch (err) { console.error("initElderMode error:", err); }
    try { setupEventListeners(); } catch (err) { console.error("setupEventListeners error:", err); }
});

// REAL-TIME AUTO-UPDATE ACROSS TABS
window.addEventListener('storage', (e) => {
    if (e.key === 'indiaNetworkTasks' || e.key === 'helperLeaderboard' || e.key === 'elderDailyHealthLogs') {
        tasks = getStoredTasks();
        leaders = JSON.parse(localStorage.getItem('helperLeaderboard')) || leaders;
        activeProfile = getActiveProfile();

        syncStateToUI();
        renderTasks();
        checkPendingApprovals();
        checkActiveInProgressTasks();
        initDailyHealthLogUI();
    }
});

// DAILY REMINDER HANDLERS
window.dismissDailyReminder = function() {
    const banner = document.getElementById('daily-reminder-banner');
    if (banner) {
        banner.style.display = 'none';
        sessionStorage.setItem('reminderDismissedToday', 'true');
    }
};

// ACTIVE DAILY HEALTH LOG & MEDICATION CHECKLIST ENGINE
function initDailyHealthLogUI() {
    if (PAGE_ROLE !== 'adult') return;

    // Check reminder dismiss status for current session
    const banner = document.getElementById('daily-reminder-banner');
    if (banner && sessionStorage.getItem('reminderDismissedToday') === 'true') {
        banner.style.display = 'none';
    }

    const { todayKey, data } = getDailyLogs();
    const todayData = data[todayKey];

    const morningCb = document.getElementById('med-morning');
    const afternoonCb = document.getElementById('med-afternoon');
    const nightCb = document.getElementById('med-night');

    if (morningCb) morningCb.checked = Boolean(todayData.medications.Morning);
    if (afternoonCb) afternoonCb.checked = Boolean(todayData.medications.Afternoon);
    if (nightCb) nightCb.checked = Boolean(todayData.medications.Night);

    renderDailyLogEntriesUI();
}

window.toggleMedicationLog = function(timeOfDay) {
    const { todayKey, data } = getDailyLogs();
    const cb = document.getElementById(`med-${timeOfDay.toLowerCase()}`);
    if (!cb) return;

    data[todayKey].medications[timeOfDay] = cb.checked;
    
    // Add timestamped confirmation entry
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const logText = cb.checked ? `✅ Confirmed taking ${timeOfDay} medication` : `⚠️ Unchecked ${timeOfDay} medication`;
    data[todayKey].entries.unshift({ time: timestamp, text: logText, type: 'medication' });

    localStorage.setItem('elderDailyHealthLogs', JSON.stringify(data));
    renderDailyLogEntriesUI();
};

window.saveDailyHealthLog = function() {
    const input = document.getElementById('health-log-input');
    if (!input || !input.value.trim()) {
        alert("Please write or speak your health log entry before saving!");
        return;
    }

    const { todayKey, data } = getDailyLogs();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    data[todayKey].entries.unshift({
        time: timestamp,
        text: `🩺 ${input.value.trim()}`,
        type: 'health_log'
    });

    localStorage.setItem('elderDailyHealthLogs', JSON.stringify(data));
    input.value = '';
    renderDailyLogEntriesUI();
    alert("Health entry successfully recorded in your daily health log!");
};

function renderDailyLogEntriesUI() {
    const container = document.getElementById('daily-log-entries-list');
    if (!container) return;

    const { todayKey, data } = getDailyLogs();
    const entries = data[todayKey].entries || [];

    if (entries.length === 0) {
        container.innerHTML = `<p style="font-size:0.85rem; color:#94a3b8; font-style:italic;">No health logs added yet today.</p>`;
        return;
    }

    container.innerHTML = '';
    entries.slice(0, 5).forEach(item => {
        const row = document.createElement('div');
        row.className = 'log-item-row';
        row.innerHTML = `<span>${escapeHTML(item.text)}</span> <strong style="color:#64748b; font-size:0.8rem;">${escapeHTML(item.time)}</strong>`;
        container.appendChild(row);
    });
}

// CAREGIVER & FAMILY DAILY HEALTH SUMMARY
window.generateDailyCaregiverSummary = function() {
    const { todayKey, data } = getDailyLogs();
    const todayData = data[todayKey];
    const user = activeProfile.name || "Elder";

    const meds = todayData.medications;
    const medSummary = `Morning: ${meds.Morning ? 'Taken ✅' : 'Pending ⏳'} | Afternoon: ${meds.Afternoon ? 'Taken ✅' : 'Pending ⏳'} | Night: ${meds.Night ? 'Taken ✅' : 'Pending ⏳'}`;

    let healthDetails = todayData.entries.map(e => `• [${e.time}] ${e.text}`).join('\n');
    if (!healthDetails) healthDetails = "• No vitals or health complaints recorded today.";

    const summaryText = `📋 DAILY HEALTH SUMMARY (${todayKey})\nSeeker: ${user}\n\n💊 MEDICATION ADHERENCE:\n${medSummary}\n\n🩺 RECORDED HEALTH LOGS:\n${healthDetails}\n\nGenerated by NeighborHelp India.`;

    const modal = document.getElementById('summary-modal');
    const modalBody = document.getElementById('summary-modal-body');
    if (modal && modalBody) {
        modalBody.innerText = summaryText;
        modal.style.display = 'flex';
    }
};

window.closeSummaryModal = function() {
    const modal = document.getElementById('summary-modal');
    if (modal) modal.style.display = 'none';
};

window.copyDailySummaryText = function() {
    const modalBody = document.getElementById('summary-modal-body');
    if (modalBody && navigator.clipboard) {
        navigator.clipboard.writeText(modalBody.innerText).then(() => {
            alert("✅ Daily health summary copied! You can paste it into WhatsApp for your family or caregiver.");
        });
    }
};

// MULTI-FIELD VOICE-TO-TEXT ENGINE
let activeSpeechRecognizer = null;
let currentActiveMicBtn = null;

window.startVoiceForField = function(fieldId, fieldLabel) {
    const targetElement = document.getElementById(fieldId);
    const langSelect = document.getElementById('voice-lang-select');
    const statusText = document.getElementById('voice-status-text');

    if (!targetElement) return;

    const parentWrapper = targetElement.closest('.input-with-mic');
    const micBtn = parentWrapper ? parentWrapper.querySelector('.mic-field-btn') : null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Speech Recognition is not supported on this browser. Please use Google Chrome or Microsoft Edge.");
        return;
    }

    if (activeSpeechRecognizer && currentActiveMicBtn === micBtn) {
        activeSpeechRecognizer.stop();
        return;
    }

    if (activeSpeechRecognizer) {
        activeSpeechRecognizer.stop();
    }

    try {
        activeSpeechRecognizer = new SpeechRecognition();
        activeSpeechRecognizer.continuous = false;
        activeSpeechRecognizer.interimResults = true;

        const chosenLang = langSelect ? langSelect.value : 'en-IN';
        activeSpeechRecognizer.lang = chosenLang;

        activeSpeechRecognizer.onstart = () => {
            currentActiveMicBtn = micBtn;
            if (micBtn) micBtn.classList.add('recording');

            const langName = chosenLang === 'en-IN' ? 'English' : 'Hindi';
            if (statusText) {
                statusText.style.display = 'block';
                statusText.innerText = `🔴 Listening in ${langName} for ${fieldLabel}... Speak now!`;
            }
        };

        activeSpeechRecognizer.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                transcript += event.results[i][0].transcript;
            }
            if (transcript.trim()) {
                targetElement.value = transcript;
            }
        };

        activeSpeechRecognizer.onerror = (event) => {
            console.warn("Speech recognition error:", event.error);
            if (statusText) {
                statusText.innerText = `⚠️ Notice (${event.error}). Please allow microphone access.`;
            }
        };

        activeSpeechRecognizer.onend = () => {
            if (currentActiveMicBtn) {
                currentActiveMicBtn.classList.remove('recording');
                currentActiveMicBtn = null;
            }
            activeSpeechRecognizer = null;
            if (statusText) {
                statusText.innerText = `✅ Inserted speech into ${fieldLabel}! You can review or edit.`;
                setTimeout(() => { if (statusText) statusText.style.display = 'none'; }, 4000);
            }
        };

        activeSpeechRecognizer.start();
    } catch (err) {
        console.error("Speech recognition start failed:", err);
        if (micBtn) micBtn.classList.remove('recording');
        currentActiveMicBtn = null;
        activeSpeechRecognizer = null;
    }
};

// SYNC UI (WALLET, BADGES, LEADERBOARD)
function syncStateToUI() {
    const coinCounter = document.getElementById('karma-score');
    const badgeText = document.getElementById('karma-badge-text');
    const friendlyCounter = document.getElementById('helper-friendly-count');
    const leaderboardBox = document.getElementById('leaderboard-container');

    const myEntry = leaders.find(l => l.name.toLowerCase() === activeProfile.name.toLowerCase());
    if (myEntry && PAGE_ROLE === 'helper') {
        activeProfile.coins = myEntry.coins;
    }

    if (PAGE_ROLE === 'helper') {
        if (coinCounter) coinCounter.innerText = activeProfile.coins || 0;
        if (friendlyCounter) friendlyCounter.innerText = myEntry ? (myEntry.friendlyCount || 0) : 0;

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

    if (leaderboardBox) {
        leaderboardBox.innerHTML = '';
        leaders.sort((a, b) => (b.coins || 0) - (a.coins || 0));
        leaders.forEach(lead => {
            const row = document.createElement('div');
            row.className = "leaderboard-row";
            row.innerHTML = `
                <span>
                    <strong>${escapeHTML(lead.name)}</strong> (${lead.badge || 'Getting Started 🌱'})
                    <small style="color:#27ae60; margin-left:6px; font-weight:bold;">👍 ${lead.friendlyCount || 0}</small>
                </span>
                <span style="color:#10436e; font-weight:bold;">🪙 ${lead.coins || 0}</span>
            `;
            leaderboardBox.appendChild(row);
        });
    }
}

// INCOMING VOLUNTEER NOTIFICATIONS AWAITING APPROVAL
function checkPendingApprovals() {
    const approvalSection = document.getElementById('helper-approval-section');
    const container = document.getElementById('approval-cards-container');
    if (!approvalSection || !container) return;

    if (PAGE_ROLE !== 'adult') {
        approvalSection.style.display = 'none';
        return;
    }

    const pendingTasks = tasks.filter(t => t.status === 'pending_approval');
    if (pendingTasks.length === 0) {
        approvalSection.style.display = 'none';
        container.innerHTML = '';
        return;
    }

    approvalSection.style.display = 'block';
    container.innerHTML = '';

    pendingTasks.forEach(task => {
        const card = document.createElement('div');
        card.className = "approval-card";
        card.innerHTML = `
            <div>
                <h4>Request: "${escapeHTML(task.title)}"</h4>
                <p>Volunteer <strong>${escapeHTML(task.helperName || 'A neighbor')}</strong> has offered to help with this task.</p>
            </div>
            <div class="approval-btn-group">
                <button class="btn btn-success btn-sm" onclick="respondToHelper('${task.id}', true)">✅ Accept Helper</button>
                <button class="btn btn-danger btn-sm" onclick="respondToHelper('${task.id}', false)">❌ Decline</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// ACTIVE IN-PROGRESS SECTION: ASKS THE ADULT IF THE HELP IS DONE
function checkActiveInProgressTasks() {
    const progressSection = document.getElementById('in-progress-section');
    const container = document.getElementById('in-progress-cards-container');
    if (!progressSection || !container) return;

    if (PAGE_ROLE !== 'adult') {
        progressSection.style.display = 'none';
        return;
    }

    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    if (inProgressTasks.length === 0) {
        progressSection.style.display = 'none';
        container.innerHTML = '';
        return;
    }

    progressSection.style.display = 'block';
    container.innerHTML = '';

    inProgressTasks.forEach(task => {
        const card = document.createElement('div');
        card.className = "in-progress-card";
        card.innerHTML = `
            <div>
                <h4 style="color:#0d2c4a; margin-bottom:4px;">"${escapeHTML(task.title)}"</h4>
                <p style="color:#334155; font-size:0.95rem;">
                    Volunteer <strong>${escapeHTML(task.helperName || 'Helper')}</strong> is assigned. Did they complete this help?
                </p>
            </div>
            <div>
                <button class="btn btn-primary btn-sm" onclick="openRatingModal('${task.id}')">
                    ✅ Mark Help as Done &amp; Rate
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// ADULT ACCEPTS OR REJECTS HELPER
window.respondToHelper = function(taskId, accepted) {
    const task = tasks.find(t => String(t.id) === String(taskId));
    if (!task) return;

    if (accepted) {
        task.status = 'in_progress';
        saveGlobalState();
        checkPendingApprovals();
        checkActiveInProgressTasks();
        renderTasks();

        alert(`🎉 You accepted ${task.helperName}'s offer!\n\nWhen ${task.helperName} completes the task, click "Mark Help as Done & Rate" to award their Mitra Coins.`);
    } else {
        alert("Offer declined. The request has been reopened for other helpers.");
        task.status = 'open';
        task.helperName = null;
        saveGlobalState();
        checkPendingApprovals();
        checkActiveInProgressTasks();
        renderTasks();
    }
};

// RENDER TASK BOARD
function renderTasks() {
    const taskBoard = document.getElementById('task-board');
    if (!taskBoard) return;
    taskBoard.innerHTML = '';

    const filterSelect = document.getElementById('filter-select');
    const searchInput = document.getElementById('search-input');

    const selectedCategory = filterSelect ? filterSelect.value : 'All';
    const searchQuery = (searchInput && searchInput.value) ? searchInput.value.toLowerCase().trim() : '';

    let viewableList = tasks.filter(t => {
        const catMatch = (selectedCategory === 'All' || t.category === selectedCategory);
        const searchMatch = !searchQuery || (
            (t.title && t.title.toLowerCase().includes(searchQuery)) ||
            (t.desc && t.desc.toLowerCase().includes(searchQuery)) ||
            (t.location && t.location.toLowerCase().includes(searchQuery))
        );
        return catMatch && searchMatch;
    });

    viewableList.sort((a, b) => {
        if (a.status === 'open' && b.status !== 'open') return -1;
        if (b.status === 'open' && a.status !== 'open') return 1;
        return Number(b.isUrgent) - Number(a.isUrgent);
    });

    if (viewableList.length === 0) {
        taskBoard.innerHTML = `<p style="padding:25px; color:#718096; text-align:center; font-weight:bold;">No requests match your current filters.</p>`;
        return;
    }

    viewableList.forEach(task => {
        const card = document.createElement('article');
        let classes = 'task-card';
        if (task.status === 'completed') classes += ' claimed';
        else if (task.status === 'in_progress') classes += ' in-progress';
        else if (task.status === 'pending_approval') classes += ' pending';
        else if (task.isUrgent) classes += ' urgent-card';
        card.className = classes;

        let actionMarkup = '';

        if (PAGE_ROLE === 'helper') {
            if (task.status === 'completed') {
                actionMarkup = `<button class="btn btn-claimed" disabled>Task Completed &amp; Coins Earned ✅</button>`;
            } else if (task.status === 'in_progress') {
                const isMe = task.helperName && (task.helperName.toLowerCase() === activeProfile.name.toLowerCase());
                actionMarkup = `<button class="btn btn-claimed" disabled style="background:#1a5b94; color:#fff;">${isMe ? '🏃 You Are Assigned &amp; En Route' : 'Assigned to ' + escapeHTML(task.helperName)}</button>`;
            } else if (task.status === 'pending_approval') {
                actionMarkup = `<button class="btn btn-claimed" disabled style="background:#d97706; color:#fff;">⏳ Offer Sent! Awaiting Seeker Approval</button>`;
            } else {
                actionMarkup = `<button class="btn btn-success" onclick="claimTask('${task.id}')">I Can Help!</button>`;
            }
        } else {
            // ADULT PERSPECTIVE
            if (task.status === 'completed') {
                const ratingLabel = (task.friendlyRating === 'friendly') ? '😊 Friendly & Helpful 👍' : 'Neutral';
                actionMarkup = `<span style="color:var(--success-color); font-weight:bold;">Status: Completed (${ratingLabel})</span>`;
            } else if (task.status === 'in_progress') {
                actionMarkup = `
                    <div style="margin-top:8px;">
                        <span style="color:#0284c7; font-weight:bold;">Helper Assigned: ${escapeHTML(task.helperName || 'Volunteer')}</span><br>
                        <button class="btn btn-primary btn-sm" style="margin-top:8px;" onclick="openRatingModal('${task.id}')">
                            ✅ Mark Help Done &amp; Rate
                        </button>
                    </div>`;
            } else if (task.status === 'pending_approval') {
                actionMarkup = `<span style="color:#d97706; font-weight:bold;">🔔 Helper ${escapeHTML(task.helperName || '')} offered to help! (Check approval box above)</span>`;
            } else {
                actionMarkup = `<span style="color:#718096; font-style:italic;">Status: Live (Awaiting Volunteers...)</span>`;
            }
        }

        card.innerHTML = `
            ${(task.status === 'open' && task.isUrgent) ? `<span class="urgent-badge">⚠️ CRITICAL NEED</span>` : ''}
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

// HELPER OFFERS ASSISTANCE
window.claimTask = function(taskId) {
    const task = tasks.find(t => String(t.id) === String(taskId));
    if (!task) return;

    task.status = 'pending_approval';
    task.helperName = activeProfile.name || "Volunteer";

    saveGlobalState();
    renderTasks();

    const modal = document.getElementById('contact-modal');
    const modalText = document.getElementById('modal-body-text');
    if (modal && modalText) {
        modalText.innerHTML = `Your offer to assist with <strong>"${escapeHTML(task.title)}"</strong> has been sent to the elder.<br><br>As soon as they accept and confirm completion, your <strong>Mitra Coins</strong> and friendly rating will be added to your wallet!`;
        modal.style.display = 'flex';
    } else {
        alert("Offer sent! You will receive coins once the elder marks the request complete.");
    }
};

// ADULT MARKS HELP DONE & SUBMITS RATING
let currentRatingTaskId = null;
let currentRatingChoice = 'friendly';

window.openRatingModal = function(taskId) {
    const task = tasks.find(t => String(t.id) === String(taskId));
    if (!task) return;

    currentRatingTaskId = task.id;
    currentRatingChoice = 'friendly';

    const modal = document.getElementById('rating-modal');
    const titleEl = document.getElementById('rating-task-title');
    const helperEl = document.getElementById('rating-helper-name');

    if (titleEl) titleEl.innerText = `Task: "${task.title}"`;
    if (helperEl) helperEl.innerText = task.helperName || "the volunteer";

    updateRatingButtonsUI();
    if (modal) modal.style.display = 'flex';
};

function updateRatingButtonsUI() {
    document.querySelectorAll('.rating-btn').forEach(btn => {
        if (btn.dataset.rating === currentRatingChoice) {
            btn.classList.add('rating-selected');
        } else {
            btn.classList.remove('rating-selected');
        }
    });
}

function setupEventListeners() {
    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentRatingChoice = e.currentTarget.dataset.rating;
            updateRatingButtonsUI();
        });
    });

    const submitRatingBtn = document.getElementById('submit-completion-btn');
    if (submitRatingBtn) {
        submitRatingBtn.addEventListener('click', () => {
            if (!currentRatingTaskId) return;

            const task = tasks.find(t => String(t.id) === String(currentRatingTaskId));
            if (!task) return;

            task.status = 'completed';
            task.friendlyRating = currentRatingChoice;

            const payout = task.isUrgent ? 25 : 10;

            let helperEntry = leaders.find(l => l.name.toLowerCase() === (task.helperName || '').toLowerCase());
            if (!helperEntry) {
                helperEntry = {
                    name: task.helperName || "Volunteer",
                    coins: 0,
                    badge: "Getting Started 🌱",
                    friendlyCount: 0
                };
                leaders.push(helperEntry);
            }

            helperEntry.coins = (helperEntry.coins || 0) + payout;
            if (currentRatingChoice === 'friendly') {
                helperEntry.friendlyCount = (helperEntry.friendlyCount || 0) + 1;
            }

            if (helperEntry.coins >= 200) helperEntry.badge = "Community Legend 👑";
            else if (helperEntry.coins >= 100) helperEntry.badge = "Neighborhood Hero 🦸‍♂️";
            else if (helperEntry.coins >= 50) helperEntry.badge = "Local Helper 🛠️";

            saveGlobalState();
            syncStateToUI();
            checkPendingApprovals();
            checkActiveInProgressTasks();
            renderTasks();

            const modal = document.getElementById('rating-modal');
            if (modal) modal.style.display = 'none';

            alert(`✅ Help marked completed!\n\nAwarded ${payout} Mitra Coins to ${task.helperName}.\nRating recorded: ${currentRatingChoice === 'friendly' ? 'Friendly & Helpful 👍' : 'Neutral'}.`);
            currentRatingTaskId = null;
        });
    }

    const closeRatingBtn = document.getElementById('close-rating-modal-btn');
    if (closeRatingBtn) {
        closeRatingBtn.addEventListener('click', () => {
            const modal = document.getElementById('rating-modal');
            if (modal) modal.style.display = 'none';
            currentRatingTaskId = null;
        });
    }

    const closeContactBtn = document.getElementById('close-modal-btn');
    if (closeContactBtn) {
        closeContactBtn.addEventListener('click', () => {
            const modal = document.getElementById('contact-modal');
            if (modal) modal.style.display = 'none';
        });
    }

    const filterSelect = document.getElementById('filter-select');
    if (filterSelect) filterSelect.addEventListener('change', renderTasks);

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.addEventListener('input', renderTasks);

    // Form submission with Gemini AI safety processing
    const taskForm = document.getElementById('task-form');
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
                    const queryPrompt = `You are a translator and safety monitor for an Indian community app. 
                    Analyze this request description text: "${desc.value}". 
                    Task 1: If it contains crypto spam, advertisements, scams, or vulgarity, reply with exactly "REJECTED".
                    Task 2: If safe, TRANSLATE it into clear English, fix any grammar issues, and make it concise. Reply with ONLY the final polished English text without extra commentary.`;

                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ contents: [{ parts: [{ text: queryPrompt }] }] })
                    });
                    const responseData = await res.json();
                    const parseString = responseData.candidates[0].content.parts[0].text.trim();

                    if (parseString.includes("REJECTED")) {
                        alert("🚨 Flagged as spam or commercial ad. Keep requests focused on neighborly support!");
                        subBtn.innerText = fallbackTxt;
                        subBtn.disabled = false;
                        return;
                    } else {
                        processedDesc = parseString;
                    }
                } catch (err) {
                    console.error("Gemini translation error, using raw description:", err);
                }
            }

            const newTask = {
                id: `task-${Date.now()}`,
                title: title.value.trim(),
                desc: processedDesc.trim(),
                location: loc.value.trim(),
                category: cat.value,
                status: "open",
                isUrgent: urg.checked,
                helperName: null,
                friendlyRating: null
            };

            tasks.unshift(newTask);
            saveGlobalState();
            renderTasks();
            taskForm.reset();

            subBtn.innerText = fallbackTxt;
            subBtn.disabled = false;
        });
    }
}

// EMERGENCY SERVICES DIRECTORY
function initElderEmergencyData() {
    const contactInput = document.getElementById('elder-contact-no');
    const addressInput = document.getElementById('elder-home-address');
    const saveBtn = document.getElementById('save-emergency-btn');
    const statusMsg = document.getElementById('emergency-save-status');

    if (!contactInput || !addressInput || !saveBtn) return;

    contactInput.value = localStorage.getItem('elderEmergencyPhone') || '';
    addressInput.value = localStorage.getItem('elderEmergencyAddress') || '';

    saveBtn.addEventListener('click', () => {
        localStorage.setItem('elderEmergencyPhone', contactInput.value.trim());
        localStorage.setItem('elderEmergencyAddress', addressInput.value.trim());
        if (statusMsg) {
            statusMsg.innerText = "Saved successfully!";
            setTimeout(() => { statusMsg.innerText = ""; }, 2500);
        }
    });
}

window.triggerEmergencyCall = function(phoneNumber, label) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(phoneNumber);
    }
    window.location.href = `tel:${phoneNumber}`;
    alert(`🚨 Calling ${label}: ${phoneNumber}\n\n(Number copied to clipboard)`);
};

window.findNearbyHospitals = function() {
    const savedAddress = localStorage.getItem('elderEmergencyAddress') || '';
    let mapsUrl = "https://www.google.com/maps/search/hospitals+near+me";
    if (savedAddress) {
        mapsUrl = `https://www.google.com/maps/search/hospitals+near+${encodeURIComponent(savedAddress)}`;
    }
    window.open(mapsUrl, '_blank');
};

window.callSavedDoctor = function() {
    const docPhone = localStorage.getItem('elderEmergencyPhone');
    if (!docPhone) {
        alert("Please enter and save your emergency contact number first!");
        const input = document.getElementById('elder-contact-no');
        if (input) input.focus();
        return;
    }
    const cleanNumber = docPhone.replace(/[^0-9+]/g, '');
    if (navigator.clipboard) navigator.clipboard.writeText(cleanNumber);
    window.location.href = `tel:${cleanNumber}`;
    alert(`📞 Dialing Contact: ${docPhone}`);
};

window.copySOSDetails = function() {
    const phone = localStorage.getItem('elderEmergencyPhone') || 'Not provided';
    const address = localStorage.getItem('elderEmergencyAddress') || 'Not provided';
    const user = activeProfile.name || 'Elder';
    const sosMsg = `🚨 EMERGENCY ASSISTANCE NEEDED 🚨\nName: ${user}\nAddress: ${address}\nDoctor/Kin Contact: ${phone}\nAmbulance: 108 | Emergency: 112`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(sosMsg).then(() => {
            alert("✅ Emergency details copied! You can paste it into WhatsApp or SMS.");
        });
    } else {
        alert(sosMsg);
    }
};

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
        elderBtn.innerText = activeState ? "⚡ Disable Elder Mode (सामान्य फॉन्ट)" : "⚡ Enable Elder Mode (बड़ा फॉन्ट)";
    });
}

function escapeHTML(str) {
    return String(str || '').replace(/[&<>'"]/g, t => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[t] || t));
}
// MEDICATION AUDITORY & VOICE ALARM ENGINE
const MED_ALARM_SCHEDULE = {
    Morning: "08:00",
    Afternoon: "13:00",
    Night: "21:00"
};

let triggeredAlarms = {};

// Plays a gentle two-tone chime using Web Audio API (no external MP3 needed)
function playAlarmChime() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 tone
        osc.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.2); // A5 tone
        
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
        console.warn("AudioContext playback error:", e);
    }
}

// Speaks the reminder aloud in clear English/Hindi phonetics
function speakAlarmReminder(timeOfDay) {
    if ('speechSynthesis' in window) {
        const reminderText = `Reminder: Please take your ${timeOfDay} medication now.`;
        const utterance = new SpeechSynthesisUtterance(reminderText);
        utterance.lang = 'en-IN';
        utterance.rate = 0.9; // Slower rate for elder clarity
        window.speechSynthesis.speak(utterance);
    }
}

// Check every 30 seconds if any medication alarm matches current time
function startMedicationAlarmMonitor() {
    if (PAGE_ROLE !== 'adult') return;

    setInterval(() => {
        const now = new Date();
        const currentTime = now.toTimeString().substring(0, 5); // "HH:MM"
        const { todayKey, data } = getDailyLogs();
        const todayMeds = data[todayKey].medications;

        for (const [timeOfDay, alarmTime] of Object.entries(MED_ALARM_SCHEDULE)) {
            // Trigger if:
            // 1. Current clock time matches alarm time
            // 2. Medicine hasn't been marked taken yet
            // 3. Alarm hasn't fired yet during this minute
            if (currentTime === alarmTime && !todayMeds[timeOfDay] && !triggeredAlarms[timeOfDay + "_" + currentTime]) {
                triggeredAlarms[timeOfDay + "_" + currentTime] = true;
                
                playAlarmChime();
                speakAlarmReminder(timeOfDay);
                
                // Show visual alert on screen
                alert(`⏰ MEDICATION ALARM!\n\nIt is ${alarmTime}. Time to take your ${timeOfDay} dose.`);
            }
        }
    }, 30000);
}

// Start monitoring automatically on page load
document.addEventListener('DOMContentLoaded', () => {
    startMedicationAlarmMonitor();
});
