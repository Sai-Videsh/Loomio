// Mock API service to replace backend calls
import { faker } from '@faker-js/faker'

// Mock data generators
const generateUsers = () => [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@loomio.com',
    role: 'admin',
    total_points: 150,
    join_date: '2024-01-15',
    is_active: true
  },
  {
    id: 2,
    name: 'John Doe',
    email: 'john@loomio.com',
    role: 'leader',
    total_points: 120,
    join_date: '2024-02-01',
    is_active: true
  },
  {
    id: 3,
    name: 'Jane Smith',
    email: 'jane@loomio.com',
    role: 'member',
    total_points: 85,
    join_date: '2024-02-15',
    is_active: true
  },
  {
    id: 4,
    name: 'Bob Wilson',
    email: 'bob@loomio.com',
    role: 'member',
    total_points: 65,
    join_date: '2024-03-01',
    is_active: true
  }
]

// Community data generator
const generateCommunities = () => [
  {
    id: 1,
    name: 'Tech Innovators Community',
    description: 'A community focused on technology innovation and collaboration',
    created_by: 1,
    created_at: '2024-01-01T00:00:00',
    is_active: true,
    member_count: 4,
    task_count: 3,
    members: [
      { user_id: 1, role: 'admin', joined_at: '2024-01-01T00:00:00' },
      { user_id: 2, role: 'leader', joined_at: '2024-01-15T00:00:00' },
      { user_id: 3, role: 'member', joined_at: '2024-02-01T00:00:00' },
      { user_id: 4, role: 'member', joined_at: '2024-02-15T00:00:00' }
    ]
  },
  {
    id: 2,
    name: 'Design Studio Collective',
    description: 'Creative designers working together on innovative projects',
    created_by: 2,
    created_at: '2024-02-01T00:00:00',
    is_active: true,
    member_count: 2,
    task_count: 1,
    members: [
      { user_id: 2, role: 'admin', joined_at: '2024-02-01T00:00:00' },
      { user_id: 3, role: 'member', joined_at: '2024-02-15T00:00:00' }
    ]
  }
]

const generateTasks = () => [
  {
    id: 1,
    title: 'Website Redesign',
    description: 'Redesign the community website with modern UI/UX',
    assigned_by: 2,
    assigned_to: 3,
    assigned_to_name: 'Jane Smith',
    community_id: 1,
    status: 'in_progress',
    priority: 'high',
    deadline: '2024-12-15T10:00:00',
    points_reward: 25,
    created_at: '2024-11-01T09:00:00'
  },
  {
    id: 2,
    title: 'Event Planning',
    description: 'Plan the annual community gathering event',
    assigned_by: 1,
    assigned_to: 2,
    assigned_to_name: 'John Doe',
    community_id: 1,
    status: 'completed',
    priority: 'medium',
    deadline: '2024-11-30T18:00:00',
    points_reward: 20,
    created_at: '2024-10-15T14:00:00'
  },
  {
    id: 3,
    title: 'Documentation Update',
    description: 'Update community guidelines and documentation',
    assigned_by: 2,
    assigned_to: 4,
    assigned_to_name: 'Bob Wilson',
    community_id: 1,
    status: 'not_started',
    priority: 'low',
    deadline: '2024-12-31T17:00:00',
    points_reward: 15,
    created_at: '2024-11-10T11:00:00'
  },
  {
    id: 4,
    title: 'Logo Design',
    description: 'Create a new logo for the design studio',
    assigned_by: 2,
    assigned_to: 3,
    assigned_to_name: 'Jane Smith',
    community_id: 2,
    status: 'in_progress',
    priority: 'high',
    deadline: '2024-12-20T16:00:00',
    points_reward: 30,
    created_at: '2024-11-15T10:00:00'
  }
]

const generateEvents = () => [
  {
    id: 1,
    title: 'Community Meetup',
    description: 'Monthly community gathering and networking event',
    date: '2024-12-20T18:00:00',
    location: 'Community Center',
    created_by: 2,
    participants: [
      { user_id: 1, user_name: 'Admin User' },
      { user_id: 2, user_name: 'John Doe' },
      { user_id: 3, user_name: 'Jane Smith' }
    ]
  },
  {
    id: 2,
    title: 'Workshop: Task Management',
    description: 'Learn effective task management techniques',
    date: '2024-12-25T14:00:00',
    location: 'Online',
    created_by: 1,
    participants: [
      { user_id: 2, user_name: 'John Doe' },
      { user_id: 4, user_name: 'Bob Wilson' }
    ]
  }
]

