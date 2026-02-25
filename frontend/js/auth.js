const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const full_name = document.getElementById("full_name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Simulated fingerprint
    const fingerprint_template = "SIMULATED_TEMPLATE_ABC_123456";

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        // body: JSON.stringify({
        //   full_name,
        //   email,
        //   password,
        //   fingerprint_template
        // })

body: JSON.stringify({
  full_name,
  email,
  password,
  fingerprint_template,
  role: "conductor"
})


      });

      const data = await res.json();

      if (res.ok) {
        alert("Registration successful!");
        window.location.href = "login.html";
      } else {
        alert(data.message);
      }

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  });
}
const biometricLoginForm = document.getElementById("biometricLoginForm");

if (biometricLoginForm) {
  biometricLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;

    // Simulated fingerprint
    const fingerprint_template = "SIMULATED_TEMPLATE_ABC_123456";

    try {
      const res = await fetch("http://localhost:5000/api/auth/biometric-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          fingerprint_template
        })
      });

      const data = await res.json();

      if (res.ok) {
        // Save token
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert("Login successful!");
        window.location.href = "dashboard.html";
      } else {
        alert(data.message);
      }

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  });
}
