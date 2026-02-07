const API_BASE_URL = 'http://localhost:8888/api'
const getToken = () => {
    return localStorage.getItem('token')
}

const getAuthHeaders = () => {
    const token = getToken()
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    }
}

const handleResponse = async (response) => {
    const data = await response.json()
    
    if (!response.ok) {
        if (response.status === 401) {
        
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login.html'
        }
        throw new Error(data.message || 'An error occurred')
    }
    
    return data
}

export const authAPI = {
    
    register: async (userData) => {
        try {

            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            
            const data = await handleResponse(response)
            
            if (data.token) {
                localStorage.setItem('token', data.token)
                localStorage.setItem('user', JSON.stringify(data.user))
            }
            
            return data
        } catch (error) {
            throw error
        }
    },


    login: async (email, password) => {
        try {

            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })
            
            const data = await handleResponse(response)
            
            if (data.token) {
                localStorage.setItem('token', data.token)
                localStorage.setItem('user', JSON.stringify(data.user))
            }
            
            return data

        } catch (error) {
            throw error
        }
    },

    getCurrentUser: async () => {
        try {

            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: getAuthHeaders()
            })
            
            const data = await handleResponse(response)
            localStorage.setItem('user', JSON.stringify(data.user))

            return data

        } catch (error) {
            throw error
        }
    },

    updateProfile: async (profileData) => {
        try {

            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(profileData)
            })
            
            const data = await handleResponse(response)
            localStorage.setItem('user', JSON.stringify(data.user))

            return data

        } catch (error) {
            throw error
        }
    },

    logout: () => {
        
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login.html'
    },

    isLoggedIn: () => {
        return !!getToken()
    },

    getStoredUser: () => {
        const user = localStorage.getItem('user')
        return user ? JSON.parse(user) : null
    }
}

export const jobAPI = {
    
    create: async (jobData) => {
        try {

            const response = await fetch(`${API_BASE_URL}/jobs`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(jobData)
            })
            
            return await handleResponse(response)

        } catch (error) {
            throw error
        }
    },

    getAll: async (filters = {}) => {
        try {
          
            const params = new URLSearchParams()

            if (filters.status) params.append('status', filters.status)
            if (filters.search) params.append('search', filters.search)
            if (filters.sortBy) params.append('sortBy', filters.sortBy)
            if (filters.page) params.append('page', filters.page)
            if (filters.limit) params.append('limit', filters.limit)
            
            const queryString = params.toString()
            const url = `${API_BASE_URL}/jobs${queryString ? '?' + queryString : ''}`
            
            const response = await fetch(url, {
                headers: getAuthHeaders()
            });
            
            return await handleResponse(response)

        } catch (error) {
            throw error
        }
    },

    getOne: async (id) => {
        try {

            const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
                headers: getAuthHeaders()
            })
            
            return await handleResponse(response)

        } catch (error) {
            throw error
        }
    },

    update: async (id, jobData) => {
        try {

            const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(jobData)
            })
            
            return await handleResponse(response)

        } catch (error) {
            throw error
        }
    },

    delete: async (id) => {
        try {

            const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            })
            
            return await handleResponse(response)

        } catch (error) {
            throw error
        }
    },

    getStats: async () => {
        try {

            const response = await fetch(`${API_BASE_URL}/jobs/stats`, {
                headers: getAuthHeaders()
            })
            
            return await handleResponse(response)

        } catch (error) {
            throw error
        }
    }
}

export const utils = {
   
    getDaysAgo: (dateString) => {
        
        const date = new Date(dateString)
        const today = new Date()
        const diffTime = Math.abs(today - date)
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    },

    formatDateForInput: (dateString) => {
        const date = new Date(dateString)
        return date.toISOString().split('T')[0]
    },

    getStatusColors: (status) => {

        const colors = {

            'Applied': { statusColor: 'blue', iconColor: 'blue' },
            'In Review': { statusColor: 'yellow', iconColor: 'orange' },
            'Interview': { statusColor: 'green', iconColor: 'green' },
            'Offer': { statusColor: 'purple', iconColor: 'purple' },
            'Rejected': { statusColor: 'red', iconColor: 'gray' }
        }

        return colors[status] || colors['Applied']
    }
}