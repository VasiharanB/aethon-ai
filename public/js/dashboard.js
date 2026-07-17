document.addEventListener("DOMContentLoaded", () => {

  const userEmail =
    localStorage.getItem("userEmail") ||
    sessionStorage.getItem("userEmail");

  if (!userEmail) {
    window.location.href = "login.html";
    return;
  }

  let barChart;
  let donutChart;
  let lineChart;

  
  async function loadDashboard() {

    try {

      const res = await fetch(
        `/student-assessments?email=${encodeURIComponent(userEmail)}`
      );

      const rows = await res.json();

      const total = rows.length;

      const completed =
        rows.filter(x =>
          x.submitted == 1
        ).length;

      const missed =
        rows.filter(x => {

          if (x.submitted == 1)
            return false;

          return new Date(x.due_date)
            < new Date();

        }).length;

      const available =
        total - completed - missed;

      const submissionRate =
        total === 0
          ? 0
          : Math.round(
              (completed / total) * 100
            );

      const avgScore =
        total === 0
          ? 0
          : Math.round(
              rows.reduce(
                (sum, x) =>
                  sum +
                  (Number(x.score) || 0),
                0
              ) / total
            );

      const highestScore =
        rows.length === 0
          ? 0
          : Math.max(
              ...rows.map(
                x => Number(x.score) || 0
              )
            );

      updateCards({
        total,
        completed,
        submissionRate,
        avgScore,
        highestScore
      });

      createBarChart(rows);

      createDonutChart(
        completed,
        missed,
        available
      );

      createLineChart(rows);

      populateActivity(rows);

    } catch (error) {

      console.error(
        "Dashboard Error:",
        error
      );

    }
  }

  
  function populateActivity(rows) {
    const list = document.getElementById("activityList");
    if (!list) return;
    
    list.innerHTML = "";

    if (rows.length === 0) {
      list.innerHTML = `<p style="font-size:13px; color:rgba(255,255,255,0.5);">No recent activity.</p>`;
      return;
    }

    
    const sorted = [...rows].sort((a, b) => new Date(b.due_date) - new Date(a.due_date));
    
    
    const recent = sorted.slice(0, 4);

    recent.forEach(item => {
      const isSubmitted = item.submitted == 1;
      const isAuto = item.auto_submitted == 1;
      
      let statusText = "";
      let statusColor = "";
      let activityDesc = "";
      
      if (isSubmitted) {
        if (isAuto) {
          statusText = "Auto Submitted";
          statusColor = "#fbbf24"; 
          activityDesc = "Test completed automatically due to timeout or tab/proctoring limit.";
        } else {
          statusText = "Submitted";
          statusColor = "#10b981"; 
          activityDesc = "Test completed and submitted successfully.";
        }
      } else {
        statusText = "Created";
        statusColor = "#60a5fa"; 
        activityDesc = "New assessment assigned and ready to start.";
      }
      
      const div = document.createElement("div");
      div.className = "activity-item";
      div.style.padding = "14px";
      div.style.marginBottom = "8px";
      div.innerHTML = `
        <div class="top-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <h4 style="font-weight: 600; font-size: 14px; margin: 0; color: #ffffff;">${item.title || "Assessment"}</h4>
          <span style="color: ${statusColor}; font-weight: 700; font-size: 10px; padding: 3px 8px; background: ${statusColor}15; border-radius: 12px; border: 1px solid ${statusColor}30; text-transform: uppercase; letter-spacing: 0.5px;">${statusText}</span>
        </div>
        <p style="font-size: 12px; color: rgba(255, 255, 255, 0.5); margin: 0 0 8px 0; line-height: 1.4;">${activityDesc}</p>
        <span style="font-size: 11px; color: rgba(255, 255, 255, 0.35); display: flex; align-items: center; gap: 5px;">
          <i class="ri-calendar-line" style="font-size: 12px;"></i>
          Due: ${new Date(item.due_date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      `;
      list.appendChild(div);
    });
  }

  
  function updateCards(data) {

    document.getElementById("total").innerText =
      data.total;

    document.getElementById("submission").innerText =
      data.submissionRate + "%";

    document.getElementById("score").innerText =
      data.avgScore + "%";

    document.getElementById("completedText").innerText =
      data.completed + " completed";

    document.getElementById("progress1").style.width =
      data.total === 0
        ? "0%"
        : (
            (data.completed /
              data.total) * 100
          ) + "%";

    document.getElementById("progress2").style.width =
      data.submissionRate + "%";

    document.getElementById("progress3").style.width =
      data.avgScore + "%";
  }

  
  function createBarChart(rows) {

    const months = {};
    const attempted = {};

    rows.forEach(item => {

      const d =
        new Date(item.due_date);

      const label =
        d.getFullYear() + "-" +
        String(
          d.getMonth() + 1
        ).padStart(2, "0");

      months[label] =
        (months[label] || 0) + 1;

      if (item.submitted == 1) {

        attempted[label] =
          (attempted[label] || 0) + 1;
      }

    });

    const labels =
      Object.keys(months);

    const assignedData =
      labels.map(x =>
        months[x]
      );

    const attemptedData =
      labels.map(x =>
        attempted[x] || 0
      );

    if (barChart)
      barChart.destroy();

    const canvasBar = document.getElementById("barChart");
    const ctxBar = canvasBar.getContext("2d");

    const gradPurple = ctxBar.createLinearGradient(0, 0, 0, 300);
    gradPurple.addColorStop(0, "rgba(167, 139, 250, 0.9)");
    gradPurple.addColorStop(1, "rgba(124, 58, 237, 0.6)");

    const gradGreen = ctxBar.createLinearGradient(0, 0, 0, 300);
    gradGreen.addColorStop(0, "rgba(52, 211, 153, 0.9)");
    gradGreen.addColorStop(1, "rgba(16, 185, 129, 0.6)");

    barChart = new Chart(
      canvasBar,
      {
        type: "bar",

        data: {
          labels,

          datasets: [

            {
              label: "Assigned",
              data: assignedData,
              backgroundColor: gradPurple,
              borderRadius: 6,
              borderSkipped: false,
              maxBarThickness: 32
            },

            {
              label: "Attempted",
              data: attemptedData,
              backgroundColor: gradGreen,
              borderRadius: 6,
              borderSkipped: false,
              maxBarThickness: 32
            }

          ]
        },

        options: {
          responsive: true,
          maintainAspectRatio: false,

          plugins: {
            legend: {
              labels: {
                color:
                  "#b5b5c3"
              }
            }
          },

          scales: {
            x: {
              ticks: {
                color:
                  "#b5b5c3"
              },
              grid: {
                display:false
              }
            },

            y: {
              ticks: {
                color:
                  "#b5b5c3",
                stepSize:1
              },
              grid: {
                display: false
              },
              border: {
                display: false
              }
            }
          }
        }
      }
    );
  }

  
  function createDonutChart(
    completed,
    missed,
    available
  ) {

    if (donutChart)
      donutChart.destroy();

    const canvasDonut = document.getElementById("donutChart");
    const ctxDonut = canvasDonut.getContext("2d");

    const gradBlue = ctxDonut.createLinearGradient(0, 0, 0, 200);
    gradBlue.addColorStop(0, "#60a5fa");
    gradBlue.addColorStop(1, "#3b82f6");

    const gradOrange = ctxDonut.createLinearGradient(0, 0, 0, 200);
    gradOrange.addColorStop(0, "#fbbf24");
    gradOrange.addColorStop(1, "#f59e0b");

    const gradPurpleD = ctxDonut.createLinearGradient(0, 0, 0, 200);
    gradPurpleD.addColorStop(0, "#a78bfa");
    gradPurpleD.addColorStop(1, "#7c3aed");

    donutChart = new Chart(
      canvasDonut,
      {
        type: "doughnut",

        data: {
          labels: [
            "Submitted",
            "Missed",
            "Upcoming"
          ],

          datasets: [{
            data: [
              completed,
              missed,
              available
            ],

            backgroundColor: [
              gradBlue,
              gradOrange,
              gradPurpleD
            ],

            borderWidth: 2,
            borderColor: "rgba(20, 24, 32, 0.65)",
            hoverOffset: 4
          }]
        },

        options: {
          cutout: "72%",

          plugins: {
            legend: {
              position:
                "bottom",

              labels: {
                color:
                  "#b5b5c3",
                padding:15,
                usePointStyle:true
              }
            }
          }
        }
      }
    );
  }

  
  function createLineChart(rows) {

    const labels =
      rows.map((x, i) =>
        "A" + (i + 1)
      );

    const scores =
      rows.map(x =>
        Number(x.score) || 0
      );

    const canvas =
      document.getElementById("lineChart");

    if (!canvas) return;

    if (lineChart)
      lineChart.destroy();

    lineChart = new Chart(
      canvas,
      {
        type: "line",

        data: {
          labels,

          datasets: [{
            label: "Scores",
            data: scores,
            borderColor:
              "#7c3aed",
            backgroundColor:
              "rgba(124,58,237,0.18)",
            tension: 0.4,
            fill: true,
            pointRadius: 4
          }]
        },

        options: {
          responsive: true,
          maintainAspectRatio: false,

          plugins: {
            legend: {
              labels: {
                color:
                  "#b5b5c3"
              }
            }
          },

          scales: {
            x: {
              ticks: {
                color:
                  "#b5b5c3"
              },
              grid: {
                display:false
              }
            },

            y: {
              ticks: {
                color:
                  "#b5b5c3"
              },
              grid: {
                color:
                "rgba(255,255,255,0.08)"
              }
            }
          }
        }
      }
    );
  }

  
  loadDashboard();

});

