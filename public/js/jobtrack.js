let applications = []
let weeklyGoal = 5

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

  } catch(error) {
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
  
  } catch(error) {
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
  document.getElementById('responseRate').textContent = (stats.response || 0) + '%'

}
function updateWeeklyGoal() {

  const weeklyApps = application.filter(app => {

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return new Date(app.dateApplied) >= sevenDaysAgo
  }).length

  const percentage = Math.min((weeklyApps / weeklyGoal) * 100, 100)

  document.getElementById('currentGoal').textContent = weeklyApps
  document.getElementById('goalPercentage').textContent = percentage.toFixed(0) + '%'
  document.getElementById('progressBar').style.widtg = percentage + '%'

  const remaining = weeklyGoal - weeklyApps
  const goalMessage = document.getElementById('goalMessage')

  if (remaining > 0) {

    goalMessage.innerHTML = `<i class="fas fa-bullseye mr-2"></i>Keep it up! Just ${remaining} more application${remaining > 1 ? 's' : ''} to hit your weekly goal.`

  } else {

    goalMessage.innerHTML = `<i class="fas fa-trophy mr-2"></i>Congratulations! You've achieved your weekly goal!`

  }
}

function renderRecentApplications() {

  const list = document.getElementById('applicationsList')

  if (!applications || applications.length === 0) {
    list.innerHTML = `<div class="text-center py-8 text-gray-400">
    <i class="fas fa-briefcase text-4xl mb-2"></i>
    <p>No applications yet. Click "Add Job Application" to get started!</p>
    </div>`

    return
  }

  const recentApps = applications.slice(0,3)
  list.innerHTML = recentApps.map(app => {

    const daysAgo = getDaysAgo(app.dateApplied)

    return `

    <div class="flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition cursor-pointer" onclick="editJob('${app._id}')">
      <div class="flex items-center space-x-4">
      <div class="w-12 h-12 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center">
      <i class="fas fa-briefcase text-blue-400"></i>
      </div>
    <div>
      <h4 class="font-medium text-white">${app.position}></h4>
      <p class="text-sm text-gray-400">${app.company} • ${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago</p>
      </div>
      </div>
    <span class="px-3 py-1 bg-${getStatusColor(app.status)}-500 bg-opacity-20 text-${getStatusColor(app.status)}-300 text-xs font-medium rounded-full border border-${getStatusColor(app.status)}-500 border-opacity-30">${app.status}</span>
    </div>`

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
    </tr>`

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
    </div>` 
    
    : statusApps.map(app => {

    const daysAgo = getDaysAgo(app.dateApplied)
    
    return `

    <div class="bg-gray-700 p-3 rounded-lg border border-gray-600 hover:border-indigo-500 hover:shadow-lg transition cursor-pointer" onclick="editJob('${app._id}')">
      <h5 class="font-medium text-white text-sm mb-1">${app.position}</h5>
      <p class="text-xs text-gray-400">${app.company}</p>
      <p class="text-xs text-gray-500 mt-2">${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago</p>
    </div>
      `

}).join('')}

    </div>
  </div>`
    
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
</div>`
    
    document.body.insertAdjacentHTML('beforeend', modalHTML)
    document.getElementById('jobForm').addEventListener('submit', saveJobHandler)

}

window.closeJobModal = function() {

    const modal = document.getElementById('jobModal')
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

  } catch(error) {
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

function initJobTracker() {

  loadJobApplications()
  loadJobStats()

}

window.initJobTracker = initJobTracker
