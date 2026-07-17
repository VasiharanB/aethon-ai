

let cachedViolations = [];

document.addEventListener("DOMContentLoaded", () => {
  fetchViolationsList();
});

function fetchViolationsList() {
  fetch("/admin/violations-list")
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        showErrorRow();
        return;
      }
      cachedViolations = data;
      renderViolations(data);
      updateAlertStats(data);
    })
    .catch(err => {
      console.error(err);
      showErrorRow();
    });
}

function renderViolations(items) {
  const tbody = document.querySelector("#violations-table tbody");
  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--gray-text); padding: 40px 0;">No security violations detected.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(row => {
    let severityClass = "badge active"; 
    if (row.severity === "HIGH") {
      severityClass = "badge flagged";
    } else if (row.severity === "CRITICAL") {
      severityClass = "badge suspended";
    }

    const rowJson = encodeURIComponent(JSON.stringify(row));
    
    
    let statusActionHtml = `<span class="badge inactive">Resolved</span>`;
    if (row.status === "Review") {
      statusActionHtml = `
        <button class="btn-primary" style="font-size: 11px; padding: 4px 10px; border-radius: 6px;" onclick="openReviewModal('${rowJson}')">
          <i class="ri-play-circle-line"></i> Review
        </button>
      `;
    }

    return `
      <tr>
        <td style="font-family: 'JetBrains Mono', monospace; font-weight: 600;">${row.id}</td>
        <td style="font-weight: 600;">${row.event_type}</td>
        <td><span class="${severityClass}">${row.severity}</span></td>
        <td>
          <div class="user-cell">
            <div class="avatar-mini">${getInitials(row.student_name)}</div>
            <div class="user-name-block">
              <span class="user-name">${row.student_name}</span>
              <span class="user-email">${row.student_email}</span>
            </div>
          </div>
        </td>
        <td style="color: var(--gray-text);">${row.time}</td>
        <td style="text-align: right;">${statusActionHtml}</td>
      </tr>
    `;
  }).join("");
}

function updateAlertStats(items) {
  const criticalEl = document.getElementById("critical-alert-count");
  const unresolvedEl = document.getElementById("unresolved-alert-count");

  const criticalCount = items.filter(i => i.severity === "CRITICAL").length;
  const unresolvedCount = items.filter(i => i.status === "Review").length;

  if (criticalEl) criticalEl.textContent = criticalCount;
  if (unresolvedEl) unresolvedEl.textContent = unresolvedCount;
}

function searchViolations() {
  const query = document.getElementById("violations-search-input").value.toLowerCase();
  const filtered = cachedViolations.filter(v => 
    v.event_type.toLowerCase().includes(query) || 
    v.student_name.toLowerCase().includes(query) || 
    v.student_email.toLowerCase().includes(query) ||
    v.id.toLowerCase().includes(query)
  );
  renderViolations(filtered);
}

function showErrorRow() {
  const tbody = document.querySelector("#violations-table tbody");
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger); padding: 40px 0;">Failed to fetch proctoring logs.</td></tr>`;
  }
}


function openReviewModal(rowJson) {
  const row = JSON.parse(decodeURIComponent(rowJson));
  
  document.getElementById("review-modal-title-id").textContent = row.id;
  document.getElementById("review-email").textContent = row.student_email;
  document.getElementById("review-name").textContent = row.student_name;
  
  const typeEl = document.getElementById("review-type");
  typeEl.textContent = row.event_type;
  if (row.severity === "CRITICAL") {
    typeEl.style.color = "var(--danger)";
  } else {
    typeEl.style.color = "var(--warning)";
  }
  
  document.getElementById("review-severity").textContent = row.severity;
  
  const videoWrapper = document.getElementById("video-wrapper");
  if (row.file_path) {
    
    videoWrapper.innerHTML = `
      <video src="${row.file_path}" controls autoplay style="width: 100%; border-radius: 12px; border: 1px solid var(--border-color); background-color: #000; max-height: 240px;"></video>
    `;
  } else {
    videoWrapper.innerHTML = `
      <div style="position: relative; width: 100%; height: 220px; background-color: #000; border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color);">
        <canvas id="violation-simulator-canvas" width="400" height="220" style="width: 100%; height: 100%; display: block;"></canvas>
        <div style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); padding: 4px 8px; border-radius: 4px; font-size: 10px; color: #f87171; font-family: monospace; border: 1px solid rgba(239,68,68,0.3); z-index: 10;">
          REPLAYING SIMULATED TELEMETRY
        </div>
      </div>
    `;
    startViolationSimulation(row.event_type);
  }
  
  document.getElementById("review-modal").style.display = "flex";
}

