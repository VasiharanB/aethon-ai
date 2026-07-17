


(() => {
  const role = localStorage.getItem("role");
  const email = localStorage.getItem("userEmail");
  if (!email || role !== "admin") {
    window.location.replace("login.html");
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  
  const profileWidget = document.querySelector(".sidebar-profile");
  if (profileWidget) {
    const name = localStorage.getItem("userName") || "M. Shameem";
    const initials = name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    profileWidget.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="avatar">${initials}</div>
          <div class="profile-info">
            <span class="profile-name">${name}</span>
            <span class="profile-status">Ops Manager</span>
          </div>
        </div>
        <button onclick="logout()" style="background: transparent; border: none; color: var(--gray-text); cursor: pointer; font-size: 18px; padding: 4px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s;" title="Logout">
          <i class="ri-logout-box-r-line"></i>
        </button>
      </div>
    `;
  }

  
  const searchInput = document.querySelector(".header-search input");
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const query = searchInput.value.trim();
        if (query) {
          console.log(`Global search initiated for: ${query}`);
          
          if (window.location.pathname.includes("admin-students.html")) {
            filterStudentsTable(query);
          } else if (window.location.pathname.includes("admin-assessments.html")) {
            filterAssessmentsTable(query);
          } else if (window.location.pathname.includes("admin-violations.html")) {
            filterViolationsTable(query);
          }
        }
      }
    });
  }

  
  const bellBtn = document.querySelector(".bell-btn");
  if (bellBtn) {
    bellBtn.addEventListener("click", () => {
      alert("No new critical platform alerts.");
    });
  }
});


function filterStudentsTable(query) {
  const rows = document.querySelectorAll(".custom-table tbody tr");
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query.toLowerCase()) ? "" : "none";
  });
}

function filterAssessmentsTable(query) {
  const rows = document.querySelectorAll(".custom-table tbody tr");
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query.toLowerCase()) ? "" : "none";
  });
}

function filterViolationsTable(query) {
  const rows = document.querySelectorAll(".custom-table tbody tr");
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query.toLowerCase()) ? "" : "none";
  });
}

function logout() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.replace("login.html");
}

