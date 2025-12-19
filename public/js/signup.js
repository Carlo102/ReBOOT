document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm")

  const passwordInput = document.getElementById("password")
  const confirmInput = document.getElementById("confirmpassword")
  const togglePassword = document.getElementById("togglepassword")
  const toggleConfirm = document.getElementById("toggleconfirmpassword")
  const mobileInput = document.getElementById("mobilenum")

  const toggleVisibility = (input, icon) => {
    const type = input.getAttribute("type") === "password" ? "text" : "password"
    input.setAttribute("type", type)
    icon.style.fill = type === "text" ? "#000" : "#bbb"
  }

  togglePassword.addEventListener("click", () => toggleVisibility(passwordInput, togglePassword))
  toggleConfirm.addEventListener("click", () => toggleVisibility(confirmInput, toggleConfirm))

 
  mobileInput.addEventListener("input", () => {
   
    let digits = mobileInput.value.replace(/\D/g, "")

   
    if (digits.startsWith("63")) {
      digits = "0" + digits.slice(2)
    }

   
    if (digits.length > 11) digits = digits.slice(0, 11)

   
    let formatted = digits
    if (digits.length > 4 && digits.length <= 7) {
      formatted = `+63 ${digits.slice(1, 4)} ${digits.slice(4)}`
    } else if (digits.length > 7) {
      formatted = `+63 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
    } else if (digits.length > 1) {
      formatted = `+63 ${digits.slice(1)}`
    } else if (digits.length === 1) {
      formatted = `+63`
    }

    mobileInput.value = formatted
    mobileInput.dataset.raw = digits 
  })

  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    const name = form.querySelector('input[name="name"]').value.trim()
    const email = form.querySelector('input[name="email"]').value.trim()
    const password = form.querySelector('input[name="password"]').value.trim()
    const confirmPassword = form.querySelector('input[name="confirmpassword"]').value.trim()
    const mobilenum = mobileInput.dataset.raw || mobileInput.value.replace(/\D/g, "").trim() 

    if (password !== confirmPassword) {
      alert("Passwords do not match!")
      return
    }

   
    if (!/^09\d{9}$/.test(mobilenum)) {
      alert("Invalid mobile number. It must be 11 digits and start with 09.")
      return
    }

    try {
      const res = await fetch("http://localhost:8888/user/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, mobilenum }),
      })

      const data = await res.json()

      if (data.status === "Success") {
        alert("Account created successfully!")
        form.reset()
        window.location.href = "/login.html"
      } else {
        alert(data.message || "Signup failed. Try again.")
      }
    } catch (err) {
      console.error("Error", err)
      alert("Server error. Please try again later.")
    }
  })
})