/**
 * app.js — Dashboard frontend logic.
 * Pure vanilla JS, no dependencies.
 */

// ─── State ─────────────────────────────────────────────────────────────────
let agentMap = {};
let refreshTimer = null;
let currentSection = "overview";

// ─── Bootstrap ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initNav();
  refreshAll();
  refreshTimer = setInterval(refreshAll, 8000);
});

// ─── Navigation ─────────────────────────────────────────────────────────────
function initNav() {
  document.querySelectorAll(".nav-item").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const section = el.dataset.section;
      navigateTo(section);
    });
  });
}

function navigateTo(section) {
  currentSection = section;
  document.querySelectorAll(".nav-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.section === section);
  });
  document.querySelectorAll(".section").forEach((el) => {
    el.classList.toggle("active", el.id === `section-${section}`);
  });

  const titles = {
    overview: ["Overview", "Real-time routing dashboard"],
    agents: ["Agents", "Manage support agents"],
    calls: ["Calls", "Call history"],
    queue: ["Queue", "Waiting & fallback queues"],
  };
  document.getElementById("page-title").textContent = titles[section][0];
  document.getElementById("page-subtitle").textContent = titles[section][1];
  refreshSection(section);
}

// ─── Refresh ─────────────────────────────────────────────────────────────────
async function refreshAll() {
  document.getElementById("last-updated").textContent =
    "Updated " + new Date().toLocaleTimeString();
  await loadAgentMap();
  refreshSection(currentSection);
}

function refreshSection(section) {
  if (section === "overview") {
    loadStats();
    loadActiveCalls();
    loadAgentStatus();
    loadQueue();
  } else if (section === "agents") {
    loadAgentsFull();
  } else if (section === "calls") {
    loadHistory();
  } else if (section === "queue") {
    loadQueueDetail();
  }
}

// ─── API helpers ─────────────────────────────────────────────────────────────
async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  return res.json();
}

// ─── Data loaders ─────────────────────────────────────────────────────────────
async function loadAgentMap() {
  const data = await api("/agents");
  if (data.success) {
    agentMap = {};
    data.data.agents.forEach((a) => (agentMap[a.id] = a));
  }
}

async function loadStats() {
  const data = await api("/dashboard/stats");
  if (!data.success) return;
  const d = data.data;

  setText("kpi-active", d.calls.activeCalls);
  setText("kpi-active-sub", `${d.calls.byStatus?.active || 0} connected`);
  setText("kpi-available", d.agents.available);
  setText("kpi-available-sub", `${d.agents.total} total agents`);
  setText("kpi-queued", d.queue.totalQueued);
  setText("kpi-queued-sub", `${d.queue.waitingCount} waiting, ${d.queue.fallbackCount} fallback`);
  setText("kpi-handled", d.calls.totalEnded);
}

async function loadActiveCalls() {
  const data = await api("/calls?status=active");
  if (!data.success) return;
  const calls = data.data.calls;
  setText("badge-active-count", calls.length);

  const tbody = document.getElementById("active-calls-body");
  if (calls.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-row">No active calls</td></tr>`;
    return;
  }
  tbody.innerHTML = calls.map((c) => {
    const agent = agentMap[c.assignedAgent];
    const dur = c.startTime ? elapsed(c.startTime) : "—";
    return `<tr>
      <td><span class="mono-id">${c.id}</span><br/><small style="color:var(--text-muted)">${esc(c.customerName)}</small></td>
      <td><span class="skill-tag">${c.requiredSkill}</span></td>
      <td><span class="pill pill-${c.priority} pri-${c.priority}">${c.priority}</span></td>
      <td>${agent ? esc(agent.name) : c.assignedAgent || "—"}</td>
      <td style="font-family:var(--mono);font-size:12px">${dur}</td>
      <td><button class="btn btn-danger btn-sm" onclick="endCall('${c.id}')">End</button></td>
    </tr>`;
  }).join("");
}

async function loadAgentStatus() {
  const agents = Object.values(agentMap);
  setText("badge-agent-count", agents.length);

  const list = document.getElementById("agent-status-list");
  if (agents.length === 0) {
    list.innerHTML = `<div class="empty-row">No agents configured</div>`;
    return;
  }
  list.innerHTML = agents.map((a) => `
    <div class="agent-row">
      <div class="agent-row-info">
        <span class="agent-row-name">${esc(a.name)}</span>
        <span class="agent-row-meta">${a.skills.map(s => `<span class="skill-tag">${s}</span>`).join(" ")}</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="agent-load">${a.activeCalls}/${a.maxCapacity}</span>
        <span class="pill pill-${a.status}">${a.status}</span>
      </div>
    </div>
  `).join("");
}

