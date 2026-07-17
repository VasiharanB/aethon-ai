

let isAutoFocusActive = false;

const mockFeeds = [
  {
    name: "Alex Chen",
    exam: "Data Structures",
    id: "S-1029",
    time: "42:15",
    status: "normal",
    events: 0
  },
  {
    name: "Sarah Miller",
    exam: "System Design",
    id: "S-1030",
    time: "1:12:05",
    status: "warning",
    events: 2
  },
  {
    name: "David Kim",
    exam: "React Fundamentals",
    id: "S-1031",
    time: "15:30",
    status: "normal",
    events: 0
  },
  {
    name: "Michael Brown",
    exam: "Go Concurrency",
    id: "S-1032",
    time: "55:10",
    status: "critical",
    events: 5
  },
  {
    name: "Emily Davis",
    exam: "Database Admin",
    id: "S-1033",
    time: "28:45",
    status: "normal",
    events: 0
  },
  {
    name: "Ryan Taylor",
    exam: "CSS Architecture",
    id: "S-1034",
    time: "05:20",
    status: "normal",
    events: 0
  }
];

document.addEventListener("DOMContentLoaded", () => {
  renderFeeds(mockFeeds);
  
  
  setInterval(tickTimers, 1000);
});

function renderFeeds(feeds) {
  const grid = document.getElementById("monitoring-grid");
  if (!grid) return;

  grid.innerHTML = feeds.map(feed => {
    let stateClass = "";
    let badgeHtml = "";
    let eventTextClass = "feed-events-count";
    
    if (feed.status === "warning") {
      stateClass = "warning-state";
      badgeHtml = `<span class="feed-overlay-badge warning">WARNING</span>`;
      eventTextClass += " warning";
    } else if (feed.status === "critical") {
      stateClass = "critical-state";
      badgeHtml = `<span class="feed-overlay-badge critical">CRITICAL</span>`;
      eventTextClass += " critical";
    }

    return `
      <div class="student-feed-card ${stateClass}" data-status="${feed.status}">
        <div class="feed-camera-container" style="position: relative; overflow: hidden;">
          <canvas class="feed-canvas" data-status="${feed.status}" width="240" height="150" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 8px; pointer-events: none; z-index: 1;"></canvas>
          <i class="ri-video-chat-line feed-camera-icon" style="z-index: 0; opacity: 0.1;"></i>
          <span class="feed-overlay-time" style="z-index: 2;">${feed.time}</span>
          ${badgeHtml}
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <span class="feed-student-name">${feed.name}</span>
          <div class="feed-student-meta">
            <span>${feed.exam}</span>
            <span>${feed.id}</span>
          </div>
          ${feed.events > 0 ? `
            <div style="margin-top: 6px; font-size: 12px; display: flex; justify-content: space-between;">
              <span class="feed-events-label">Violations logged</span>
              <span class="${eventTextClass}">${feed.events} events</span>
            </div>
          ` : ""}
        </div>
      </div>
    `;
  }).join("");

  startCanvasAnimations();
}

let animationFrameId = null;

