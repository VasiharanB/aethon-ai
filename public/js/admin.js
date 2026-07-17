let currentTestId = null;
let currentPracticeId = null;


function switchTab(tabId, element) {
  
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  element.classList.add('active');

  
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
}


document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab");
  if (tab) {
    const tabEl = document.querySelector(`.nav-item[onclick*="'${tab}'"]`);
    if (tabEl) {
      switchTab(tab, tabEl);
    }
  }
});


function generateEmailInputs(type) {
  const count = parseInt(document.getElementById(type + "_email_count").value);
  const box = document.getElementById(type + "_emailBox");
  box.innerHTML = "";

  if (!count || count <= 0) return;

  for (let i = 1; i <= count; i++) {
    box.innerHTML += `
      <input type="email" class="field ${type}EmailField" placeholder="Student Email ${i}">
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
      msg.style.color = "#ff6b6b";
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
        msg.style.color = "#22c55e";
        msg.innerText = "Test Created Successfully";
      } else {
        msg.style.color = "#ff6b6b";
        msg.innerText = "Failed To Create";
      }
    } catch (error) {
      msg.style.color = "#ff6b6b"; msg.innerText = "Server Error";
    }

  } else {
    
    if (!title) {
      msg.style.color = "#ff6b6b";
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
        msg.style.color = "#22c55e";
        msg.innerText = "Practice Created Successfully";
      } else {
        msg.style.color = "#ff6b6b";
        msg.innerText = "Failed To Create";
      }
    } catch (error) {
      msg.style.color = "#ff6b6b"; msg.innerText = "Server Error";
    }
  }
}


function openControls(){
  if(!currentTestId){
    alert("Create Test First");
    return;
  }
  window.open("control.html?id=" + currentTestId, "_blank");
}



async function saveJsonQuestions(type) {
  const msg = document.getElementById(type + "_jsonMsg");
  msg.innerText = "";

  const targetId = type === 'test' ? currentTestId : currentPracticeId;

  if (!targetId) {
    msg.style.color = "#ff6b6b";
    msg.innerText = `Create ${type === 'test' ? 'Test' : 'Practice'} First`;
    return;
  }

  const file = document.getElementById(type + "_jsonFile").files[0];
  if (!file) {
    msg.style.color = "#ff6b6b";
    msg.innerText = "Choose JSON File";
    return;
  }

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const questions = JSON.parse(e.target.result);
      if (!Array.isArray(questions)) {
        msg.style.color = "#ff6b6b";
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
        msg.style.color = "#22c55e";
        msg.innerText = "Questions Uploaded Successfully";
      } else {
        msg.style.color = "#ff6b6b";
        msg.innerText = data.error || "Upload Failed";
      }
    } catch (error) {
      console.log(error);
      msg.style.color = "#ff6b6b";
      msg.innerText = "Upload Failed";
    }
  };
  reader.readAsText(file);
}