async function loadQueue() {
  const data = await api("/queue");
  if (!data.success) return;
  const { waiting, fallback } = data.data;

  setText("badge-waiting-count", waiting.length);
  setText("badge-fallback-count", fallback.length);

  const wBody = document.getElementById("waiting-queue-body");
  wBody.innerHTML = waiting.length === 0
    ? `<tr><td colspan="4" class="empty-row">Queue is empty</td></tr>`
    : waiting.map((c) => `<tr>
        <td>${esc(c.customerName)}</td>
        <td><span class="skill-tag">${c.requiredSkill}</span></td>
        <td><span class="pill pri-${c.priority}">${c.priority}</span></td>
        <td style="font-family:var(--mono);font-size:11px">${timeAgo(c.queuedAt)}</td>
      </tr>`).join("");

  const fBody = document.getElementById("fallback-queue-body");
  fBody.innerHTML = fallback.length === 0
    ? `<tr><td colspan="4" class="empty-row">No fallback calls</td></tr>`
    : fallback.map((c) => `<tr>
        <td>${esc(c.customerName)}</td>
        <td><span class="skill-tag">${c.requiredSkill}</span></td>
        <td><span class="pill pri-${c.priority}">${c.priority}</span></td>
        <td style="font-family:var(--mono);font-size:11px">${timeAgo(c.queuedAt)}</td>
      </tr>`).join("");
}

async function loadAgentsFull() {
  const data = await api("/agents");
  if (!data.success) return;
  const agents = data.data.agents;
  const tbody = document.getElementById("agents-full-body");

  if (agents.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-row">No agents yet</td></tr>`;
    return;
  }

  tbody.innerHTML = agents.map((a) => `<tr>
    <td><span class="mono-id">${a.id}</span></td>
    <td style="font-weight:600">${esc(a.name)}</td>
    <td>${a.skills.map(s => `<span class="skill-tag">${s}</span>`).join(" ")}</td>
    <td><span class="pill pill-${a.status}">${a.status}</span></td>
    <td style="font-family:var(--mono)">${a.activeCalls} / ${a.maxCapacity}</td>
    <td>
      <button class="btn btn-ghost btn-sm" onclick="toggleAgentStatus('${a.id}','${a.status}')">
        ${a.status === "offline" ? "Go Online" : "Go Offline"}
      </button>
      <button class="btn btn-danger btn-sm" onclick="deleteAgent('${a.id}')">Delete</button>
    </td>
  </tr>`).join("");
}

async function loadHistory() {
  const data = await api("/calls/history");
  if (!data.success) return;
  const calls = data.data.calls.slice().reverse();
  const tbody = document.getElementById("history-body");

  if (calls.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-row">No history yet</td></tr>`;
    return;
  }

  tbody.innerHTML = calls.map((c) => {
    const agent = agentMap[c.assignedAgent];
    const dur = c.duration ? `${c.duration}s` : "—";
    return `<tr>
      <td><span class="mono-id">${c.id}</span></td>
      <td>${esc(c.customerName)}</td>
      <td><span class="skill-tag">${c.requiredSkill}</span></td>
      <td><span class="pill pri-${c.priority}">${c.priority}</span></td>
      <td>${agent ? esc(agent.name) : (c.assignedAgent || "—")}</td>
      <td style="font-family:var(--mono)">${dur}</td>
      <td style="font-size:11.5px;color:var(--text-muted)">${c.endTime ? new Date(c.endTime).toLocaleString() : "—"}</td>
    </tr>`;
  }).join("");
}

async function loadQueueDetail() {
  const data = await api("/queue");
  if (!data.success) return;
  const { waiting, fallback, stats } = data.data;

  setText("q-waiting", stats.waitingCount);
  setText("q-fallback", stats.fallbackCount);

  const container = document.getElementById("queue-detail");
  let html = "";

  html += `<div class="queue-section-title">Waiting (${waiting.length})</div>`;
  if (waiting.length === 0) {
    html += `<div style="color:var(--text-muted);font-size:13px;padding:8px 0">No calls waiting</div>`;
  } else {
    waiting.forEach((c) => {
      html += `<div class="queue-item">
        <div>
          <div style="font-weight:600;font-size:13px">${esc(c.customerName)}</div>
          <div style="font-size:11.5px;color:var(--text-muted)">${c.id} · ${c.requiredSkill}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="pill pri-${c.priority}">${c.priority}</span>
          <span style="font-size:11px;color:var(--text-muted)">${timeAgo(c.queuedAt)}</span>
        </div>
      </div>`;
    });
  }

  html += `<div class="queue-section-title" style="margin-top:20px">Fallback (${fallback.length})</div>`;
  if (fallback.length === 0) {
    html += `<div style="color:var(--text-muted);font-size:13px;padding:8px 0">No fallback calls</div>`;
  } else {
    fallback.forEach((c) => {
      html += `<div class="queue-item">
        <div>
          <div style="font-weight:600;font-size:13px">${esc(c.customerName)}</div>
          <div style="font-size:11.5px;color:var(--text-muted)">${c.id} · needs: <strong>${c.requiredSkill}</strong></div>
        </div>
        <div><span class="pill pill-fallback">fallback</span></div>
      </div>`;
    });
  }

  container.innerHTML = html;
}

