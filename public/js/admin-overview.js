let cachedAssessments = [];

document.addEventListener("DOMContentLoaded", () => {
  fetchDashboardStats();
  fetchRecentViolations();
  setupViewSwapping();
  
  setInterval(() => {
    fetchDashboardStats();
    fetchRecentViolations();
  }, 30000);
});

function setupViewSwapping() {
  const menuDashboard = document.getElementById("menu-dashboard");
  const menuAssessments = document.getElementById("menu-assessments");
  const toggleAssessments = document.getElementById("toggle-assessments");
  const quickManageAssessments = document.getElementById("quick-manage-assessments");
  const searchInput = document.getElementById("dashboard-assessments-search");

  if (menuDashboard) {
    menuDashboard.addEventListener("click", (e) => {
      e.preventDefault();
      showDashboardView();
    });
  }

  if (menuAssessments) {
    menuAssessments.addEventListener("click", (e) => {
      e.preventDefault();
      showAssessmentsView();
    });
  }

  if (toggleAssessments) {
    toggleAssessments.addEventListener("click", (e) => {
      e.preventDefault();
      showAssessmentsView();
    });
  }

  if (quickManageAssessments) {
    quickManageAssessments.addEventListener("click", (e) => {
      e.preventDefault();
      showAssessmentsView();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      searchAssessments(searchInput.value);
    });
  }
}

function showDashboardView() {
  // Update sidebar active class
  document.querySelectorAll(".sidebar-menu .menu-item").forEach(item => {
    item.classList.remove("active");
  });
  const menuDashboard = document.getElementById("menu-dashboard");
  if (menuDashboard) menuDashboard.classList.add("active");

  // Update top pill toggle active class
  const toggleAssessments = document.getElementById("toggle-assessments");
  if (toggleAssessments) toggleAssessments.classList.remove("active");

  // Update breadcrumb
  const breadcrumb = document.getElementById("breadcrumb-title");
  if (breadcrumb) breadcrumb.textContent = "Admin Overview";

  // Swap containers
  document.getElementById("dashboard-overview-view").style.display = "block";
  document.getElementById("dashboard-assessments-view").style.display = "none";
}

function showAssessmentsView() {
  // Update sidebar active class
  document.querySelectorAll(".sidebar-menu .menu-item").forEach(item => {
    item.classList.remove("active");
  });
  const menuAssessments = document.getElementById("menu-assessments");
  if (menuAssessments) menuAssessments.classList.add("active");

  // Update top pill toggle active class
  const toggleAssessments = document.getElementById("toggle-assessments");
  if (toggleAssessments) toggleAssessments.classList.add("active");

  // Update breadcrumb
  const breadcrumb = document.getElementById("breadcrumb-title");
  if (breadcrumb) breadcrumb.textContent = "Assessments";

  // Swap containers
  document.getElementById("dashboard-overview-view").style.display = "none";
  document.getElementById("dashboard-assessments-view").style.display = "block";

  // Fetch and display assessments
  fetchAssessments();
}

function fetchAssessments() {
  const tbody = document.querySelector("#dashboard-assessments-table tbody");
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--gray-text); padding: 40px 0;">Loading assessments...</td></tr>`;
  }

  fetch("/admin/assessments-list")
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        showErrorRow();
        return;
      }
      cachedAssessments = data;
      renderAssessments(data);
    })
    .catch(err => {
      console.error("Error fetching assessments:", err);
      showErrorRow();
    });
}

function renderAssessments(items) {
  const tbody = document.querySelector("#dashboard-assessments-table tbody");
  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--gray-text); padding: 40px 0;">No assessments created yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(row => {
    let badgeClass = "badge active";
    if (row.status === "DRAFT") badgeClass = "badge draft";
    if (row.status === "COMPLETED") badgeClass = "badge completed";
    
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
      </tr>
    `;
  }).join("");
}

function searchAssessments(query) {
  const lowerQuery = query.toLowerCase();
  const filtered = cachedAssessments.filter(item => 
    item.title.toLowerCase().includes(lowerQuery) || 
    item.code.toLowerCase().includes(lowerQuery) ||
    item.category.toLowerCase().includes(lowerQuery)
  );
  renderAssessments(filtered);
}

function showErrorRow() {
  const tbody = document.querySelector("#dashboard-assessments-table tbody");
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 40px 0;">Failed to load assessments from database.</td></tr>`;
  }
}

function fetchDashboardStats() {
  fetch("/admin/dashboard-stats")
    .then(res => res.json())
    .then(data => {
      if (data.error) return;

      setEl("stat-total-students", data.total_students);
      setEl("stat-active-tests", data.active_tests);
      setEl("stat-practice-sets", data.practice_sets);
      setEl("stat-questions", data.total_questions);
      setEl("stat-flags", data.proctoring_flags);

      setEl("stat-submissions", data.total_submissions);
      setEl("stat-avg-score", data.avg_score + "%");
      setEl("stat-feedback", data.total_feedback);
      setEl("stat-practices", data.practice_sets);

      setEl("summary-tests", data.active_tests);
      setEl("summary-practices", data.practice_sets);
      setEl("summary-students", data.total_students);
      setEl("summary-questions", data.total_questions);
      setEl("summary-submissions", data.total_submissions);
      setEl("summary-avg", data.avg_score + "%");
      setEl("summary-flags", data.proctoring_flags);
    })
    .catch(err => console.error("Error fetching admin stats:", err));
}

function setEl(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function fetchRecentViolations() {
  fetch("/admin/recent-violations")
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector("#recent-violations-table tbody");
      if (!tbody) return;
      
      if (data.error || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--gray-text); padding: 40px 0;">No recent security events found.</td></tr>`;
        return;
      }
      
      tbody.innerHTML = data.map(row => {
        const timeFormatted = new Date(row.timestamp).toLocaleString("en-IN", {
          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
        });
        
        let severityClass = "badge active";
        if (row.severity === "High") severityClass = "badge flagged";
        else if (row.severity === "Critical") severityClass = "badge suspended";
        
        return `
          <tr>
            <td style="color: var(--gray-text); font-size: 12px;">${timeFormatted}</td>
            <td>
              <div class="user-cell">
                <div class="avatar-mini">${getInitials(row.student_name)}</div>
                <span class="user-name">${row.student_name}</span>
              </div>
            </td>
            <td style="color: var(--gray-text); font-size: 12px;">${row.student_email}</td>
            <td style="font-weight: 500;">${row.event_type}</td>
            <td><span class="${severityClass}">${row.severity}</span></td>
            <td><span class="badge inactive" style="font-size: 10px;">${row.status}</span></td>
          </tr>
        `;
      }).join("");
    })
    .catch(err => {
      console.error("Error fetching recent violations:", err);
      const tbody = document.querySelector("#recent-violations-table tbody");
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger); padding: 40px 0;">Failed to load security events.</td></tr>`;
      }
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
