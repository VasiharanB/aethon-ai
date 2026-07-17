

let currentTestId = null;
let currentPracticeId = null;
let cachedAssessments = [];

document.addEventListener("DOMContentLoaded", () => {
  fetchAssessmentsList();
  
  
  const now = new Date();
  const tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
  
  const startEl = document.getElementById("test_start_time");
  const endEl = document.getElementById("test_end_time");
  if (startEl) startEl.value = formatDateForInput(now);
  if (endEl) endEl.value = formatDateForInput(tomorrow);
});


function switchSubPanel(panelId, tabElement) {
  document.querySelectorAll(".sub-nav-tab").forEach(tab => tab.classList.remove("active"));
  tabElement.classList.add("active");
  
  document.querySelectorAll(".sub-panel").forEach(panel => panel.classList.remove("active"));
  document.getElementById(panelId).classList.add("active");
}


function fetchAssessmentsList() {
  fetch("/admin/assessments-list")
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        showErrorRow();
        return;
      }
      cachedAssessments = data;
      renderAssessments(data);
      updateAnalytics(data);
    })
    .catch(err => {
      console.error(err);
      showErrorRow();
    });
}

function renderAssessments(items) {
  const tbody = document.querySelector("#assessments-table tbody");
  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--gray-text); padding: 40px 0;">No assessments created yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(row => {
    let badgeClass = "badge active";
    if (row.status === "DRAFT") badgeClass = "badge draft";
    if (row.status === "COMPLETED") badgeClass = "badge completed";
    
    
    const rowJson = encodeURIComponent(JSON.stringify(row));
    
    return `
      <tr>
        <td>
          <div style="display: flex; flex-direction: column;">
            <span style="font-weight: 600; font-size: 15px;">${row.title}</span>
            <span style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--gray-text); margin-top: 3px;">${row.code}</span>
          </div>
        </td>
        <td style="color: var(--gray-text);">${row.category}</td>
        <td><span class="${badgeClass}">${row.status}</span></td>
        <td style="font-weight: 600;">${row.candidates} candidates</td>
        <td style="color: var(--gray-text);">${row.duration}</td>
        <td style="text-align: right;">
          <button class="btn-icon" onclick="openEditModal('${rowJson}')" title="Edit Assessment">
            <i class="ri-edit-line" style="color: var(--primary-hover); font-size: 16px;"></i>
          </button>
          <button class="btn-icon" onclick="openControlsFor('${row.id}', '${row.test_type}')" title="Manage Security Controls" style="margin-left: 4px;">
            <i class="ri-lock-2-line" style="color: var(--success); font-size: 16px;"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function updateAnalytics(items) {
  const totalEl = document.getElementById("stats-total-assessments");
  const candidatesEl = document.getElementById("stats-total-candidates");
  
  if (totalEl) totalEl.textContent = items.length;
  if (candidatesEl) {
    const totalCandidates = items.reduce((sum, item) => sum + (item.candidates || 0), 0);
    candidatesEl.textContent = totalCandidates;
  }
}

function searchAssessments() {
  const query = document.getElementById("assessments-search-input").value.toLowerCase();
  const filtered = cachedAssessments.filter(item => 
    item.title.toLowerCase().includes(query) || 
    item.code.toLowerCase().includes(query) ||
    item.category.toLowerCase().includes(query)
  );
  renderAssessments(filtered);
}

function showErrorRow() {
  const tbody = document.querySelector("#assessments-table tbody");
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger); padding: 40px 0;">Failed to fetch assessments from database.</td></tr>`;
  }
}


function generateEmailInputs(type) {
  const count = parseInt(document.getElementById(type + "_email_count").value);
  const box = document.getElementById(type + "_emailBox");
  box.innerHTML = "";

  if (!count || count <= 0) return;

  for (let i = 1; i <= count; i++) {
    box.innerHTML += `
      <input type="email" class="form-control ${type}EmailField" placeholder="Student Email ${i}" style="background-color: rgba(255,255,255,0.02); margin-top: 4px;">
    `;
  }
}


