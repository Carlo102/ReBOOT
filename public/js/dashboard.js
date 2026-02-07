const API_BASE_URL = 'http://localhost:8888/api'

let currentUser = null
let dailyChallengeComplete = false

const quotes = [
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
    { text: "Success is not how high you have climbed, but how you make a positive difference to the world.", author: "Roy T. Bennett" }
]

const getAuthHeaders = () => {

    const token = localStorage.getItem('token')
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    }
}

const handleAPIError = (error) => {

    console.error('API Error:', error)
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {

        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = 'login.html'
    }
}

window.addEventListener('DOMContentLoaded', async () => {
   
    const token = localStorage.getItem('token')
    if (!token) {
        window.location.href = 'login.html'
        return
    }

    try {
        await loadUserData()
        initializeEventListeners()
        setActiveNavLink('dashboard')

    } catch (error) {
        handleAPIError(error)
    }
})

async function loadUserData() {

    try {
      
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            currentUser = JSON.parse(storedUser)
            updateUIWithUserData(currentUser)
        }

        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: getAuthHeaders()
        })

        if (!response.ok) {
            throw new Error('Unauthorized')
        }

        const data = await response.json()
        currentUser = data.user
        localStorage.setItem('user', JSON.stringify(currentUser))
        updateUIWithUserData(currentUser)

    } catch (error) {
        throw error
    }
}

function updateUIWithUserData(user) {
   
    const welcomeMsg = document.getElementById('welcomeMessage')
    if (welcomeMsg) {
        welcomeMsg.textContent = `Welcome back, ${user.name}!`
    }

    const profileName = document.getElementById('profileNameDisplay')
    if (profileName) {
        profileName.textContent = user.name
    }

    const profileRole = document.querySelector('.text-xl.font-bold.text-slate-300 + .text-gray-400')
    if (profileRole) {
        profileRole.textContent = user.role || 'Job Seeker'
    }

    const profileLocation = document.getElementById('profileLocationDisplay')
    if (profileLocation) {
        profileLocation.textContent = user.location || 'Not Specified'
    }
    

    const profileEmail = document.getElementById('profileEmailDisplay')
    if (profileEmail) {
        profileEmail.textContent = user.email
    }

    const profileComplete = document.getElementById('profileValue')
    if (profileComplete) {
        profileComplete.textContent = (user.profileComplete || 50) + '%'
    }

    const skillsCount = document.getElementById('skillsListed')
    if (skillsCount) {
    skillsCount.textContent = user.skillsCount ?? 0
    }


    const yearsExp = document.getElementById('yearsExperience')
    if (yearsExp) {
    yearsExp.textContent = user.yearsExperience ?? 0
    }

    const sidebarName = document.getElementById('sidebarUserName')
    if (sidebarName) {
        sidebarName.textContent = user.name
    }

    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    const initialsDiv = document.getElementById('profileInitials')
    if (initialsDiv) {
        initialsDiv.textContent = initials
    }
}

function initializeEventListeners() {

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault()
            const page = this.getAttribute('data-page')
            navigateToPage(page)
        })
    })

    const addJobBtn = document.getElementById('addJobBtn')
    const addJobBtn2 = document.getElementById('addJobBtn2')
    
    if (addJobBtn) addJobBtn.addEventListener('click', () => showJobModal())
    if (addJobBtn2) addJobBtn2.addEventListener('click', () => showJobModal())

    const newQuoteBtn = document.getElementById('newQuoteBtn')
    if (newQuoteBtn) {
        newQuoteBtn.addEventListener('click', function() {

            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]
            document.getElementById('quoteText').textContent = randomQuote.text
            document.getElementById('quoteAuthor').textContent = '- ' + randomQuote.author
        })
    }

    const saveJournalBtn = document.getElementById('saveJournalBtn')
    if (saveJournalBtn) {
        saveJournalBtn.addEventListener('click', function() {

            const entry = document.getElementById('journalEntry').value
            if (entry.trim() !== '') {
                const successMsg = document.getElementById('journalSuccess')
                successMsg.classList.remove('hidden')
                
                const streakElement = document.getElementById('journalStreak')
                let currentStreak = parseInt(streakElement.textContent)
                streakElement.textContent = currentStreak + 1
                
                document.getElementById('journalEntry').value = ''
                
                setTimeout(() => {
                    successMsg.classList.add('hidden')
                }, 3000)
            }
        })
    }

    document.querySelectorAll('.course-btn').forEach(btn => {
        btn.addEventListener('click', function() {

            if (!dailyChallengeComplete) {
                dailyChallengeComplete = true
                document.getElementById('challengeProgress').textContent = '1'
                const coursesCount = document.getElementById('coursesCount')
                coursesCount.textContent = parseInt(coursesCount.textContent) + 1
                showNotification('Daily challenge completed!', 'success')
            }
        })
    })

    const addExpenseBtn = document.getElementById('addExpenseBtn');
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', function() {

            const amount = prompt('Enter expense amount:')
            if (amount && !isNaN(amount)) {
                showNotification('Expense added successfully!', 'success')
            }
        })
    }

    const logoutBtn = document.getElementById('logoutBtn')
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout)
    }

    const editProfileBtn = document.querySelector('.text-indigo-400.hover\\:text-indigo-300')
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', (e) => {
            e.preventDefault()
            showEditProfileModal()
        })
    }

    initializeQuickResources()

    const searchJobs = document.getElementById('searchJobs')
    const filterStatus = document.getElementById('filterStatus')
    const sortBy = document.getElementById('sortBy')

    if (searchJobs) searchJobs.addEventListener('input', filterJobs)
    if (filterStatus) filterStatus.addEventListener('change', filterJobs)
    if (sortBy) sortBy.addEventListener('change', filterJobs)
}

