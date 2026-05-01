// DocuMind AI — Built by Mohit Kourav
// GitHub: https://github.com/MOHITKOURAV01/DocuMind-AI

const API = "";

const $ = id => document.getElementById(id);
const els = {
    btnConnect: $("btn-connect"),
    btnDisconnect: $("btn-disconnect"),
    btnSync: $("btn-sync"),
    btnSend: $("btn-send"),
    btnMic: $("btn-mic"),
    btnSpeaker: $("btn-speaker"),
    btnClear: $("btn-clear"),
    themeToggle: $("theme-toggle"),
    sidebarToggle: $("sidebar-toggle"),
    folderLink: $("folder-link"),
    chatInput: $("chat-input"),
    chatHistory: $("chat-history"),
    chatOverlay: $("chat-overlay"),
    syncStatus: $("sync-status"),
    progressWrap: $("progress-wrap"),
    authStatus: $("auth-status"),
    authText: $("auth-text"),
    metricDocs: $("metric-docs"),
    metricChunks: $("metric-chunks"),
    metricStatus: $("metric-status"),
    quickPrompts: $("quick-prompts"),
    quickPromptsInner: $("quick-prompts-inner"),
    sunIcon: document.querySelector(".sun-icon"),
    moonIcon: document.querySelector(".moon-icon"),
    speakerOn: document.querySelector(".icon-speaker-on"),
    speakerOff: document.querySelector(".icon-speaker-off"),
    inputBox: $("input-box"),
    toast: $("toast"),
    sidebar: document.querySelector(".sidebar"),
};

// ── State ──
let isDark = localStorage.getItem("dm_theme") === "dark";
let voiceEnabled = true;
let isRecording = false;
let recognition = null;
let availableVoices = [];
let toastTimer = null;

// ── Toast ──
function showToast(msg, duration = 2500) {
    els.toast.textContent = msg;
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), duration);
}

// ── Theme ──
function applyTheme() {
    document.body.classList.toggle("dark", isDark);
    els.sunIcon.style.display = isDark ? "none" : "block";
    els.moonIcon.style.display = isDark ? "block" : "none";
}

els.themeToggle.addEventListener("click", () => {
    isDark = !isDark;
    localStorage.setItem("dm_theme", isDark ? "dark" : "light");
    applyTheme();
});

// ── Sidebar Toggle ──
els.sidebarToggle.addEventListener("click", () => {
    els.sidebar.classList.toggle("collapsed");
});

// ── Speech Setup ──
window.speechSynthesis.onvoiceschanged = () => {
    availableVoices = window.speechSynthesis.getVoices();
};

const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRec) {
    recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = e => {
        els.chatInput.value = e.results[0][0].transcript;
    };
    recognition.onend = () => stopRecording();
    recognition.onerror = () => stopRecording();
} else {
    els.btnMic.style.display = "none";
}

function stopRecording() {
    isRecording = false;
    els.btnMic.classList.remove("recording");
    els.inputBox.classList.remove("recording");
    els.chatInput.placeholder = "Ask anything about your documents...";
}

// ── Status Check ──
async function checkStatus() {
    try {
        const res = await fetch(`${API}/status`);
        const data = await res.json();

        // Auth status
        const dot = els.authStatus.querySelector(".status-dot");
        if (data.drive_connected) {
            dot.className = "status-dot green";
            els.authText.textContent = data.user_email ? `Connected: ${data.user_email.split("@")[0]}` : "Drive Connected";
            els.btnDisconnect.disabled = false;
            els.btnSync.disabled = false;
        } else {
            dot.className = "status-dot red";
            els.authText.textContent = "Not Connected";
            els.btnDisconnect.disabled = true;
        }

        // Index stats with animated counter
        if (data.faiss_index_exists) {
            animateCounter(els.metricDocs, parseInt(els.metricDocs.textContent), data.unique_documents);
            animateCounter(els.metricChunks, parseInt(els.metricChunks.textContent), data.total_chunks_indexed);
            els.metricStatus.textContent = "✅ Ready";
            els.metricStatus.style.color = "var(--success)";
            unlockChat();
        } else {
            els.metricStatus.textContent = "Empty";
            els.metricStatus.style.color = "";
            els.btnClear.disabled = true;
        }
    } catch (e) {
        console.error("Status check failed", e);
    }
}