async function createAssessment(type) {
  const title = document.getElementById(type + "_title").value.trim();
  const msg = document.getElementById(type + "Msg");
  const emailInputs = document.querySelectorAll(`.${type}EmailField`);

  let emails = [];
  emailInputs.forEach(input => {
    if (input.value.trim() !== "") emails.push(input.value.trim());
  });

  msg.innerText = "";

  if (type === 'test') {
    const start_time = document.getElementById("test_start_time").value;
    const end_time = document.getElementById("test_end_time").value;
    const description = document.getElementById("test_description").value.trim();
    const total_time = document.getElementById("test_time").value;

    if (!title || !start_time || !end_time || !total_time) {
      msg.style.color = "var(--danger)";
      msg.innerText = "Fill all fields";
      return;
    }

    try {
      const res = await fetch("/create-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, start_time, end_time, description, total_time, emails: emails.join(",")
        })
      });
      const data = await res.json();
      if (data.success) {
        currentTestId = data.testId;
        msg.style.color = "var(--success)";
        msg.innerText = "Test Created Successfully. You can now upload questions below.";
        
        
        fetchAssessmentsList();
      } else {
        msg.style.color = "var(--danger)";
        msg.innerText = "Failed To Create";
      }
    } catch (error) {
      msg.style.color = "var(--danger)"; msg.innerText = "Server Error";
    }

  } else {
    
    if (!title) {
      msg.style.color = "var(--danger)";
      msg.innerText = "Title is required";
      return;
    }

    try {
      const res = await fetch("/create-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, emails: emails.join(",") })
      });
      const data = await res.json();
      if (data.success) {
        currentPracticeId = data.practiceId;
        msg.style.color = "var(--success)";
        msg.innerText = "Practice Created Successfully. You can now upload questions below.";
        
        
        fetchAssessmentsList();
      } else {
        msg.style.color = "var(--danger)";
        msg.innerText = "Failed To Create";
      }
    } catch (error) {
      msg.style.color = "var(--danger)"; msg.innerText = "Server Error";
    }
  }
}


async function saveJsonQuestions(type) {
  const msg = document.getElementById(type + "_jsonMsg");
  msg.innerText = "";

  const targetId = type === 'test' ? currentTestId : currentPracticeId;

  if (!targetId) {
    msg.style.color = "var(--danger)";
    msg.innerText = `Create ${type === 'test' ? 'Test' : 'Practice'} First`;
    return;
  }

  const file = document.getElementById(type + "_jsonFile").files[0];
  if (!file) {
    msg.style.color = "var(--danger)";
    msg.innerText = "Choose JSON File";
    return;
  }

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const questions = JSON.parse(e.target.result);
      if (!Array.isArray(questions)) {
        msg.style.color = "var(--danger)";
        msg.innerText = "JSON Must Be Array";
        return;
      }

      const endpoint = type === 'test' ? "/save-question" : "/save-practice-question";
      const payload = type === 'test' 
        ? { assessment_id: targetId, questions: questions }
        : { practice_id: targetId, questions: questions };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        msg.style.color = "var(--success)";
        msg.innerText = "Questions Uploaded Successfully!";
      } else {
        msg.style.color = "var(--danger)";
        msg.innerText = data.error || "Upload Failed";
      }
    } catch (error) {
      console.log(error);
      msg.style.color = "var(--danger)";
      msg.innerText = "Upload Failed";
    }
  };
  reader.readAsText(file);
}

function openControls() {
  if (!currentTestId) {
    alert("Create Test First");
    return;
  }
  window.open("control.html?id=" + currentTestId, "_blank");
}

function openControlsFor(id, testType) {
  if (testType === "practice_table") {
    alert("Practice sessions do not support strict security controls.");
    return;
  }
  window.open("control.html?id=" + id, "_blank");
}


