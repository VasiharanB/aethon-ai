

function switchSettingsPane(paneId, buttonElement) {
  
  document.querySelectorAll(".settings-tab-btn").forEach(btn => btn.classList.remove("active"));
  buttonElement.classList.add("active");

  
  document.querySelectorAll(".settings-pane").forEach(pane => pane.classList.remove("active"));
  document.getElementById(paneId).classList.add("active");
}

let isKeyRevealed = false;
function revealKey() {
  const textEl = document.getElementById("api-key-text");
  const btnIcon = document.querySelector("#api-reveal-btn i");

  isKeyRevealed = !isKeyRevealed;
  if (isKeyRevealed) {
    textEl.textContent = "ae_live_8392hd92kd8391";
    btnIcon.className = "ri-eye-off-line";
  } else {
    textEl.textContent = "••••••••••••••••••••••••••••••••";
    btnIcon.className = "ri-eye-line";
  }
}

function saveConfig() {
  alert("Settings configuration saved successfully!");
}

function toggleRule(ruleName) {
  console.log(`Security policy rule adjusted: ${ruleName}`);
}