// ─── Actions ──────────────────────────────────────────────────────────────────
async function endCall(callId) {
  if (!confirm(`End call ${callId}?`)) return;
  const data = await api(`/calls/${callId}/end`, { method: "POST" });
  showToast(data.success ? data.message : data.message, data.success ? "success" : "error");
  if (data.success) refreshAll();
}

async function deleteAgent(agentId) {
  if (!confirm(`Delete agent ${agentId}?`)) return;
  const data = await api(`/agents/${agentId}`, { method: "DELETE" });
  showToast(data.success ? "Agent deleted" : data.message, data.success ? "success" : "error");
  if (data.success) { await loadAgentMap(); loadAgentsFull(); }
}

async function toggleAgentStatus(agentId, currentStatus) {
  const newStatus = currentStatus === "offline" ? "available" : "offline";
  const data = await api(`/agents/${agentId}`, {
    method: "PUT",
    body: JSON.stringify({ status: newStatus }),
  });
  showToast(data.success ? `Agent set to ${newStatus}` : data.message, data.success ? "success" : "error");
  if (data.success) { await loadAgentMap(); loadAgentsFull(); }
}

async function processQueue() {
  const data = await api("/routing/process", { method: "POST" });
  showToast(data.success ? data.message : data.message, data.success ? "success" : "error");
  if (data.success) refreshAll();
}

// ─── Modal: New Call ──────────────────────────────────────────────────────────
async function submitCall() {
  const customerName = document.getElementById("call-customer").value.trim();
  const requiredSkill = document.getElementById("call-skill").value;
  const priority = document.getElementById("call-priority").value;
  const resultEl = document.getElementById("call-result");

  if (!customerName) {
    showResult(resultEl, "error", "Please enter a customer name.");
    return;
  }

  const data = await api("/calls", {
    method: "POST",
    body: JSON.stringify({ customerName, requiredSkill, priority }),
  });

  if (data.success) {
    const r = data.data.routing;
    const msg = r.routed
      ? `✓ Routed to ${r.agent?.name}`
      : r.queue === "waiting"
      ? `⏳ Added to waiting queue`
      : `⚠ Added to fallback queue (no ${requiredSkill} agent)`;
    showResult(resultEl, "success", msg);
    document.getElementById("call-customer").value = "";
    refreshAll();
  } else {
    showResult(resultEl, "error", Array.isArray(data.details) ? data.details.join(", ") : data.message);
  }
}

// ─── Modal: New Agent ─────────────────────────────────────────────────────────
async function submitAgent() {
  const name = document.getElementById("agent-name").value.trim();
  const skills = [...document.querySelectorAll("input[name='agent-skill']:checked")].map((e) => e.value);
  const maxCapacity = parseInt(document.getElementById("agent-capacity").value);
  const resultEl = document.getElementById("agent-result");

  if (!name) { showResult(resultEl, "error", "Please enter a name."); return; }
  if (skills.length === 0) { showResult(resultEl, "error", "Select at least one skill."); return; }

  const data = await api("/agents", {
    method: "POST",
    body: JSON.stringify({ name, skills, maxCapacity }),
  });

  if (data.success) {
    showResult(resultEl, "success", `✓ Agent ${data.data.agent.name} added`);
    document.getElementById("agent-name").value = "";
    await loadAgentMap();
    loadAgentStatus();
    if (currentSection === "agents") loadAgentsFull();
  } else {
    showResult(resultEl, "error", Array.isArray(data.details) ? data.details.join(", ") : data.message);
  }
}

// ─── Utilities ─────────────────────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add("open");
  const resultId = id === "newCallModal" ? "call-result" : "agent-result";
  const el = document.getElementById(resultId);
  if (el) el.style.display = "none";
}

function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

// Close modal on overlay click
document.querySelectorAll(".modal-overlay").forEach((el) => {
  el.addEventListener("click", (e) => {
    if (e.target === el) el.classList.remove("open");
  });
});

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function esc(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function elapsed(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60), s = diff % 60;
  return `${m}m ${s}s`;
}

function timeAgo(iso) {
  if (!iso) return "—";
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function showResult(el, type, msg) {
  el.textContent = msg;
  el.className = `result-box ${type}`;
  el.style.display = "block";
}

let toastTimer;
function showToast(msg, type = "success") {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.style.cssText = `position:fixed;bottom:24px;right:24px;padding:12px 18px;border-radius:8px;
      font-size:13px;font-weight:500;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.15);
      transition:opacity 0.2s;font-family:var(--font);`;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.background = type === "success" ? "#16a34a" : "#dc2626";
  toast.style.color = "#fff";
  toast.style.opacity = "1";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.style.opacity = "0"; }, 3500);
}
