document.addEventListener("DOMContentLoaded", () => {

  const container = document.getElementById("assessmentContainer");
  const searchInput = document.querySelector(".search");
  const filterButtons = document.querySelectorAll(".filters button");
  const modal = document.getElementById("detailsModal");
  const modalBody = document.getElementById("modalBody");
  const closeBtn = document.getElementById("closeModal");

  let assessments = [];
  let currentFilter = "All";

  const userEmail =
    localStorage.getItem("userEmail") ||
    sessionStorage.getItem("userEmail");

  if (!userEmail) {
    window.location.href = "login.html";
    return;
  }


  async function loadAssessments() {
    try {
      const res = await fetch(`/student-assessments?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();

      assessments = data.map(item => ({
        id: item.id,
        title: item.title,
        marks: item.marks,
        questions: item.questions,
        description: item.description || "Assessment created by admin",
        start_time: item.start_time,
        end_time: item.end_time,
        total_time: item.total_time,
        submitted: item.submitted || 0,
        started: item.started || 0,
        resume_count: item.resume_count || 0,
        feedback_given: item.feedback_given > 0,
        show_result: item.show_result !== null ? item.show_result : 1,
        score: item.score || 0,
        test_type: 'test'
      }));

      window.assessments = assessments;
      renderCards();

    } catch (error) {
      console.log(error);
      container.innerHTML = "<p style='color:red'>Unable to load assessments</p>";
    }
  }

  
  function getStatus(a) {
    const now = new Date();
    const start = new Date(a.start_time);
    const end = new Date(a.end_time);

    if (a.submitted == 1) return "Completed";
    if (now < start) return "Locked";
    if (now >= start && now <= end) return "Live";

    return "Missed";
  }

  function getStatusClass(status) {
    if (status === "Live") return "live";
    if (status === "Completed") return "completed";
    if (status === "Missed") return "missed";
    return "locked";
  }

  function formatDate(date) {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  
  function getButtons(a) {
    const status = getStatus(a);

    if (status === "Locked") {
      return `<button class="btn gray" disabled>Starts Soon</button>`;
    }

    if (status === "Live") {
      if (a.started === 1) {
        if (a.resume_count >= 1) {
          return `<button class="btn red" style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; cursor: not-allowed; width: 100%;" disabled>Resume Limit Reached</button>`;
        }
        return `<button class="btn orange" style="background: linear-gradient(135deg, #f97316, #ea580c); color: white; width: 100%;" onclick="startTest(${a.id}, '${a.test_type}')">Resume Test ↻</button>`;
      }
      return `<button class="btn green" onclick="startTest(${a.id}, '${a.test_type}')">Start ${a.test_type === 'practice' ? 'Practice' : 'Test'} →</button>`;
    }

    if (status === "Missed") {
      return `<button class="btn gray" disabled>Missed</button>`;
    }

    
    
    
    if (a.test_type === "practice") {
      return `
        <button class="btn" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 20px; font-weight: 500; cursor: pointer; width: 100%;" onclick="startTest(${a.id}, 'practice')">Finished - Redo Practice ↺</button>
      `;
    }

    if (!a.feedback_given) {
      return `
        <button class="btn" style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; background: linear-gradient(135deg, #f97316, #ea580c); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 20px; font-weight: 600; cursor: pointer;" onclick="window.location.href='collect-feedback.html?id=${a.id}'">Give Feedback <i class="ri-arrow-right-line"></i></button>
        <button class="btn" style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; background: rgba(255,255,255,0.05); color: #888; border: none; padding: 0.75rem 1.5rem; border-radius: 20px; font-weight: 600; cursor: not-allowed;">View Results <i class="ri-arrow-right-line"></i></button>
      `;
    }

    let resultsBtn = `<button class="btn violet" style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 20px; font-weight: 600; cursor: pointer;" onclick="window.location.href='results.html?id=${a.id}'">View Results <i class="ri-arrow-right-line"></i></button>`;
    
    if (a.show_result === 0) {
      resultsBtn = `<button class="btn" style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; background: rgba(255,255,255,0.05); color: #888; border: none; padding: 0.75rem 1.5rem; border-radius: 20px; font-weight: 600; cursor: not-allowed;">Results pending release</button>`;
    }

    return `
      <button class="btn" style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 20px; font-weight: 600; cursor: pointer;" onclick="window.location.href='view-feedback.html?id=${a.id}'">View Feedback <i class="ri-arrow-right-line"></i></button>
      ${resultsBtn}
    `;
  }

  
  function createCard(a) {

    const status = getStatus(a);
    const statusClass = getStatusClass(status);

    return `
    <div class="assessment-card">

      <div class="card-top">
        <h3>${a.title}</h3>
        <div class="status-badge ${statusClass}">
          ${status}
        </div>
      </div>

      <div class="tags">
        <span>Assessment</span>
        <span>${status}</span>
      </div>

      <div class="date">
        <i class="ri-calendar-line"></i>
        Start: ${formatDate(a.start_time)}
      </div>

      <p class="toggle-details"
         onclick="showDetails(${a.id})">
         Show Details
      </p>

      <div class="card-grid">

        <div>
          <p>Total Marks</p>
          <span>${a.marks}</span>
        </div>

        <div>
          <p>Questions</p>
          <span>${a.questions}</span>
        </div>

      </div>

      <div class="card-actions">
        ${getButtons(a)}
      </div>

    </div>
    `;
  }

  let currentSort = "Due Date";
  let sortOrder = "asc";
  const sortButtons = document.querySelectorAll(".sort button");

  
  function renderCards() {

    let filtered = [...assessments];

    if (currentFilter !== "All") {
      filtered = filtered.filter(a => {
        const status = getStatus(a);

        if (currentFilter === "Available") {
          return status === "Locked" || status === "Live";
        }
        if (currentFilter === "Feedback") {
          return status === "Completed" && !a.feedback_given;
        }

        return status === currentFilter;
      });
    }

    const key = searchInput.value.toLowerCase().trim();

    if (key !== "") {
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(key)
      );
    }

    
    filtered.sort((a, b) => {
      let comparison = 0;
      if (currentSort === "Due Date") {
        const dateA = new Date(a.end_time);
        const dateB = new Date(b.end_time);
        comparison = dateA - dateB;
      } else if (currentSort === "Title") {
        comparison = a.title.localeCompare(b.title);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    if (filtered.length === 0) {
      container.innerHTML =
        "<p style='color:#aaa'>No assessments found</p>";
      return;
    }

    container.innerHTML =
      filtered.map(createCard).join("");
  }

  
  if (searchInput) {
    searchInput.addEventListener("input", renderCards);
  }

  filterButtons.forEach(btn => {
    btn.onclick = () => {
      filterButtons.forEach(b =>
        b.classList.remove("active")
      );

      btn.classList.add("active");
      currentFilter = btn.innerText.trim();
      renderCards();
    };
  });

  sortButtons.forEach(btn => {
    btn.onclick = () => {
      const text = btn.innerText.trim();
      if (text.startsWith("Order")) {
        if (sortOrder === "asc") {
          sortOrder = "desc";
          btn.innerHTML = `Order: Z-A ↓`;
        } else {
          sortOrder = "asc";
          btn.innerHTML = `Order: A-Z ↑`;
        }
      } else {
        sortButtons.forEach(b => {
          if (!b.innerText.trim().startsWith("Order")) {
            b.classList.remove("active");
          }
        });
        btn.classList.add("active");
        currentSort = text;
      }
      renderCards();
    };
  });

  if (closeBtn && modal) {
    closeBtn.onclick = () => modal.classList.remove("show");

    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.classList.remove("show");
      }
    };
  }

  setInterval(renderCards, 30000);
  loadAssessments();

});