function handleLogout() {
    
    if (confirm('Are you sure you want to logout?')) {

        localStorage.removeItem('token')
        localStorage.removeItem('user')

        showNotification('Logged out successfully!', 'success')

        setTimeout(() => {
            window.location.href = 'login.html'
        }, 1500)
    }
}

function showEditProfileModal() {

    const user = currentUser
    
    const modalHTML = `

    <div id="profileModal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onclick="if(event.target.id==='profileModal') closeProfileModal()">
        <div class="bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-screen overflow-y-auto border border-gray-700">
        <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-white">Edit Profile</h3>
        <button onclick="closeProfileModal()" class="text-gray-400 hover:text-gray-200">
        <i class="fas fa-times text-xl"></i>
        </button>
    </div>
                
    <form id="profileForm" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2">
        <label class="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
        <input type="text" id="profileName" value="${user.name}" required 
        class="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400" 
        placeholder="Name">
        </div>
                        
    <div class="col-span-2">
        <label class="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
        <input type="email" id="profileEmail" value="${user.email}" disabled
        class="w-full p-3 bg-gray-600 border border-gray-600 text-gray-400 rounded-lg cursor-not-allowed" 
        placeholder="Email">
        <p class="text-xs text-gray-400 mt-1">Email cannot be changed</p>
    </div>
                        
    <div class="col-span-2">
        <label class="block text-sm font-medium text-gray-300 mb-2">Job Role</label>
        <input type="text" id="profileRole" value="${user.role || ''}" 
        class="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400" 
        placeholder="e.g., Software Developer">
    </div>
                        
    <div class="col-span-2">
        <label class="block text-sm font-medium text-gray-300 mb-2">Location</label>
        <input type="text" id="profileLocation" value="${user.location || ''}" 
        class="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400" 
        placeholder="e.g., San Francisco, CA">
    </div>
                        
    <div class="col-span-2">
        <label class="block text-sm font-medium text-gray-300 mb-2">Phone Number (Optional)</label>
        <input type="number" id="profilePhone" value="${user.phone || ''}" 
        class="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400" 
        placeholder="e.g., +1 234 567 8900">
    </div>
                        
    <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Skills Count</label>
        <input type="number" id="profileSkills" value="${user.skillsCount || 0}" 
        class="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" >
    </div>
                        
    <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Years of Experience</label>
        <input type="number" id="profileYears" value="${user.yearsExperience || 0}" 
        class="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
    </div>
    </div>
                    
    <div class="flex space-x-3 mt-6">
        <button type="button" onclick="closeProfileModal()" class="flex-1 bg-gray-700 text-gray-200 px-4 py-3 rounded-lg hover:bg-gray-600 transition font-medium">
        Cancel
        </button>
        <button type="submit" class="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition font-medium">
        Save Changes
        </button>
        </div>
    </form>
    </div>
</div>`
    
    document.body.insertAdjacentHTML('beforeend', modalHTML)
    document.getElementById('profileForm').addEventListener('submit', saveProfileHandler)
}

window.closeProfileModal = function() {

    const modal = document.getElementById('profileModal')
    if (modal) modal.remove()
}

async function saveProfileHandler(e) {
    e.preventDefault()

    const profileData = {
        name: document.getElementById('profileName').value.trim(),
        role: document.getElementById('profileRole').value.trim(),
        location: document.getElementById('profileLocation').value.trim(),
        phone: document.getElementById('profilePhone').value.trim(),
        skillsCount: parseInt(document.getElementById('profileSkills').value) || 0,
        yearsExperience: parseFloat(document.getElementById('profileYears').value) || 0
    }

    let completionScore = 30
    if (profileData.name) completionScore += 10
    if (profileData.role) completionScore += 15
    if (profileData.location) completionScore += 15
    if (profileData.phone) completionScore += 10
    if (profileData.skillsCount > 0) completionScore += 10
    if (profileData.yearsExperience > 0) completionScore += 10

    try {

        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(profileData)
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to update profile')
        }

        const data = await response.json()
        
        currentUser = data.user;
        localStorage.setItem('user', JSON.stringify(currentUser))
       
        updateUIWithUserData(currentUser)
        
        closeProfileModal();
        showNotification('Profile updated successfully!', 'success')

    } catch (error) {
        console.error('Error updating profile:', error)
        showNotification(error.message, 'error')
    }
}

