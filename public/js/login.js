const API_BASE_URL = 'http://localhost:8888/api'

document.getElementById('showRegister').addEventListener('click', () => {
    document.getElementById('loginForm').classList.add('hidden')
    document.getElementById('registerForm').classList.remove('hidden')
})

document.getElementById('showLogin').addEventListener('click', () => {
    document.getElementById('registerForm').classList.add('hidden')
    document.getElementById('loginForm').classList.remove('hidden')
})

document.getElementById('loginFormElement').addEventListener('submit', async (e) => {
    e.preventDefault()
            
    const email = document.getElementById('loginEmail').value
    const password = document.getElementById('loginPassword').value
    const errorDiv = document.getElementById('loginError')
    const loginBtn = document.getElementById('loginBtn')

    errorDiv.classList.add('hidden')
    loginBtn.disabled = true
    loginBtn.textContent = 'Logging in...'

    try {

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })

    const data = await response.json()

    if (!response.ok) {
    throw new Error(data.message || 'Login failed')
    }

              
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    window.location.href = 'dashboard.html'

    } catch (error) {
        errorDiv.textContent = error.message
        errorDiv.classList.remove('hidden')
        loginBtn.disabled = false
        loginBtn.textContent = 'Login'
    }
})

document.getElementById('registerFormElement').addEventListener('submit', async (e) => {
    e.preventDefault()
            
    const name = document.getElementById('registerName').value
    const email = document.getElementById('registerEmail').value
    const password = document.getElementById('registerPassword').value
    const role = document.getElementById('registerRole').value || 'Job Seeker'
    const location = document.getElementById('registerLocation').value || ''

    const errorDiv = document.getElementById('registerError')
    const successDiv = document.getElementById('registerSuccess')
    const registerBtn = document.getElementById('registerBtn')

    errorDiv.classList.add('hidden')
    successDiv.classList.add('hidden')
    registerBtn.disabled = true
    registerBtn.textContent = 'Creating Account...'

    try {

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role, location })
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed')
            }

            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))

                
            successDiv.textContent = 'Account created successfully! Redirecting...'
            successDiv.classList.remove('hidden')

            setTimeout(() => {
            window.location.href = 'dashboard.html'
            }, 1500)

            } catch (error) {
                errorDiv.textContent = error.message
                errorDiv.classList.remove('hidden')
                registerBtn.disabled = false
                registerBtn.textContent = 'Create Account'
            }
        })

        if (localStorage.getItem('token')) {
            window.location.href = 'dashboard.html'
        }
        console.log("Token:", localStorage.getItem("token"))