let violationSimFrameId = null;

function startViolationSimulation(eventType) {
  if (violationSimFrameId) {
    cancelAnimationFrame(violationSimFrameId);
  }

  const canvas = document.getElementById("violation-simulator-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  let step = 0;

  function animate() {
    step += 1;
    if (!document.getElementById("violation-simulator-canvas")) return; 

    ctx.clearRect(0, 0, w, h);

    
    ctx.fillStyle = "#09090e";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    const gridGap = 20;
    for (let x = 0; x < w; x += gridGap) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += gridGap) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    
    const cycle = step % 240;
    let gazeState = "normal";
    const typeUpper = eventType.toUpperCase();

    if (typeUpper.includes("TAB") || typeUpper.includes("COPY") || typeUpper.includes("CLIPBOARD") || typeUpper.includes("FOCUS")) {
      gazeState = cycle > 120 ? "unfocused" : "normal";
    } else if (typeUpper.includes("FACE") || typeUpper.includes("CAM") || typeUpper.includes("GAZE") || typeUpper.includes("VIOLATION") || typeUpper.includes("EYE")) {
      if (cycle > 120) {
        gazeState = typeUpper.includes("MULTIPLE") ? "multiple" : (typeUpper.includes("NO") ? "missing" : "look-away");
      }
    } else {
      gazeState = cycle > 120 ? "look-away" : "normal";
    }

    
    let fx = w / 2;
    let fy = h / 2 - 10;

    
    if (gazeState !== "missing") {
      
      ctx.strokeStyle = gazeState === "normal" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(fx, fy, 45, 0, Math.PI * 2);
      ctx.stroke();

      
      ctx.strokeStyle = gazeState === "normal" ? "rgba(52, 211, 153, 0.3)" : "rgba(248, 113, 113, 0.3)";
      ctx.fillStyle = gazeState === "normal" ? "rgba(52, 211, 153, 0.7)" : "rgba(248, 113, 113, 0.7)";
      ctx.lineWidth = 0.5;

      
      let eyeOffsetX = 0;
      let eyeOffsetY = 0;
      if (gazeState === "look-away") {
        eyeOffsetX = 20; 
        eyeOffsetY = -5;
      }

      const landmarks = [
        { x: fx + eyeOffsetX, y: fy + eyeOffsetY },
        { x: fx - 18 + eyeOffsetX, y: fy - 12 + eyeOffsetY },
        { x: fx + 18 + eyeOffsetX, y: fy - 12 + eyeOffsetY },
        { x: fx - 10 + eyeOffsetX, y: fy + 16 + eyeOffsetY },
        { x: fx + 10 + eyeOffsetX, y: fy + 16 + eyeOffsetY },
        { x: fx + eyeOffsetX, y: fy + 22 + eyeOffsetY }
      ];

      
      ctx.beginPath();
      ctx.moveTo(landmarks[1].x, landmarks[1].y);
      ctx.lineTo(landmarks[2].x, landmarks[2].y);
      ctx.lineTo(landmarks[0].x, landmarks[0].y);
      ctx.closePath();
      ctx.moveTo(landmarks[0].x, landmarks[0].y);
      ctx.lineTo(landmarks[3].x, landmarks[3].y);
      ctx.lineTo(landmarks[5].x, landmarks[5].y);
      ctx.lineTo(landmarks[4].x, landmarks[4].y);
      ctx.closePath();
      ctx.stroke();

      
      landmarks.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      
      if (gazeState === "look-away") {
        ctx.strokeStyle = "#f87171";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(fx, fy - 12);
        ctx.lineTo(fx + 65, fy - 22);
        ctx.stroke();
        ctx.fillStyle = "#f87171";
        ctx.beginPath();
        ctx.moveTo(fx + 65, fy - 22);
        ctx.lineTo(fx + 55, fy - 26);
        ctx.lineTo(fx + 57, fy - 16);
        ctx.closePath();
        ctx.fill();
      }

      
      if (gazeState === "multiple") {
        let f2x = fx - 75;
        let f2y = fy + 15;
        ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
        ctx.beginPath();
        ctx.arc(f2x, f2y, 25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = "8px monospace";
        ctx.fillStyle = "#f87171";
        ctx.fillText("PEOPLE: 2 DETECTED", f2x - 30, f2y + 35);
      }
    }

    
    ctx.lineWidth = 1.5;
    if (gazeState === "normal") {
      ctx.strokeStyle = "#10b981";
      ctx.strokeRect(fx - 60, fy - 60, 120, 120);
      
      ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
      ctx.fillRect(8, 8, 140, 36);
      ctx.fillStyle = "#34d399";
      ctx.font = "bold 9px monospace";
      ctx.fillText("STATUS: SECURE", 14, 20);
      ctx.font = "8px monospace";
      ctx.fillText("EYE LOCK: LOCKED (99%)", 14, 30);
      ctx.fillText("ENVIRONMENT: COMPLIANT", 14, 38);
    } else {
      ctx.strokeStyle = "#ef4444";
      if (gazeState !== "missing") {
        ctx.strokeRect(fx - 60, fy - 60, 120, 120);
      }

      ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
      ctx.fillRect(8, 8, 180, 42);
      ctx.fillStyle = "#f87171";
      ctx.font = "bold 9px monospace";
      ctx.fillText("STATUS: FLAG ANOMALY", 14, 20);
      ctx.font = "8px monospace";
      
      if (gazeState === "unfocused") {
        ctx.fillText("LOG: TAB/WINDOW BLUR DETECTED", 14, 30);
        ctx.fillText("VIOLATION: ACTIVE SCREEN ESCAPE", 14, 38);
      } else if (gazeState === "look-away") {
        ctx.fillText("LOG: EYE GAZE ANOMALY", 14, 30);
        ctx.fillText("VIOLATION: LOOKING OFF-SCREEN", 14, 38);
      } else if (gazeState === "multiple") {
        ctx.fillText("LOG: PERSONS COUNT > 1", 14, 30);
        ctx.fillText("VIOLATION: MULTIPLE PEOPLE IN CAM", 14, 38);
      } else {
        ctx.fillText("LOG: CAMERA COVERED / ABSENT", 14, 30);
        ctx.fillText("VIOLATION: NO FACE IN FRAME", 14, 38);
      }
    }

    
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(15, h - 20, w - 30, 4);
    ctx.fillStyle = gazeState === "normal" ? "#10b981" : "#ef4444";
    ctx.fillRect(15 + ((cycle / 240) * (w - 30)), h - 22, 4, 8);

    violationSimFrameId = requestAnimationFrame(animate);
  }

  animate();
}

function closeReviewModal() {
  if (violationSimFrameId) {
    cancelAnimationFrame(violationSimFrameId);
    violationSimFrameId = null;
  }
  const videoWrapper = document.getElementById("video-wrapper");
  if (videoWrapper) videoWrapper.innerHTML = ""; 
  document.getElementById("review-modal").style.display = "none";
}

function resolveViolation(resolutionType) {
  const incidentId = document.getElementById("review-modal-title-id").textContent;
  
  const match = cachedViolations.find(v => v.id === incidentId);
  if (!match) return;

  fetch("/admin/resolve-violation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: match.rawId, status: "Resolved" })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      match.status = "Resolved";
      renderViolations(cachedViolations);
      updateAlertStats(cachedViolations);
      closeReviewModal();
    } else {
      alert("Failed to resolve violation on server.");
    }
  })
  .catch(err => {
    console.error("Resolve error:", err);
    alert("Error communicating with server.");
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