function initializeQuickResources() {

    const resources = [
        {
            name: 'Resume Templates',
            icon: 'fa-file-alt',
            color: 'blue',
            links: [
                { title: 'Modern Resume Template', url: 'https://www.canva.com/templates/resumes/' },
                { title: 'ATS-Friendly Templates', url: 'https://www.jobscan.co/resume-templates' },
                { title: 'Creative Resume Examples', url: 'https://www.behance.net/search/projects?search=resume' }
            ]
        },
        {
            name: 'Cover Letter Guide',
            icon: 'fa-envelope',
            color: 'blue',
            links: [
                { title: 'How to Write a Cover Letter', url: 'https://www.indeed.com/career-advice/resumes-cover-letters/how-to-write-a-cover-letter' },
                { title: 'Cover Letter Examples', url: 'https://www.thebalancemoney.com/cover-letter-examples-and-writing-tips-2060208' },
                { title: 'Cover Letter Template', url: 'https://www.livecareer.com/cover-letter/templates' }
            ]
        },
        {
            name: 'Resume Builder',
            icon: 'fa-magic',
            color: 'blue',
            links: [
                { title: 'Resume.io - Free Builder', url: 'https://resume.io/' },
                { title: 'Canva Resume Builder', url: 'https://www.canva.com/create/resumes/' },
                { title: 'FlowCV - Modern Builder', url: 'https://flowcv.com/' }
            ]
        },
        {
            name: 'Interview Prep',
            icon: 'fa-video',
            color: 'blue',
            links: [
                { title: 'Common Interview Questions', url: 'https://www.themuse.com/advice/interview-questions-and-answers' },
                { title: 'STAR Method Guide', url: 'https://www.indeed.com/career-advice/interviewing/how-to-use-the-star-interview-response-technique' },
                { title: 'Mock Interview Practice', url: 'https://www.pramp.com/' }
            ]
        }
    ]

    const resourceLinks = document.querySelectorAll('.bg-blue-950.hover\\:bg-gray-700')
    
    resourceLinks.forEach((link, index) => {
        if (resources[index]) {
            link.style.cursor = 'pointer';
            link.addEventListener('click', (e) => {
                e.preventDefault()
                showResourceModal(resources[index])
            })
        }
    })
}

function showResourceModal(resource) {

    const modalHTML = `

    <div id="resourceModal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onclick="if(event.target.id==='resourceModal') closeResourceModal()">
        <div class="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-700">
        <div class="flex justify-between items-center mb-6">
        <div class="flex items-center space-x-3">
        <div class="w-12 h-12 bg-${resource.color}-500 bg-opacity-20 rounded-lg flex items-center justify-center">
        <i class="fas ${resource.icon} text-${resource.color}-400 text-xl"></i>
        </div>
        <h3 class="text-xl font-bold text-white">${resource.name}</h3>
        </div>
        <button onclick="closeResourceModal()" class="text-gray-400 hover:text-gray-200">
        <i class="fas fa-times text-xl"></i>
        </button>
        </div>
                
    <div class="space-y-3">
        <p class="text-gray-300 text-sm mb-4">Choose a resource to open:</p>
        ${resource.links.map(link => `
        <a href="${link.url}" target="_blank" rel="noopener noreferrer" 
        class="flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition group">
        <div class="flex items-center space-x-3">
        <i class="fas fa-external-link-alt text-${resource.color}-400 text-sm"></i>
        <span class="text-white text-sm">${link.title}</span>
    </div>
        <i class="fas fa-arrow-right text-gray-400 group-hover:text-white transition"></i>
        </a>`

).join('')}

    </div>
                
    <button onclick="closeResourceModal()" class="mt-4 w-full bg-gray-700 text-gray-200 px-4 py-3 rounded-lg hover:bg-gray-600 transition font-medium">
    Close

    </button>
    </div>
</div>`
    
    document.body.insertAdjacentHTML('beforeend', modalHTML)
}

window.closeResourceModal = function() {

    const modal = document.getElementById('resourceModal')
    if (modal) modal.remove()
}

function navigateToPage(page) {
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('bg-[#0b1739]')
    })
    
    const activeLink = document.querySelector(`[data-page="${page}"]`)
    if (activeLink) {
        activeLink.classList.add('bg-[#0b1739]')
    }

    document.querySelectorAll('.page-content').forEach(p => {
        p.classList.add('hidden')
    })
    
    const targetPage = document.getElementById(page + 'Page')
    if (targetPage) {
        targetPage.classList.remove('hidden')
    }

    if (page === 'jobtracker' && window.initJobTracker) {
        initJobTracker()
    }

}

function setActiveNavLink(page) {
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('bg-[#0b1739]')
    })
    
    const activeLink = document.querySelector(`[data-page="${page}"]`)
    if (activeLink) {
        activeLink.classList.add('bg-[#0b1739]')
    }
}

function showNotification(message, type = 'info') {

    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        'bg-blue-500'
    } text-white`
    notification.textContent = message
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
        notification.remove()
    }, 3000)
}



window.editJob = editJob
window.deleteJob = deleteJob
window.deleteJobFromModal = deleteJobFromModal
window.closeJobModal = closeJobModal
window.closeProfileModal = closeProfileModal
window.closeResourceModal = closeResourceModal