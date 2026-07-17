

let currentAgentSession = null;
const adminEmail = localStorage.getItem("adminEmail") || sessionStorage.getItem("adminEmail") || "admin@aethon.edu";

document.addEventListener("DOMContentLoaded", () => {
  loadAgentSessions();
});

function openAgent() {
  document.getElementById("agent-overlay").classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeAgent() {
  document.getElementById("agent-overlay").classList.remove("show");
  document.body.style.overflow = "auto";
}

function newChat() {
  currentAgentSession = null;
  document.getElementById("agent-welcome").style.display = "flex";
  document.getElementById("agent-messages").style.display = "none";
  document.getElementById("agent-messages").innerHTML = "";
  document.querySelectorAll(".history-item").forEach(el => el.classList.remove("active"));
  document.querySelector(".agent-main").classList.remove("chat-active");
}

async function loadAgentSessions() {
  try {
    const res = await fetch(`/admin/agent/sessions?admin_email=${encodeURIComponent(adminEmail)}`);
    const sessions = await res.json();
    const list = document.getElementById("agent-history-list");
    list.innerHTML = "";
    
    sessions.forEach(s => {
      const item = document.createElement("div");
      item.className = "history-item";
      item.textContent = s.title;
      item.onclick = () => loadSessionHistory(s.id, item);
      list.appendChild(item);
    });
  } catch (err) {
    console.error("Failed to load sessions", err);
  }
}

async function loadSessionHistory(sessionId, elem) {
  currentAgentSession = sessionId;
  document.querySelectorAll(".history-item").forEach(el => el.classList.remove("active"));
  if (elem) elem.classList.add("active");

  document.getElementById("agent-welcome").style.display = "none";
  document.querySelector(".agent-main").classList.add("chat-active");
  const messagesContainer = document.getElementById("agent-messages");
  messagesContainer.style.display = "flex";
  messagesContainer.innerHTML = "<p style='text-align:center;color:#a1a1aa;'>Loading history...</p>";

  try {
    const res = await fetch(`/admin/agent/history/${sessionId}`);
    const messages = await res.json();
    messagesContainer.innerHTML = "";
    
    messages.forEach(msg => {
      appendMessage(msg.role, msg.content, false);
    });
    scrollToBottom();
  } catch (err) {
    messagesContainer.innerHTML = "<p style='color:#ef4444;'>Error loading history.</p>";
  }
}

function handleAgentEnter(e) {
  if (e.key === "Enter") {
    sendAgentMessage();
  }
}

function sendSuggested(prompt) {
  const input = document.getElementById("agent-input");
  input.value = prompt;
  sendAgentMessage();
}

async function sendAgentMessage() {
  const input = document.getElementById("agent-input");
  const prompt = input.value.trim();
  if (!prompt) return;

  input.value = "";
  
  document.getElementById("agent-welcome").style.display = "none";
  document.querySelector(".agent-main").classList.add("chat-active");
  const messagesContainer = document.getElementById("agent-messages");
  messagesContainer.style.display = "flex";

  appendMessage("user", prompt);
  scrollToBottom();

  const loadingId = "loading-" + Date.now();
  appendMessage("assistant", "<span class='dot'></span><span class='dot'></span><span class='dot'></span> Thinking...", false, loadingId);
  scrollToBottom();

  try {
    const res = await fetch("/admin/agent/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        admin_email: adminEmail,
        sessionId: currentAgentSession,
        prompt: prompt
      })
    });
    const data = await res.json();
    
    document.getElementById(loadingId).remove();
    
    if (data.error) {
      appendMessage("assistant", `Error: ${data.error}`);
    } else {
      currentAgentSession = data.sessionId;
      appendMessage("assistant", data.response);
      loadAgentSessions(); 
    }
  } catch (err) {
    document.getElementById(loadingId).remove();
    appendMessage("assistant", "Network error. Please try again.");
  }
  scrollToBottom();
}

function appendMessage(role, content, parseHTML = true, id = null) {
  const container = document.getElementById("agent-messages");
  const bubble = document.createElement("div");
  bubble.className = "msg-bubble " + (role === "user" ? "msg-user" : "msg-ai");
  if (id) bubble.id = id;

  if (role === "assistant") {
    
    if (content.includes("<table")) {
      const wrapperId = "table-wrap-" + Date.now();
      bubble.innerHTML = `
        <div class="export-tools">
          <button class="export-btn" onclick="exportAgentTable('${wrapperId}', 'pdf')"><i class="ri-file-pdf-line"></i> PDF</button>
          <button class="export-btn" onclick="exportAgentTable('${wrapperId}', 'excel')"><i class="ri-file-excel-line"></i> Excel</button>
          <button class="export-btn" onclick="exportAgentTable('${wrapperId}', 'word')"><i class="ri-file-word-line"></i> Word</button>
        </div>
        <div id="${wrapperId}" style="overflow-x:auto;">
          ${content}
        </div>
      `;
    } else {
      bubble.innerHTML = content;
    }
  } else {
    bubble.textContent = content;
  }
  
  container.appendChild(bubble);
}

function scrollToBottom() {
  const container = document.getElementById("agent-chat-container");
  container.scrollTop = container.scrollHeight;
}

function confirmAgentAction(encodedSql) {
  const input = document.getElementById("agent-input");
  input.value = "EXECUTE_CONFIRMED_SQL::" + encodedSql;
  sendAgentMessage();
}


function exportAgentTable(wrapperId, format) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;
  const table = wrapper.querySelector("table");
  if (!table) return;

  if (format === 'excel') {
    const wb = XLSX.utils.table_to_book(table, {sheet: "Data"});
    XLSX.writeFile(wb, "aethon_export.xlsx");
  } 
  else if (format === 'pdf') {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.autoTable({ html: table });
    doc.save("aethon_export.pdf");
  }
  else if (format === 'word') {
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Export HTML to Word</title></head><body>
      ${wrapper.innerHTML}
      </body></html>`;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'aethon_export.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
