const API_BASE_URL = 'http://localhost:8888/api'

let applications = []
let currentUser = null
let weeklyGoal = 5
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
        await loadJobApplications()
        await loadJobStats()
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
   
    const welcomeMsg = document.querySelector('h2.text-2xl')
    if (welcomeMsg) {
        welcomeMsg.textContent = `Welcome back, ${user.name}!`
    }

    const profileName = document.querySelector('.text-xl.font-bold.text-slate-300')
    if (profileName) {
        profileName.textContent = user.name
    }

    const profileRole = document.querySelector('.text-xl.font-bold.text-slate-300 + .text-gray-400')
    if (profileRole) {
        profileRole.textContent = user.role || 'Job Seeker'
    }

    const profileLocation = document.querySelector('.fa-map-marker-alt')
    if (profileLocation && profileLocation.parentElement) {
        profileLocation.parentElement.innerHTML = `<i class="fas fa-map-marker-alt mr-1"></i>${user.location || 'Not specified'}`
    }

    const profileEmail = document.querySelector('.fa-envelope')
    if (profileEmail && profileEmail.parentElement) {
        profileEmail.parentElement.innerHTML = `<i class="fas fa-envelope mr-1"></i>${user.email}`
    }

    const profileComplete = document.querySelector('.text-2xl.font-bold.text-blue-900')
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

    const sidebarName = document.querySelector('.text-sm.text-gray-300.whitespace-nowrap')
    if (sidebarName) {
        sidebarName.textContent = user.name
    }

    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    const initialsDiv = document.querySelector('.w-16.h-16.bg-blue-900')
    if (initialsDiv) {
        initialsDiv.textContent = initials
    }
}

async function loadJobApplications() {

    try {

        const response = await fetch(`${API_BASE_URL}/jobs`, {
            headers: getAuthHeaders()
        })

        if (!response.ok) {
            throw new Error('Failed to load applications')
        }

        const data = await response.json()
        applications = data.data || []
        
        renderRecentApplications()
        renderJobTable()
        renderKanbanBoard()
        updateWeeklyGoal()

    } catch (error) {
        console.error('Error loading applications:', error)
        applications = []
    }
}

async function loadJobStats() {

    try {

        const response = await fetch(`${API_BASE_URL}/jobs/stats`, {
            headers: getAuthHeaders()
        })

        if (!response.ok) {
            throw new Error('Failed to load stats')
        }

        const data = await response.json()
        updateDashboardStats(data.data)
    } catch (error) {
        console.error('Error loading stats:', error)
    }
}

function updateDashboardStats(stats) {
   
    document.getElementById('applicationsCount').textContent = stats.total || 0
    document.getElementById('weeklyApps').textContent = stats.weeklyApplications || 0
    
    const interviewsCount = document.getElementById('interviewsCount')
    if (interviewsCount) {
        interviewsCount.textContent = stats.interview || 0
    }

    const reviewCount = document.getElementById('reviewCount')
    if (reviewCount) {
        reviewCount.textContent = stats.inReview || 0
    }

    document.getElementById('totalApps').textContent = stats.total || 0
    document.getElementById('reviewApps').textContent = stats.inReview || 0
    document.getElementById('interviewApps').textContent = stats.interview || 0
    document.getElementById('responseRate').textContent = (stats.responseRate || 0) + '%'
}

function updateWeeklyGoal() {

    const weeklyApps = applications.filter(app => {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        return new Date(app.dateApplied) >= sevenDaysAgo
    }).length

    const percentage = Math.min((weeklyApps / weeklyGoal) * 100, 100)
    
    document.getElementById('currentGoal').textContent = weeklyApps
    document.getElementById('goalPercentage').textContent = percentage.toFixed(0) + '%'
    document.getElementById('progressBar').style.width = percentage + '%'
    
    const remaining = weeklyGoal - weeklyApps
    const goalMessage = document.getElementById('goalMessage')
    
    if (remaining > 0) {
        goalMessage.innerHTML = `<i class="fas fa-bullseye mr-2"></i>Keep it up! Just ${remaining} more application${remaining > 1 ? 's' : ''} to hit your weekly goal.`
    } else {
        goalMessage.innerHTML = `<i class="fas fa-trophy mr-2"></i>Congratulations! You've achieved your weekly goal!`
    }
}