function openEditModal(rowJson) {
  const row = JSON.parse(decodeURIComponent(rowJson));
  
  document.getElementById("edit-id").value = row.id;
  document.getElementById("edit-type").value = row.test_type;
  document.getElementById("edit-title").value = row.title;
  document.getElementById("editMsg").textContent = "";
  
  const descGroup = document.getElementById("edit-description-group");
  const startGroup = document.getElementById("edit-start-group");
  const endGroup = document.getElementById("edit-end-group");
  const durationGroup = document.getElementById("edit-duration-group");
  
  if (row.test_type === "practice_table") {
    
    descGroup.style.display = "none";
    startGroup.style.display = "none";
    endGroup.style.display = "none";
    durationGroup.style.display = "none";
  } else {
    descGroup.style.display = "flex";
    startGroup.style.display = "flex";
    endGroup.style.display = "flex";
    durationGroup.style.display = "flex";
    
    document.getElementById("edit-description").value = row.description || "";
    
    document.getElementById("edit-duration").value = parseInt(row.duration) || 60;
    
    if (row.start_time) {
      document.getElementById("edit-start").value = formatDateForInput(new Date(row.start_time));
    } else {
      document.getElementById("edit-start").value = "";
    }
    
    if (row.end_time) {
      document.getElementById("edit-end").value = formatDateForInput(new Date(row.end_time));
    } else {
      document.getElementById("edit-end").value = "";
    }
  }

  
  fetch(`/admin/assessment-emails?id=${row.id}&type=${row.test_type}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("edit-emails").value = data.emails || "";
    });

  document.getElementById("edit-assessment-modal").style.display = "flex";
}

function fetchAssessmentDetailsAndPrepopulate(id) {
  
  
  const match = cachedAssessments.find(a => a.id === id);
  
  
}

function closeEditModal() {
  document.getElementById("edit-assessment-modal").style.display = "none";
}

function submitEditAssessment() {
  const id = document.getElementById("edit-id").value;
  const test_type = document.getElementById("edit-type").value;
  const title = document.getElementById("edit-title").value.trim();
  const description = document.getElementById("edit-description").value.trim();
  const start_time = document.getElementById("edit-start").value;
  const end_time = document.getElementById("edit-end").value;
  const total_time = document.getElementById("edit-duration").value;
  const emails = document.getElementById("edit-emails").value.trim();
  const msgEl = document.getElementById("editMsg");

  if (!title) {
    msgEl.textContent = "Title is required.";
    msgEl.style.color = "var(--danger)";
    return;
  }

  fetch("/admin/update-assessment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id, title, description, start_time, end_time, total_time, emails, test_type
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      msgEl.textContent = "Changes saved successfully!";
      msgEl.style.color = "var(--success)";
      
      
      fetchAssessmentsList();
      setTimeout(closeEditModal, 1200);
    } else {
      msgEl.textContent = "Failed to save changes.";
      msgEl.style.color = "var(--danger)";
    }
  })
  .catch(err => {
    console.error(err);
    msgEl.textContent = "Error saving changes.";
    msgEl.style.color = "var(--danger)";
  });
}

function triggerDeleteAssessment() {
  const id = document.getElementById("edit-id").value;
  const test_type = document.getElementById("edit-type").value;
  const title = document.getElementById("edit-title").value;
  const msgEl = document.getElementById("editMsg");

  if (!confirm(`Are you absolutely sure you want to delete "${title}"? This cannot be undone.`)) {
    return;
  }

  fetch("/admin/delete-assessment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, test_type })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      msgEl.textContent = "Assessment deleted successfully!";
      msgEl.style.color = "var(--success)";
      
      
      fetchAssessmentsList();
      setTimeout(closeEditModal, 1200);
    } else {
      msgEl.textContent = "Failed to delete assessment.";
      msgEl.style.color = "var(--danger)";
    }
  })
  .catch(err => {
    console.error(err);
    msgEl.textContent = "Error deleting assessment.";
    msgEl.style.color = "var(--danger)";
  });
}


function formatDateForInput(date) {
  const pad = (num) => String(num).padStart(2, '0');
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}