function animateCounter(el, from, to) {
    if (from === to) return;
    const steps = 20;
    const diff = to - from;
    let step = 0;
    const timer = setInterval(() => {
        step++;
        el.textContent = Math.round(from + diff * (step / steps));
        if (step >= steps) clearInterval(timer);
    }, 30);
}

function unlockChat() {
    if (els.chatOverlay) els.chatOverlay.style.display = "none";
    els.chatInput.disabled = false;
    els.btnSend.disabled = false;
    els.btnMic.disabled = false;
    els.btnSpeaker.disabled = false;
    els.btnClear.disabled = false;
    els.quickPrompts.style.display = "block";
}

// ── Drive Buttons ──
els.btnConnect.addEventListener("click", () => {
    window.location.href = `${API}/auth/login`;
});

els.btnDisconnect.addEventListener("click", async () => {
    if (!confirm("Disconnect Google Drive?")) return;
    try {
        const res = await fetch(`${API}/disconnect`, { method: "POST" });
        if (res.ok) { showToast("Drive disconnected."); setTimeout(() => location.reload(), 800); }
        else showToast("Failed to disconnect.");
    } catch { showToast("Network error."); }
});

els.btnClear.addEventListener("click", async () => {
    if (!confirm("Clear ALL synced data? This cannot be undone.")) return;
    try {
        const res = await fetch(`${API}/clear-data`, { method: "POST" });
        if (res.ok) { showToast("Data cleared!"); setTimeout(() => location.reload(), 800); }
        else showToast("Failed to clear data.");
    } catch { showToast("Network error."); }
});

// ── Folder Link — Enable Sync ──
els.folderLink.addEventListener("input", e => {
    const val = e.target.value.trim();
    els.btnSync.disabled = !val.match(/folders\/([a-zA-Z0-9_-]+)/);
    if (!val) checkStatus();
});

// ── Sync ──
els.btnSync.addEventListener("click", async () => {
    const folderLink = els.folderLink.value.trim();
    let folderId = null;

    if (folderLink) {
        const match = folderLink.match(/folders\/([a-zA-Z0-9_-]+)/);
        if (!match) { els.syncStatus.textContent = "❌ Invalid folder link."; return; }
        folderId = match[1];
    }

    els.btnSync.disabled = true;
    els.syncStatus.innerHTML = `<span class="spinner"></span>Syncing your documents...`;
    els.progressWrap.style.display = "block";

    try {
        const res = await fetch(`${API}/sync-drive`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folder_id: folderId })
        });
        const data = await res.json();

        els.progressWrap.style.display = "none";

        if (res.ok) {
            els.syncStatus.textContent = `✅ ${data.files_processed} files synced · ${data.total_new_chunks} chunks indexed · ${data.files_skipped_unchanged} skipped`;
            unlockChat();
            checkStatus();
            fetchRecommendations();
            showToast(`Synced ${data.files_processed} files successfully!`);
        } else {
            els.syncStatus.textContent = `❌ ${data.detail || "Sync failed"}`;
        }
    } catch {
        els.progressWrap.style.display = "none";
        els.syncStatus.textContent = "❌ Network error";
    } finally {
        els.btnSync.disabled = false;
    }
});

// ── Recommendations ──
async function fetchRecommendations() {
    try {
        const res = await fetch(`${API}/recommend-questions`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.questions?.length) {
            els.quickPromptsInner.innerHTML = "";
            data.questions.forEach(q => {
                const btn = document.createElement("button");
                btn.className = "qp-btn";
                btn.textContent = q;
                btn.addEventListener("click", () => { els.chatInput.value = q; sendQuestion(); });
                els.quickPromptsInner.appendChild(btn);
            });
            els.quickPrompts.style.display = "block";
        }
    } catch { }
}