function renderRecentApplications() {

    const list = document.getElementById('applicationsList');
    
    if (!applications || applications.length === 0) {
        list.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-briefcase text-4xl mb-2"></i>
                <p>No applications yet. Click "Add Job Application" to get started!</p>
            </div>
        `
        return
    }

    const recentApps = applications.slice(0, 3)
    list.innerHTML = recentApps.map(app => {
        const daysAgo = getDaysAgo(app.dateApplied)
        return `
            <div class="flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition cursor-pointer" onclick="editJob('${app._id}')">
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                        <i class="fas fa-briefcase text-blue-400"></i>
                    </div>
                    <div>
                        <h4 class="font-medium text-white">${app.position}</h4>
                        <p class="text-sm text-gray-400">${app.company} • ${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago</p>
                    </div>
                </div>
                <span class="px-3 py-1 bg-${getStatusColor(app.status)}-500 bg-opacity-20 text-${getStatusColor(app.status)}-300 text-xs font-medium rounded-full border border-${getStatusColor(app.status)}-500 border-opacity-30">${app.status}</span>
            </div>
        `
    }).join('')
}

function renderJobTable() {
    
    const tbody = document.getElementById('jobTableBody')
    const noJobsMsg = document.getElementById('noJobsMessage')
    
    if (!applications || applications.length === 0) {
        tbody.innerHTML = ''
        noJobsMsg.classList.remove('hidden')
        return
    }
    
    noJobsMsg.classList.add('hidden')
    tbody.innerHTML = applications.map(app => {
        const daysAgo = getDaysAgo(app.dateApplied)
        return `
            <tr class="hover:bg-gray-700 transition">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
                            <i class="fas fa-briefcase text-blue-400 text-sm"></i>
                        </div>
                        <div class="font-medium text-white">${app.company}</div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-200">${app.position}</div>
                    ${app.notes ? `<div class="text-xs text-gray-400 mt-1 max-w-xs truncate">${app.notes}</div>` : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-${getStatusColor(app.status)}-500 bg-opacity-20 text-${getStatusColor(app.status)}-300 border border-${getStatusColor(app.status)}-500 border-opacity-30">
                        ${app.status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    ${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="editJob('${app._id}')" class="text-indigo-400 hover:text-indigo-300 mr-3">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="deleteJob('${app._id}')" class="text-red-400 hover:text-red-300">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `
    }).join('')
}

function renderKanbanBoard() {

    const statuses = ['Applied', 'In Review', 'Interview', 'Offer', 'Rejected']
    const board = document.getElementById('kanbanBoard')
    
    if (!board) return
    
    board.innerHTML = statuses.map(status => {
        const statusApps = applications.filter(app => app.status === status)
        const color = getStatusColor(status)
        
        return `
            <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-semibold text-gray-200 text-sm">${status}</h4>
                    <span class="bg-${color}-500 bg-opacity-20 text-${color}-300 text-xs px-2 py-1 rounded-full font-medium border border-${color}-500 border-opacity-30">${statusApps.length}</span>
                </div>
                <div class="space-y-2">
                    ${statusApps.length === 0 ? `
                        <div class="text-center py-8 text-gray-500 text-xs">
                            <i class="fas fa-inbox text-2xl mb-2"></i>
                            <p>No applications</p>
                        </div>
                    ` : statusApps.map(app => {
                        const daysAgo = getDaysAgo(app.dateApplied);
                        return `
                            <div class="bg-gray-700 p-3 rounded-lg border border-gray-600 hover:border-indigo-500 hover:shadow-lg transition cursor-pointer" onclick="editJob('${app._id}')">
                                <h5 class="font-medium text-white text-sm mb-1">${app.position}</h5>
                                <p class="text-xs text-gray-400">${app.company}</p>
                                <p class="text-xs text-gray-500 mt-2">${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago</p>
                            </div>
                        `
                    }).join('')}
                </div>
            </div>
        `
    }).join('')
}

window.editJob = async function(jobId) {
    const job = applications.find(app => app._id === jobId)
    showJobModal(job)
}

function showJobModal(job = null) {

    const isEdit = job !== null
    
    const modalHTML = `
        <div id="jobModal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onclick="if(event.target.id==='jobModal') closeJobModal()">
            <div class="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 max-h-screen overflow-y-auto border border-gray-700">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-white">${isEdit ? 'Edit' : 'Add'} Job Application</h3>
                    <button onclick="closeJobModal()" class="text-gray-400 hover:text-gray-200">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <form id="jobForm" class="space-y-4">
                    <input type="hidden" id="jobId" value="${isEdit ? job._id : ''}">
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Company Name *</label>
                        <input type="text" id="jobCompany" value="${isEdit ? job.company : ''}" required 
                            class="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400" 
                            placeholder="e.g., Google">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Position *</label>
                        <input type="text" id="jobPosition" value="${isEdit ? job.position : ''}" required 
                            class="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400" 
                            placeholder="e.g., Frontend Developer">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Status</label>
                        <select id="jobStatus" class="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                            <option value="Applied" ${isEdit && job.status === 'Applied' ? 'selected' : ''}>Applied</option>
                            <option value="In Review" ${isEdit && job.status === 'In Review' ? 'selected' : ''}>In Review</option>
                            <option value="Interview" ${isEdit && job.status === 'Interview' ? 'selected' : ''}>Interview Scheduled</option>
                            <option value="Offer" ${isEdit && job.status === 'Offer' ? 'selected' : ''}>Offer Received</option>
                            <option value="Rejected" ${isEdit && job.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Date Applied</label>
                        <input type="date" id="jobDate" value="${isEdit ? new Date(job.dateApplied).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}" 
                            class="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Job URL (Optional)</label>
                        <input type="url" id="jobUrl" value="${isEdit && job.url ? job.url : ''}" 
                            class="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400" 
                            placeholder="https://...">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Notes (Optional)</label>
                        <textarea id="jobNotes" class="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400" 
                            rows="3" placeholder="Add any notes...">${isEdit && job.notes ? job.notes : ''}</textarea>
                    </div>
                    
                    <div class="flex space-x-3 mt-6">
                        ${isEdit ? `<button type="button" onclick="deleteJobFromModal('${job._id}')" class="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition font-medium">Delete</button>` : ''}
                        <button type="button" onclick="closeJobModal()" class="flex-1 bg-gray-700 text-gray-200 px-4 py-3 rounded-lg hover:bg-gray-600 transition font-medium">Cancel</button>
                        <button type="submit" class="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition font-medium">${isEdit ? 'Update' : 'Add'}</button>
                    </div>
                </form>
            </div>
        </div>
    `
    
    document.body.insertAdjacentHTML('beforeend', modalHTML)
    document.getElementById('jobForm').addEventListener('submit', saveJobHandler)
}

window.closeJobModal = function() {
    const modal = document.getElementById('jobModal');
    if (modal) modal.remove()
}

async function saveJobHandler(e) {
    e.preventDefault()

    const jobId = document.getElementById('jobId').value
    const isEdit = jobId !== ''
    
    const jobData = {
        company: document.getElementById('jobCompany').value.trim(),
        position: document.getElementById('jobPosition').value.trim(),
        status: document.getElementById('jobStatus').value,
        dateApplied: document.getElementById('jobDate').value,
        url: document.getElementById('jobUrl').value.trim(),
        notes: document.getElementById('jobNotes').value.trim()
    }

    try {

        const url = isEdit ? `${API_BASE_URL}/jobs/${jobId}` : `${API_BASE_URL}/jobs`
        const method = isEdit ? 'PUT' : 'POST'

        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(jobData)
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to save job application')
        }

        await loadJobApplications()
        await loadJobStats()
        closeJobModal()
        
        showNotification(isEdit ? 'Job application updated!' : 'Job application added!', 'success')

    } catch (error) {
        console.error('Error saving job:', error)
        showNotification(error.message, 'error')
    }
}

window.deleteJob = async function(jobId) {
    if (!confirm('Are you sure you want to delete this application?')) return
    
    try {

        const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        })

        if (!response.ok) {
            throw new Error('Failed to delete job application')
        }

        await loadJobApplications()
        await loadJobStats()
        
        showNotification('Job application deleted!', 'success')
        
    } catch (error) {
        console.error('Error deleting job:', error)
        showNotification('Error deleting job application', 'error')
    }
}

window.deleteJobFromModal = async function(jobId) {
    closeJobModal()
    await deleteJob(jobId)
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
        </div>
    `
    
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
                        </a>
                    `).join('')}
                </div>
                
                <button onclick="closeResourceModal()" class="mt-4 w-full bg-gray-700 text-gray-200 px-4 py-3 rounded-lg hover:bg-gray-600 transition font-medium">
                    Close
                </button>
            </div>
        </div>
    `
    
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

    if (page === 'jobtracker') {
        renderJobTable()
        renderKanbanBoard()
    }
}

function setActiveNavLink(page) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('bg-[#0b1739]')
    })
    
    const activeLink = document.querySelector(`[data-page="${page}"]`);
    if (activeLink) {
        activeLink.classList.add('bg-[#0b1739]')
    }
}

async function filterJobs() {
    const search = document.getElementById('searchJobs')?.value || ''
    const status = document.getElementById('filterStatus')?.value || 'all'
    const sortBy = document.getElementById('sortBy')?.value || 'newest'

    try {

        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (status !== 'all') params.append('status', status)
        if (sortBy) params.append('sortBy', sortBy)

        const response = await fetch(`${API_BASE_URL}/jobs?${params.toString()}`, {
            headers: getAuthHeaders()
        })

        if (!response.ok) throw new Error('Failed to filter jobs')

        const data = await response.json()
        applications = data.data || []
        renderJobTable()
        renderKanbanBoard()

    } catch (error) {
        console.error('Error filtering jobs:', error)
    }
}

function getDaysAgo(dateString) {

    const date = new Date(dateString)
    const today = new Date()
    const diffTime = Math.abs(today - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
}

function getStatusColor(status) {

    const colors = {
        'Applied': 'blue',
        'In Review': 'yellow',
        'Interview': 'green',
        'Offer': 'purple',
        'Rejected': 'red'
    }
    return colors[status] || 'blue'
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