const generateAttendance = () => [
  {
    id: 1,
    user_id: 1,
    user_name: 'Admin User',
    date: '2024-12-01',
    status: 'present',
    created_at: '2024-12-01T09:00:00'
  },
  {
    id: 2,
    user_id: 2,
    user_name: 'John Doe',
    date: '2024-12-01',
    status: 'present',
    created_at: '2024-12-01T08:45:00'
  },
  {
    id: 3,
    user_id: 3,
    user_name: 'Jane Smith',
    date: '2024-12-01',
    status: 'late',
    created_at: '2024-12-01T09:15:00'
  },
  {
    id: 4,
    user_id: 4,
    user_name: 'Bob Wilson',
    date: '2024-12-01',
    status: 'absent',
    created_at: null
  }
]

const generateLeaves = () => [
  {
    id: 1,
    user_id: 3,
    user_name: 'Jane Smith',
    start_date: '2024-12-10',
    end_date: '2024-12-12',
    reason: 'Personal vacation',
    status: 'approved'
  },
  {
    id: 2,
    user_id: 4,
    user_name: 'Bob Wilson',
    start_date: '2024-12-15',
    end_date: '2024-12-16',
    reason: 'Medical appointment',
    status: 'pending'
  }
]

const generateContributions = () => [
  {
    id: 1,
    user_id: 1,
    user_name: 'Admin User',
    activity_type: 'task_completion',
    points: 25,
    description: 'Completed website redesign task',
    created_at: '2024-11-30T16:00:00'
  },
  {
    id: 2,
    user_id: 2,
    user_name: 'John Doe',
    activity_type: 'attendance',
    points: 5,
    description: 'Present for daily check-in',
    created_at: '2024-12-01T09:00:00'
  },
  {
    id: 3,
    user_id: 3,
    user_name: 'Jane Smith',
    activity_type: 'task_completion',
    points: 20,
    description: 'Completed event planning task',
    created_at: '2024-11-28T14:30:00'
  }
]

