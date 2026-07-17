

async function login(){

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value.trim();

  const msg =
    document.getElementById("msg");

  msg.innerText = "";

  if(email === "" || password === ""){
    msg.innerText = "Enter email and password";
    return;
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  const requestedRole = urlParams.get('role') || 'student';

  try{

    const res = await fetch("/login",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        email,
        password,
        role: requestedRole
      })
    });

    const data = await res.json();

    if(data.success){

      
      localStorage.clear();
      sessionStorage.clear();

      
      let name = data.name;

      if(!name){

        const username = data.email.split("@")[0];

        
        const clean = username.replace(/[0-9]/g, '');

        
        const words = clean.match(/[a-z]+/gi);

        if(words){
          name = words
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
        }else{
          name = "User";
        }
      }

      
      localStorage.setItem("userName", name);
      localStorage.setItem("userEmail", data.email);
      localStorage.setItem("role", data.role);

      
      if(data.role === "admin"){
        window.location.href = "admin.html";
      }else{
        window.location.href = "dashboard.html";
      }

    }else{
      msg.innerText = "Invalid email or password";
    }

  }catch(error){
    console.log(error);
    msg.innerText = "Server error";
  }

}



function showForgot() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('reset-section').style.display = 'none';
  document.getElementById('forgot-section').style.display = 'block';
  document.getElementById('msg').innerText = '';
}

function showLogin() {
  document.getElementById('forgot-section').style.display = 'none';
  document.getElementById('reset-section').style.display = 'none';
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('msg').innerText = '';
  document.getElementById('msg').style.color = '#ff7b7b';
}

async function sendOtp() {
  const email = document.getElementById("forgot-email").value.trim();
  const msg = document.getElementById("msg");
  if (!email) {
    msg.style.color = "#ff7b7b";
    msg.innerText = "Enter your email";
    return;
  }
  
  try {
    const res = await fetch("/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('forgot-section').style.display = 'none';
      document.getElementById('reset-section').style.display = 'block';
      msg.style.color = "#a78bfa";
      msg.innerText = "OTP sent to your email! (Check terminal)";
    } else {
      msg.style.color = "#ff7b7b";
      msg.innerText = data.error || "Failed to send OTP";
    }
  } catch(error) {
    msg.style.color = "#ff7b7b";
    msg.innerText = "Server error";
  }
}

async function resetPassword() {
  const email = document.getElementById("forgot-email").value.trim();
  const otp = document.getElementById("reset-otp").value.trim();
  const newPassword = document.getElementById("reset-password").value.trim();
  const msg = document.getElementById("msg");
  
  if (!otp || !newPassword) {
    msg.style.color = "#ff7b7b";
    msg.innerText = "Enter OTP and New Password";
    return;
  }
  
  try {
    const res = await fetch("/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, newPassword })
    });
    const data = await res.json();
    if (data.success) {
      msg.style.color = "#22c55e";
      msg.innerText = "Password updated successfully!";
      setTimeout(() => { showLogin(); }, 2000);
    } else {
      msg.style.color = "#ff7b7b";
      msg.innerText = data.error || "Invalid OTP";
    }
  } catch(error) {
    msg.style.color = "#ff7b7b";
    msg.innerText = "Server error";
  }
}