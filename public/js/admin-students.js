

document.addEventListener("DOMContentLoaded", () => {
  fetchStudentsList();
});

let cachedStudents = [];

function fetchStudentsList() {
  fetch("/admin/students")
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        showErrorRow();
        return;
      }
      cachedStudents = data;
      renderStudents(data);
    })
    .catch(err => {
      console.error("Error fetching students:", err);
      showErrorRow();
    });
}

let selectedStudent = null;

function renderStudents(students) {
  const tbody = document.querySelector("#students-table tbody");
  if (!tbody) return;

  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--gray-text); padding: 40px 0;">No student accounts registered in system.</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(row => {
    let badgeClass = "badge active";
    if (row.status === "FLAGGED") badgeClass = "badge flagged";
    if (row.status === "SUSPENDED") badgeClass = "badge suspended";
    if (row.status === "INACTIVE") badgeClass = "badge inactive";
    
    const rowJson = encodeURIComponent(JSON.stringify(row));
    return `
      <tr>
        <td>
          <div class="user-cell" style="cursor: pointer;" onclick="openStudentDetailsModal('${rowJson}')">
            <div class="avatar-mini">${getInitials(row.name)}</div>
            <div class="user-name-block">
              <span class="user-name" style="text-decoration: underline; text-underline-offset: 3px;">${row.name}</span>
              <span class="user-email">${row.email}</span>
            </div>
          </div>
        </td>
        <td style="font-family: 'JetBrains Mono', monospace; font-weight: 600;">${row.student_id}</td>
        <td><span class="${badgeClass}">${row.status}</span></td>
        <td style="font-weight: 600;">${row.avg_score}</td>
        <td style="color: var(--gray-text);">${row.last_active}</td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button class="btn-outline" style="font-size: 11px; padding: 4px 10px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;" onclick="openEditStudentModal('${rowJson}')">
              <i class="ri-edit-line"></i> Edit
            </button>
            <button class="btn-primary" style="font-size: 11px; padding: 4px 10px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;" onclick="openStudentDetailsModal('${rowJson}')">
              <i class="ri-folder-user-line"></i> Profile
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function openStudentDetailsModal(rowJson) {
  const student = JSON.parse(decodeURIComponent(rowJson));
  selectedStudent = student;
  
  document.getElementById("details-avatar").textContent = getInitials(student.name);
  document.getElementById("details-name").textContent = student.name;
  
  const statusBadge = document.getElementById("details-status-badge");
  statusBadge.textContent = student.status;
  statusBadge.className = "badge " + student.status.toLowerCase();
  
  document.getElementById("details-roll").textContent = student.student_id || "N/A";
  document.getElementById("details-email").textContent = student.email || "N/A";
  document.getElementById("details-dob").textContent = student.dob || "N/A";
  document.getElementById("details-phone").textContent = student.personal_number || "N/A";
  document.getElementById("details-college").textContent = student.college_name || "N/A";
  document.getElementById("details-joining").textContent = student.joining_year || "N/A";
  document.getElementById("details-passing").textContent = student.passing_year || "N/A";
  document.getElementById("details-score").textContent = student.avg_score || "0%";
  document.getElementById("details-active").textContent = student.last_active || "Active";
  
  document.getElementById("student-details-modal").style.display = "flex";
}

function closeStudentDetailsModal() {
  document.getElementById("student-details-modal").style.display = "none";
}

function openEditStudentModal(rowJson) {
  const student = JSON.parse(decodeURIComponent(rowJson));
  selectedStudent = student;
  
  document.getElementById("edit-student-name").value = student.name || "";
  document.getElementById("edit-student-email").value = student.email || "";
  document.getElementById("edit-student-roll").value = (student.student_id && !student.student_id.startsWith("STD-")) ? student.student_id : "";
  document.getElementById("edit-student-phone").value = student.personal_number !== "N/A" ? student.personal_number : "";
  document.getElementById("edit-student-dob").value = student.dob !== "N/A" ? student.dob : "";
  document.getElementById("edit-student-college").value = student.college_name !== "N/A" ? student.college_name : "";
  document.getElementById("edit-student-joining").value = student.joining_year !== "N/A" ? student.joining_year : "";
  document.getElementById("edit-student-passing").value = student.passing_year !== "N/A" ? student.passing_year : "";
  
  document.getElementById("editStudentMsg").textContent = "";
  document.getElementById("editStudentMsg").style.color = "";
  document.getElementById("edit-student-modal").style.display = "flex";
}

function closeEditStudentModal() {
  document.getElementById("edit-student-modal").style.display = "none";
}

function openEditStudentFromDetails() {
  if (!selectedStudent) return;
  closeStudentDetailsModal();
  openEditStudentModal(encodeURIComponent(JSON.stringify(selectedStudent)));
}

function submitEditStudent() {
  const nameInput = document.getElementById("edit-student-name");
  const emailInput = document.getElementById("edit-student-email");
  const rollInput = document.getElementById("edit-student-roll");
  const dobInput = document.getElementById("edit-student-dob");
  const phoneInput = document.getElementById("edit-student-phone");
  const collegeInput = document.getElementById("edit-student-college");
  const joiningInput = document.getElementById("edit-student-joining");
  const passingInput = document.getElementById("edit-student-passing");
  const msgEl = document.getElementById("editStudentMsg");

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const roll_number = rollInput.value.trim();
  const dob = dobInput.value;
  const personal_number = phoneInput.value.trim();
  const college_name = collegeInput.value.trim();
  const joining_year = joiningInput.value.trim();
  const passing_year = passingInput.value.trim();

  if (!name || !email) {
    msgEl.textContent = "Name is required.";
    msgEl.style.color = "var(--danger)";
    return;
  }

  fetch("/admin/edit-student", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, dob, roll_number, personal_number, college_name, joining_year, passing_year })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      msgEl.textContent = "Student details updated successfully!";
      msgEl.style.color = "var(--success)";
      fetchStudentsList();
      setTimeout(closeEditStudentModal, 1500);
    } else {
      msgEl.textContent = data.error || "Failed to update details.";
      msgEl.style.color = "var(--danger)";
    }
  })
  .catch(err => {
    console.error(err);
    msgEl.textContent = "Server error occurred.";
    msgEl.style.color = "var(--danger)";
  });
}

function searchStudents() {
  const query = document.getElementById("students-search-input").value.toLowerCase();
  const filtered = cachedStudents.filter(s => 
    s.name.toLowerCase().includes(query) || 
    s.email.toLowerCase().includes(query) ||
    s.student_id.toLowerCase().includes(query) ||
    (s.college_name && s.college_name.toLowerCase().includes(query))
  );
  renderStudents(filtered);
}

function showErrorRow() {
  const tbody = document.querySelector("#students-table tbody");
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger); padding: 40px 0;">Failed to fetch students from server database.</td></tr>`;
  }
}