// Mock API responses
const mockApi = {
  // Auth endpoints
  login: async (credentials) => {
    await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay
    
    const users = generateUsers()
    const user = users.find(u => u.email === credentials.email)
    
    if (user && credentials.password === 'password') {
      return {
        success: true,
        data: {
          user,
          token: 'mock-jwt-token-' + Date.now()
        }
      }
    }
    
    throw new Error('Invalid credentials')
  },

  register: async (userData) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      success: true,
      data: {
        user: {
          id: Date.now(),
          ...userData,
          role: 'member',
          total_points: 0,
          join_date: new Date().toISOString().split('T')[0],
          is_active: true
        },
        token: 'mock-jwt-token-' + Date.now()
      }
    }
  },

  getProfile: async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { data: generateUsers()[0] }
  },

  updateProfile: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return { data: { ...generateUsers()[0], ...data } }
  },

  changePassword: async () => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return { success: true }
  },

  // Tasks endpoints
  getTasks: async (params = {}) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    let tasks = generateTasks()
    
    if (params.search) {
      tasks = tasks.filter(task => 
        task.title.toLowerCase().includes(params.search.toLowerCase()) ||
        task.description.toLowerCase().includes(params.search.toLowerCase())
      )
    }
    
    if (params.status && params.status !== 'all') {
      tasks = tasks.filter(task => task.status === params.status)
    }
    
    return {
      data: {
        data: tasks,
        total: tasks.length
      }
    }
  },

  createTask: async (taskData) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      data: {
        id: Date.now(),
        ...taskData,
        created_at: new Date().toISOString()
      }
    }
  },

  updateTaskStatus: async (taskId, status) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true }
  },

  // Events endpoints
  getEvents: async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return {
      data: {
        data: generateEvents()
      }
    }
  },

  createEvent: async (eventData) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      data: {
        id: Date.now(),
        ...eventData,
        participants: []
      }
    }
  },

  joinEvent: async (eventId) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true }
  },

  leaveEvent: async (eventId) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true }
  },

  // Attendance endpoints
  getAttendance: async (params = {}) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const attendance = generateAttendance()
    
    const summary = {
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      total: attendance.length
    }
    
    return {
      data: {
        data: attendance,
        summary
      }
    }
  },

  markAttendance: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true }
  },

  updateAttendance: async (id, data) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true }
  },

  // Leaves endpoints
  getLeaves: async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return {
      data: {
        data: generateLeaves()
      }
    }
  },

  createLeave: async (leaveData) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      data: {
        id: Date.now(),
        ...leaveData,
        status: 'pending'
      }
    }
  },

  approveLeave: async (leaveId, data) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true }
  },

  rejectLeave: async (leaveId, data) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true }
  },

  // Contributions endpoints
  getContributions: async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const contributions = generateContributions()
    
    const summary = {
      total_points: contributions.reduce((sum, c) => sum + c.points, 0),
      active_contributors: new Set(contributions.map(c => c.user_id)).size,
      average_points: Math.round(contributions.reduce((sum, c) => sum + c.points, 0) / contributions.length)
    }
    
    const top_contributors = generateUsers()
      .map(user => ({
        name: user.name,
        points: user.total_points
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5)
    
    const points_distribution = [
      { name: 'Task Completion', value: 45 },
      { name: 'Attendance', value: 30 },
      { name: 'Participation', value: 15 },
      { name: 'Leadership', value: 10 }
    ]
    
    return {
      data: {
        summary,
        top_contributors,
        points_distribution,
        recent_contributions: contributions.slice(0, 10)
      }
    }
  },

  getWeights: async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return {
      data: {
        weights: [
          { id: 1, activity_type: 'task_completion', points: 10 },
          { id: 2, activity_type: 'attendance', points: 5 },
          { id: 3, activity_type: 'participation', points: 2 },
          { id: 4, activity_type: 'leadership', points: 15 }
        ]
      }
    }
  },

  awardPoints: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return { success: true }
  },

  updateWeights: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true }
  },

  // Users endpoints
  getUsers: async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return {
      data: {
        data: generateUsers()
      }
    }
  },

  createUser: async (userData) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      data: {
        id: Date.now(),
        ...userData,
        total_points: 0,
        join_date: new Date().toISOString().split('T')[0],
        is_active: true
      }
    }
  },

  updateUser: async (userId, userData) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return { success: true }
  },

  deleteUser: async (userId) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true }
  },

  // Notifications endpoints
  getNotifications: async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return {
      data: {
        data: [
          {
            id: 1,
            title: 'New Task Assigned',
            message: 'You have been assigned a new task: Website Redesign',
            is_read: false,
            created_at: '2024-12-01T10:00:00'
          },
          {
            id: 2,
            title: 'Leave Request Approved',
            message: 'Your leave request for Dec 10-12 has been approved',
            is_read: true,
            created_at: '2024-11-30T15:30:00'
          }
        ]
      }
    }
  },

  getUnreadCount: async () => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return { data: { unread_count: 1 } }
  },

  markNotificationAsRead: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return { success: true }
  },

  markAllNotificationsAsRead: async () => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return { success: true }
  },

  deleteNotification: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return { success: true }
  },

  // Dashboard endpoints
  getDashboard: async () => {
    await new Promise(resolve => setTimeout(resolve, 400))
    const users = generateUsers()
    const tasks = generateTasks()
    const contributions = generateContributions()
    const leaves = generateLeaves()
    
    return {
      data: {
        userStats: {
          total_users: users.length,
          active_users: users.filter(u => u.is_active).length
        },
        taskStats: {
          total_tasks: tasks.length,
          completed_tasks: tasks.filter(t => t.status === 'completed').length,
          pending_tasks: tasks.filter(t => t.status === 'not_started').length
        },
        contributionStats: {
          total_points_awarded: contributions.reduce((sum, c) => sum + c.points, 0),
          total_points_earned: 85, // Mock user's earned points
          active_contributors: new Set(contributions.map(c => c.user_id)).size
        },
        leaveStats: {
          total_requests: leaves.length,
          pending_requests: leaves.filter(l => l.status === 'pending').length,
          approved_requests: leaves.filter(l => l.status === 'approved').length
        },
        attendanceStats: {
          present_days: 22,
          absent_days: 3,
          late_days: 2
        },
        recentTasks: tasks.slice(0, 5),
        topContributors: users
          .map(user => ({ name: user.name, points: user.total_points }))
          .sort((a, b) => b.points - a.points)
          .slice(0, 5),
        upcomingEvents: generateEvents().slice(0, 3)
      }
    }
  },

  getUserStats: async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return {
      data: {
        task_stats: {
          total: 8,
          completed: 5,
          in_progress: 2,
          overdue: 1
        },
        attendance_stats: {
          present: 22,
          absent: 3,
          late: 2,
          rate: 85
        },
        contribution_stats: {
          total_earned: 85,
          this_month: 25,
          avg_per_task: 12,
          rank: 3
        },
        leave_stats: {
          total: 2,
          approved: 1,
          pending: 1,
          rejected: 0
        }
      }
    }
  },

  // Community endpoints
  getCommunities: async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return {
      data: {
        data: generateCommunities()
      }
    }
  },

  getCommunity: async (communityId) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const communities = generateCommunities()
    const community = communities.find(c => c.id === parseInt(communityId))
    
    if (!community) {
      throw new Error('Community not found')
    }
    
    return { data: community }
  },

  createCommunity: async (communityData) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      data: {
        id: Date.now(),
        ...communityData,
        created_at: new Date().toISOString(),
        is_active: true,
        member_count: 1,
        task_count: 0,
        members: [
          { user_id: 1, role: 'admin', joined_at: new Date().toISOString() }
        ]
      }
    }
  },

  updateCommunity: async (communityId, communityData) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return { success: true }
  },

  deleteCommunity: async (communityId) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true }
  },

  addMemberToCommunity: async (communityId, memberData) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      data: {
        id: Date.now(),
        community_id: parseInt(communityId),
        user_id: memberData.user_id,
        role: memberData.role || 'member',
        joined_at: new Date().toISOString()
      }
    }
  },

  removeMemberFromCommunity: async (communityId, userId) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true }
  },

  updateMemberRole: async (communityId, userId, role) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true }
  },

  getCommunityTasks: async (communityId) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const tasks = generateTasks()
    const communityTasks = tasks.filter(task => task.community_id === parseInt(communityId))
    
    return {
      data: {
        data: communityTasks,
        total: communityTasks.length
      }
    }
  },

  getCommunityMembers: async (communityId) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const communities = generateCommunities()
    const community = communities.find(c => c.id === parseInt(communityId))
    
    if (!community) {
      throw new Error('Community not found')
    }
    
    const users = generateUsers()
    const members = community.members.map(member => {
      const user = users.find(u => u.id === member.user_id)
      return {
        ...member,
        user: user
      }
    })
    
    return {
      data: {
        data: members
      }
    }
  },

  // Calendar endpoints
  getTaskCalendar: async (params = {}) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const tasks = generateTasks()
    const users = generateUsers()
    
    // Filter tasks by user if specified
    let filteredTasks = tasks
    if (params.user_id) {
      filteredTasks = tasks.filter(task => task.assigned_to === parseInt(params.user_id))
    }
    
    // Filter by community if specified
    if (params.community_id) {
      filteredTasks = filteredTasks.filter(task => task.community_id === parseInt(params.community_id))
    }
    
    // Format tasks for calendar
    const calendarTasks = filteredTasks.map(task => {
      const assignedUser = users.find(u => u.id === task.assigned_to)
      return {
        id: task.id,
        title: task.title,
        description: task.description,
        start: task.deadline,
        end: task.deadline,
        status: task.status,
        priority: task.priority,
        assigned_to: task.assigned_to,
        assigned_to_name: assignedUser?.name || task.assigned_to_name,
        community_id: task.community_id,
        points_reward: task.points_reward
      }
    })
    
    return {
      data: {
        data: calendarTasks
      }
    }
  }
}

export default mockApi
