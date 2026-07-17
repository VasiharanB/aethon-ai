const params = new URLSearchParams(window.location.search);
const id = params.get("id");

let securityCheckPassed = false;

function runSecurityCheck() {
  const container = document.querySelector(".system-check-container");
  const statusText = document.getElementById("systemCheckStatus");
  const checkBtn = document.getElementById("runCheckBtn");

  return new Promise((resolve) => {
    if (!document.documentElement.hasAttribute("data-aethon-extension-active")) {
      const errMessage = "The Aethon Exam Security Shield extension is not active. Please install and enable it.";
      statusText.innerHTML = `<span style="color: #ef4444;">${errMessage}</span>`;
      container.classList.remove("passed");
      container.classList.add("failed");
      securityCheckPassed = false;
      return resolve({ passed: false, error: errMessage });
    }

    statusText.innerText = "Scanning environment...";
    checkBtn.disabled = true;
    checkBtn.innerText = "Checking...";

    const handleResponse = (e) => {
      window.removeEventListener("AETHON_SCAN_RESPONSE", handleResponse);
      clearTimeout(timeout);
      checkBtn.disabled = false;
      checkBtn.innerText = "Run Check";
      
      const data = e.detail;
      if (data && data.status === "success") {
        if (data.forbiddenDetected && data.forbiddenDetected.length > 0) {
          const count = data.forbiddenDetected.length;
          statusText.innerHTML = `<span style="color: #ef4444; font-weight: 600;">Extension Found: ${count}</span>`;
          container.classList.remove("passed");
          container.classList.add("failed");
          securityCheckPassed = false;
          return resolve({ passed: false, count: count, list: data.forbiddenDetected });
        }
        
        statusText.innerHTML = `<span style="color: #10b981; font-weight: 600;">Checked: No extension is detected.</span>`;
        container.classList.remove("failed");
        container.classList.add("passed");
        securityCheckPassed = true;
        return resolve({ passed: true });
      } else {
        const err = "Security shield returned an invalid response. Please reload and try again.";
        statusText.innerHTML = `<span style="color: #ef4444;">${err}</span>`;
        container.classList.remove("passed");
        container.classList.add("failed");
        securityCheckPassed = false;
        return resolve({ passed: false, error: err });
      }
    };

    window.addEventListener("AETHON_SCAN_RESPONSE", handleResponse);
    window.dispatchEvent(new CustomEvent("AETHON_SCAN_REQUEST"));

    const timeout = setTimeout(() => {
      window.removeEventListener("AETHON_SCAN_RESPONSE", handleResponse);
      checkBtn.disabled = false;
      checkBtn.innerText = "Run Check";
      
      const err = "Connection timed out. Please check if the extension is enabled.";
      statusText.innerHTML = `<span style="color: #ef4444;">${err}</span>`;
      container.classList.remove("passed");
      container.classList.add("failed");
      securityCheckPassed = false;
      resolve({ passed: false, error: err });
    }, 1500);
  });
}

document.getElementById("runCheckBtn").onclick = function() {
  runSecurityCheck();
};

document.getElementById("startBtn").onclick = async function () {
  const email = localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail") || "";
  const name = localStorage.getItem("userName") || "Student";
  
  if (!securityCheckPassed) {
    const check = await runSecurityCheck();
    if (!check.passed) {
      alert("System check failed. Please resolve all extension violations before starting the assessment.");
      return;
    }
  }

  try {
    const statusRes = await fetch(`/assessment-status/${id}/${encodeURIComponent(email)}`);
    const statusData = await statusRes.json();
    
    if (statusData.error) {
      alert(statusData.error);
      return;
    }

    if (statusData.submitted === 1 || statusData.auto_submitted === 1) {
      alert("This assessment has already been submitted.");
      window.location.href = "dashboard.html";
      return;
    }

    if (statusData.started === 0) {
      // First start
      const startRes = await fetch("/start-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessment_id: id, student_email: email })
      });
      const startData = await startRes.json();
      if (!startData.success) {
        alert("Failed to start assessment. Please try again.");
        return;
      }
      window.location.href = `http://localhost:5173/test/${id}?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`;
    } else {
      // Resume assessment attempt
      const resumeRes = await fetch("/resume-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessment_id: id, student_email: email })
      });
      const resumeData = await resumeRes.json();
      if (resumeData.success) {
        window.location.href = `http://localhost:5173/test/${id}?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&resumed=true`;
      } else {
        alert(resumeData.error || "You have already resumed once. You cannot resume again.");
        window.location.href = "submitted.html?id=" + id;
      }
    }
  } catch (err) {
    console.error("Error initiating assessment:", err);
    // fallback
    window.location.href = `http://localhost:5173/test/${id}?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`;
  }
};

async function loadStartPage(){
  try{
    if(!id){
      alert("Invalid assessment ID");
      return;
    }

    const res = await fetch("/assessment/" + id);
    const data = await res.json();

    console.log("FULL DATA:", data);
    console.log("CONTROLS:", data.controls);

    if(data.error){
      alert("Failed to load details");
      return;
    }

    document.getElementById("title").innerText =
      data.title || "Untitled";

    document.getElementById("duration").innerText =
      data.duration ?? 0;

    document.getElementById("questions").innerText =
      data.questions ?? 0;

    document.getElementById("marks").innerText =
      data.total_marks ?? 0;

    const controls = data.controls || {};

    const features = [
      {name:"Fullscreen", key:"requireFullscreen", icon:"ri-fullscreen-line"},
      {name:"Tab Switch", key:"preventTabSwitch", icon:"ri-window-line"},
      {name:"Copy Paste", key:"preventCopyPaste", icon:"ri-file-copy-line"},
      {name:"Webcam", key:"recordWebcam", icon:"ri-camera-line"},
      {name:"Microphone", key:"recordWebmic", icon:"ri-mic-line"},
      {name:"Screen Record", key:"recordScreen", icon:"ri-macbook-line"}
    ];

    const container = document.getElementById("featuresContainer");
    container.innerHTML = "";

    features.forEach(f => {
      const enabled = Number(controls[f.key]) === 1;

      container.innerHTML += `
        <div class="feature ${enabled ? "enabled" : "disabled"}">
          <i class="${f.icon}"></i>
          <div>
            <strong>${f.name}</strong><br>
            ${enabled ? "Enabled" : "Disabled"}
          </div>
        </div>
      `;
    });

    // Fetch student status for this assessment
    const email = localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail") || "";
    if (email) {
      const statusRes = await fetch(`/assessment-status/${id}/${encodeURIComponent(email)}`);
      const statusData = await statusRes.json();
      
      const startBtn = document.getElementById("startBtn");
      if (statusData && !statusData.error) {
        if (statusData.submitted === 1 || statusData.auto_submitted === 1) {
          startBtn.innerText = "Assessment Submitted";
          startBtn.disabled = true;
          startBtn.style.background = "linear-gradient(135deg, #4b5563, #374151)";
          startBtn.style.cursor = "not-allowed";
        } else if (statusData.started === 1) {
          if (statusData.resume_count >= 1) {
            startBtn.innerText = "Resume Limit Reached";
            startBtn.disabled = true;
            startBtn.style.background = "linear-gradient(135deg, #dc2626, #b91c1c)";
            startBtn.style.cursor = "not-allowed";
          } else {
            startBtn.innerText = "Resume Assessment (1 Attempt Remaining) →";
            startBtn.style.background = "linear-gradient(135deg, #f97316, #ea580c)";
          }
        }
      }
    }

  }catch(err){
    console.error("ERROR:", err);
    alert("Something went wrong while loading");
  }
}

loadStartPage();