// Quick prompts default
document.querySelectorAll(".qp-btn").forEach(btn => {
    btn.addEventListener("click", () => { els.chatInput.value = btn.textContent; sendQuestion(); });
});

// ── Fill question from demo sidebar ──
window.fillQuestion = q => {
    els.chatInput.value = q;
    els.chatInput.focus();
};

// ── Mic ──
els.btnMic.addEventListener("click", () => {
    if (!recognition) return;
    if (isRecording) {
        recognition.stop();
    } else {
        recognition.start();
        isRecording = true;
        els.btnMic.classList.add("recording");
        els.inputBox.classList.add("recording");
        els.chatInput.placeholder = "🎙 Listening...";
    }
});

// ── Speaker ──
els.btnSpeaker.addEventListener("click", () => {
    voiceEnabled = !voiceEnabled;
    els.speakerOn.style.display = voiceEnabled ? "block" : "none";
    els.speakerOff.style.display = voiceEnabled ? "none" : "block";
    if (!voiceEnabled) window.speechSynthesis.cancel();
    showToast(voiceEnabled ? "Voice responses on" : "Voice responses off");
});

// ── TTS ──
window.speakText = text => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*#_`]/g, "");
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = "en-US";
    if (!availableVoices.length) availableVoices = window.speechSynthesis.getVoices();
    const voice = availableVoices.find(v =>
        v.name.includes("Samantha") || v.name.includes("Female") ||
        v.name.includes("Google US English") || v.name.includes("Karen")
    );
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
};

// ── Send ──
els.btnSend.addEventListener("click", sendQuestion);
els.chatInput.addEventListener("keypress", e => { if (e.key === "Enter") sendQuestion(); });

async function sendQuestion() {
    const query = els.chatInput.value.trim();
    if (!query) return;

    appendUserMessage(query);
    els.chatInput.value = "";
    els.btnSend.disabled = true;

    const loadingId = "msg-" + Date.now();
    appendTypingIndicator(loadingId);

    try {
        const res = await fetch(`${API}/ask`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        });
        const data = await res.json();
        const loadingEl = $(loadingId);

        if (res.ok) {
            const sourcesHtml = data.sources?.length
                ? `<div class="msg-sources">
                    <span class="source-label">Sources:</span>
                    ${data.sources.map(s => `<a href="${s.link}" target="_blank" class="source-chip">${s.name}</a>`).join("")}
                  </div>`
                : "";

            loadingEl.querySelector(".msg-content").innerHTML = `
                ${data.answer}
                <button class="listen-btn" onclick="speakText(this.closest('.ai-message').querySelector('.msg-content').innerText)">
                    <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                    Listen
                </button>
                ${sourcesHtml}
            `;
            if (voiceEnabled) speakText(data.answer);
        } else {
            loadingEl.querySelector(".msg-content").innerHTML =
                `<span style="color:var(--danger)">❌ ${data.detail || "Something went wrong"}</span>`;
        }
    } catch {
        const loadingEl = $(loadingId);
        if (loadingEl) loadingEl.querySelector(".msg-content").innerHTML =
            `<span style="color:var(--danger)">❌ Network error</span>`;
    } finally {
        els.btnSend.disabled = false;
        els.chatInput.focus();
    }
}

function appendUserMessage(text) {
    const div = document.createElement("div");
    div.className = "message user-message";
    div.innerHTML = `<div class="msg-body"><div class="msg-content">${escapeHtml(text)}</div></div>`;
    els.chatHistory.appendChild(div);
    scrollBottom();
}

function appendTypingIndicator(id) {
    const div = document.createElement("div");
    div.className = "message ai-message";
    div.id = id;
    div.innerHTML = `
        <div class="msg-avatar">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
        </div>
        <div class="msg-body">
            <div class="msg-name">DocuMind AI</div>
            <div class="msg-content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        </div>`;
    els.chatHistory.appendChild(div);
    scrollBottom();
}

function scrollBottom() {
    els.chatHistory.scrollTop = els.chatHistory.scrollHeight;
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── Init ──
applyTheme();
checkStatus();
fetchRecommendations();
