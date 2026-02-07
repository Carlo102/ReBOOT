function showTab(tabName) {

  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'))
  document.querySelectorAll('.tab-btn').forEach(btn => {

    btn.classList.remove('active', 'bg-blue-600', 'text-white')
    btn.classList.add('bg-gray-800', 'text-gray-400')
  })
      
  document.getElementById(tabName + 'Tab').classList.remove('hidden')
  document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).classList.add('active', 'bg-blue-600', 'text-white')

  }

  function refreshCourses() {

    if (typeof upskillSystem !== 'undefined') {
      upskillSystem.loadRecommendedCourses()
    }
  }

   
  function completeDailyChallenge() {

    const btn = document.getElementById('challengeBtn')
    btn.innerHTML = `
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
      </svg>
      Completed Today ✓
      `
    btn.disabled = true
    btn.classList.remove('bg-green-600', 'hover:bg-green-700', 'hover:scale-105')
    btn.classList.add('bg-gray-600', 'cursor-not-allowed', 'opacity-50')
      
      
    const count = parseInt(document.getElementById('challengesCompleted').textContent)
    document.getElementById('challengesCompleted').textContent = count + 1
      
      
    if (typeof upskillSystem !== 'undefined') {
      upskillSystem.completeDailyChallenge()
    }
  }

    
  function startChallengeTimer() {
    const timerElement = document.getElementById('challengeTimer')
    if (!timerElement) return
      
    let hours = 23, minutes = 45, seconds = 12

    setInterval(() => {

      seconds--
      if (seconds < 0) {

        seconds = 59
        minutes--
      }
      if (minutes < 0) {

        minutes = 59
        hours--
      }
      if (hours < 0) {

        hours = 23
        minutes = 59
        seconds = 59
      }

      timerElement.textContent = 
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }, 1000)
  }

   
  window.addEventListener('load', () => {

    startChallengeTimer()
    showTab('courses')
      
      
    if (typeof upskillSystem !== 'undefined') {
      
      upskillSystem.loadRecommendedCourses()
    }
  })

    
  function showUpskillSection() {
     
    const allSections = document.querySelectorAll('[id$="Section"]')
    allSections.forEach(section => section.classList.add('hidden'))
      
     
    document.getElementById('upskillhubPage').classList.remove('hidden')
      
      
    if (typeof upskillSystem !== 'undefined') {

      upskillSystem.loadRecommendedCourses()
    }
  }