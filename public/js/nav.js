

document.addEventListener("DOMContentLoaded", () => {

  

  const name =
    localStorage.getItem("userName");

  const role =
    localStorage.getItem("role");

  const userName =
    document.getElementById("userName");

  const userAvatar =
    document.getElementById("userAvatar");

  const userRole =
    document.getElementById("userRole");

  
  if(name){

    if(userName)
      userName.innerText = name;

    if(userAvatar)
      userAvatar.innerText =
        name.charAt(0).toUpperCase();

  }

  if(role && userRole){

    userRole.innerText =
      role === "admin"
        ? "Admin"
        : "Student";

  }


  

  const menuItems =
    document.querySelectorAll(".menu-item");

  menuItems.forEach(item => {

    item.addEventListener("click", () => {

      const text =
        item.innerText.trim();

      if(text.includes("Dashboard")){
        window.location.href = "dashboard.html";
      }

      else if(text.includes("Assessments")){
        window.location.href = "assessment.html";
      }

      else if(text.includes("Coding Practice")){
        window.location.href = "coding.html";
      }

      else if(text.includes("Profile")){
        window.location.href = "profile.html";
      }

    });

  });

});




function logout(){

  localStorage.clear();
  sessionStorage.clear();

  window.location.href = "login.html";

}



function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("collapsed");
}