async function showDetails(id){

  try{

    const res = await fetch(`/assessment/${id}`);
    const data = await res.json();

    const c = data.controls || {};
    const assessmentObj = window.assessments ? window.assessments.find(a => a.id === id) : null;
    const score = assessmentObj ? assessmentObj.score : 0;

    document.getElementById("modalBody").innerHTML = `

      <div class="popup-header">
        <h2>${data.title}</h2>
      </div>

      <div class="popup-box">
        <h4>Description</h4>
        <p>${data.description || "No Description"}</p>
      </div>

      <div class="popup-box">
        <h4>Duration</h4>
        <p>${data.duration ? data.duration + ' Minutes' : 'N/A'}</p>
      </div>

      <div class="popup-box">
        <h4>Monitoring Features</h4>

        <div class="control-grid">

          ${tag("Screen Record", c.recordScreen)}
          ${tag("Webcam", c.recordWebcam)}
          ${tag("Microphone", c.recordWebmic)}
          ${tag("Copy Paste", c.preventCopyPaste)}
          ${tag("Tab Switch", c.preventTabSwitch)}
          ${tag("Fullscreen", c.requireFullscreen)}

        </div>

      </div>

      <div class="popup-box">
        <h4>Score</h4>
        <p>${score} / ${data.total_marks || 0} Marks</p>
      </div>

    `;

    document.getElementById("detailsModal")
      .classList.add("show");

  }catch(err){
    console.log(err);
    alert("Failed to load details");
  }
}


function closeDetails(){
  document
    .getElementById("detailsModal")
    .classList.remove("show");
}


async function startTest(id, type = 'test') {
  const currentEmail = localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail") || "guest@student.com";
  const currentName = localStorage.getItem("userName") || "Student";

  if (type === 'practice') {
    window.location.href = `https://aethon-ai-six.vercel.app/practice/${id}?email=${encodeURIComponent(currentEmail)}&name=${encodeURIComponent(currentName)}`;
    return;
  }

  const a = window.assessments ? window.assessments.find(item => item.id === id) : null;
  if (a && a.started === 1) {
    try {
      const resumeRes = await fetch("/resume-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessment_id: id, student_email: currentEmail })
      });
      const resumeData = await resumeRes.json();
      if (resumeData.success) {
        window.location.href = `https://aethon-ai-six.vercel.app/test/${id}?email=${encodeURIComponent(currentEmail)}&name=${encodeURIComponent(currentName)}&resumed=true`;
      } else {
        alert(resumeData.error || "You have already resumed once. You cannot resume again.");
        window.location.href = "submitted.html?id=" + id;
      }
    } catch (err) {
      console.error("Error resuming assessment:", err);
      alert("Something went wrong while resuming. Please try again.");
    }
  } else {
    window.location.href = "start.html?id=" + id;
  }
}



function tag(name, value){
  const enabled = Number(value) === 1;

  return `
    <span class="control-tag ${enabled ? "on" : "off"}">
      ${name}: ${enabled ? "On" : "Off"}
    </span>
  `;
}

