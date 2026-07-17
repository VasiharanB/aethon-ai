document.addEventListener("DOMContentLoaded", () => {
  const name = localStorage.getItem("userName") || "User";
  const email = localStorage.getItem("userEmail") || "Not provided";
  const role = localStorage.getItem("role") || "student";
  
  
  const phone = localStorage.getItem("userPhone") || "Update in Settings";
  const college = localStorage.getItem("userCollege") || "PSVPEC College";
  const roll = localStorage.getItem("userRoll") || "Not Assigned";

  const pageName = document.getElementById("pageName");
  const pageRole = document.getElementById("pageRole");
  const pageAvatar = document.getElementById("pageAvatar");
  
  const pageEmailFull = document.getElementById("pageEmailFull");
  const pagePhone = document.getElementById("pagePhone");
  const pageCollege = document.getElementById("pageCollege");
  const pageRoll = document.getElementById("pageRoll");

  if (pageName) pageName.innerText = name;
  if (pageEmailFull) pageEmailFull.innerText = email;
  if (pagePhone) pagePhone.innerText = phone;
  if (pageCollege) pageCollege.innerText = college;
  if (pageRoll) pageRoll.innerText = roll;

  if (pageRole) {
    if (role === "admin") {
      pageRole.innerText = "Administrator";
      pageRole.style.background = "rgba(139, 92, 246, 0.15)";
      pageRole.style.color = "#a78bfa";
      pageRole.style.borderColor = "rgba(139, 92, 246, 0.3)";
      pageRole.style.boxShadow = "0 0 20px rgba(139, 92, 246, 0.2)";
    } else {
      pageRole.innerText = "Student";
    }
  }

  if (pageAvatar) {
    pageAvatar.innerText = name.charAt(0).toUpperCase();
  }
});