function openAddStudentModal() {
  document.getElementById("add-student-modal").style.display = "flex";
  document.getElementById("addStudentMsg").textContent = "";
  document.getElementById("addStudentMsg").style.color = "";
}


function closeAddStudentModal() {
  document.getElementById("add-student-modal").style.display = "none";
}

function submitAddStudent() {
  const nameInput = document.getElementById("new-student-name");
  const emailInput = document.getElementById("new-student-email");
  const passwordInput = document.getElementById("new-student-password");
  const rollInput = document.getElementById("new-student-roll");
  const dobInput = document.getElementById("new-student-dob");
  const phoneInput = document.getElementById("new-student-phone");
  const collegeInput = document.getElementById("new-student-college");
  const joiningInput = document.getElementById("new-student-joining");
  const passingInput = document.getElementById("new-student-passing");
  const msgEl = document.getElementById("addStudentMsg");

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const roll_number = rollInput.value.trim();
  const dob = dobInput.value;
  const personal_number = phoneInput.value.trim();
  const college_name = collegeInput.value.trim();
  const joining_year = joiningInput.value.trim();
  const passing_year = passingInput.value.trim();

  if (!name || !email || !password) {
    msgEl.textContent = "Name, Email and Temp Password are required.";
    msgEl.style.color = "var(--danger)";
    return;
  }

  fetch("/admin/add-student", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, dob, roll_number, personal_number, college_name, joining_year, passing_year })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      msgEl.textContent = "Student account created successfully!";
      msgEl.style.color = "var(--success)";
      
      nameInput.value = "";
      emailInput.value = "";
      passwordInput.value = "";
      rollInput.value = "";
      dobInput.value = "";
      phoneInput.value = "";
      collegeInput.value = "";
      joiningInput.value = "";
      passingInput.value = "";
      
      fetchStudentsList();
      setTimeout(closeAddStudentModal, 1500);
    } else {
      msgEl.textContent = data.error || "Failed to create account.";
      msgEl.style.color = "var(--danger)";
    }
  })
  .catch(err => {
    console.error(err);
    msgEl.textContent = "Server error occurred.";
    msgEl.style.color = "var(--danger)";
  });
}

function getInitials(name) {
  if (!name) return "ST";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}