function startCanvasAnimations() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  const canvases = document.querySelectorAll(".feed-canvas");
  if (canvases.length === 0) return;

  let step = 0;

  function animate() {
    step += 1;
    canvases.forEach(canvas => {
      const ctx = canvas.getContext("2d");
      const w = canvas.width;
      const h = canvas.height;
      const status = canvas.getAttribute("data-status");

      ctx.clearRect(0, 0, w, h);

      
      ctx.fillStyle = "rgba(10, 12, 22, 0.82)";
      ctx.fillRect(0, 0, w, h);

      
      ctx.strokeStyle = status === "normal" ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)";
      ctx.fillStyle = status === "normal" ? "rgba(52, 211, 153, 0.7)" : "rgba(248, 113, 113, 0.7)";
      ctx.lineWidth = 1;

      
      let offsetX = 0;
      let offsetY = 0;
      if (status === "warning") {
        
        offsetX = Math.sin(step * 0.05) * 16 + 24;
        offsetY = Math.cos(step * 0.04) * 8 - 12;
      } else if (status === "critical") {
        
        offsetX = 999; 
        offsetY = 999;
      } else {
        
        offsetX = Math.sin(step * 0.02) * 3;
        offsetY = Math.cos(step * 0.02) * 3;
      }

      const centerX = w / 2 + offsetX;
      const centerY = h / 2 + offsetY;

      
      if (status !== "critical") {
        const landmarks = [
          { x: centerX, y: centerY - 15 }, 
          { x: centerX - 25, y: centerY - 30 }, 
          { x: centerX + 25, y: centerY - 30 }, 
          { x: centerX - 15, y: centerY + 15 }, 
          { x: centerX + 15, y: centerY + 15 }, 
          { x: centerX, y: centerY + 22 }, 
          { x: centerX - 40, y: centerY }, 
          { x: centerX + 40, y: centerY }, 
          { x: centerX, y: centerY + 40 }, 
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

        
        ctx.moveTo(landmarks[6].x, landmarks[6].y);
        ctx.lineTo(landmarks[3].x, landmarks[3].y);
        ctx.lineTo(landmarks[8].x, landmarks[8].y);
        ctx.lineTo(landmarks[5].x, landmarks[5].y);
        ctx.lineTo(landmarks[7].x, landmarks[7].y);
        ctx.stroke();

        
        landmarks.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fill();
        });

        
        ctx.lineWidth = 2;
        ctx.strokeStyle = status === "normal" ? "rgba(16, 185, 129, 0.75)" : "rgba(245, 158, 11, 0.85)";
        const boxSizeW = 100;
        const boxSizeH = 110;
        
        const bx = centerX - boxSizeW / 2;
        const by = centerY - boxSizeH / 2 - 5;
        
        const len = 12;
        
        ctx.beginPath(); ctx.moveTo(bx, by + len); ctx.lineTo(bx, by); ctx.lineTo(bx + len, by); ctx.stroke();
        
        ctx.beginPath(); ctx.moveTo(bx + boxSizeW, by + len); ctx.lineTo(bx + boxSizeW, by); ctx.lineTo(bx + boxSizeW - len, by); ctx.stroke();
        
        ctx.beginPath(); ctx.moveTo(bx, by + boxSizeH - len); ctx.lineTo(bx, by + boxSizeH); ctx.lineTo(bx + len, by + boxSizeH); ctx.stroke();
        
        ctx.beginPath(); ctx.moveTo(bx + boxSizeW, by + boxSizeH - len); ctx.lineTo(bx + boxSizeW, by + boxSizeH); ctx.lineTo(bx + boxSizeW - len, by + boxSizeH); ctx.stroke();
      }

      
      ctx.strokeStyle = status === "normal" ? "rgba(52, 211, 153, 0.12)" : "rgba(239, 68, 68, 0.12)";
      ctx.lineWidth = 1.5;
      const scanY = (Math.sin(step * 0.035) * 0.5 + 0.5) * h;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(w, scanY);
      ctx.stroke();

      
      ctx.font = "8px 'Fira Code', monospace, Courier New";
      ctx.fillStyle = status === "normal" ? "#34d399" : (status === "warning" ? "#fbbf24" : "#f87171");
      
      if (status === "normal") {
        ctx.fillText("PROCTOR: OK", 8, 14);
        ctx.fillText(`CONFIDENCE: ${(98.5 + Math.sin(step * 0.05) * 0.8).toFixed(1)}%`, 8, 24);
      } else if (status === "warning") {
        ctx.fillText("PROCTOR: GAZE DEVIATION", 8, 14);
        ctx.fillText("CONFIDENCE: 48.2%", 8, 24);
      } else {
        ctx.fillText("PROCTOR: NO FACE IN FRAME", 8, 14);
        ctx.fillText("CONFIDENCE: 0.0%", 8, 24);
      }
    });

    animationFrameId = requestAnimationFrame(animate);
  }

  animate();
}

function toggleAutoFocus() {
  const btn = document.getElementById("autofocus-btn");
  isAutoFocusActive = !isAutoFocusActive;

  if (isAutoFocusActive) {
    btn.classList.add("active");
    btn.style.backgroundColor = "var(--primary-glow)";
    btn.style.color = "var(--primary-hover)";
    btn.style.borderColor = "var(--primary)";
    
    
    const filtered = mockFeeds.filter(f => f.status === "warning" || f.status === "critical");
    renderFeeds(filtered);
  } else {
    btn.classList.remove("active");
    btn.style.backgroundColor = "";
    btn.style.color = "";
    btn.style.borderColor = "";
    
    renderFeeds(mockFeeds);
  }
}

function tickTimers() {
  const timeLabels = document.querySelectorAll(".feed-overlay-time");
  timeLabels.forEach(label => {
    let parts = label.textContent.split(":");
    let hours = 0, mins = 0, secs = 0;
    
    if (parts.length === 3) {
      hours = parseInt(parts[0]);
      mins = parseInt(parts[1]);
      secs = parseInt(parts[2]);
    } else {
      mins = parseInt(parts[0]);
      secs = parseInt(parts[1]);
    }
    
    secs++;
    if (secs >= 60) {
      secs = 0;
      mins++;
    }
    if (mins >= 60) {
      mins = 0;
      hours++;
    }
    
    const pad = (n) => String(n).padStart(2, '0');
    if (parts.length === 3 || hours > 0) {
      label.textContent = `${hours}:${pad(mins)}:${pad(secs)}`;
    } else {
      label.textContent = `${pad(mins)}:${pad(secs)}`;
    }
  });
}
