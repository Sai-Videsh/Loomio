import mockApi from './mockApi'

// Use mock API instead of real backend
const api = mockApi

// Export API modules using mock API
export const authAPI = {
  login: mockApi.login,
  register: mockApi.register,
  getProfile: mockApi.getProfile,
  updateProfile: mockApi.updateProfile,
  changePassword: mockApi.changePassword,
  getUserStats: mockApi.getUserStats
}

export const usersAPI = {
  getUsers: mockApi.getUsers,
  createUser: mockApi.createUser,
  updateUser: mockApi.updateUser,
  deleteUser: mockApi.deleteUser
}

export const tasksAPI = {
  getTasks: mockApi.getTasks,
  createTask: mockApi.createTask,
  updateTaskStatus: mockApi.updateTaskStatus
}

export const contributionsAPI = {
  getContributions: mockApi.getContributions,
  getWeights: mockApi.getWeights,
  awardPoints: mockApi.awardPoints,
  updateWeights: mockApi.updateWeights
}

export const attendanceAPI = {
  getAttendance: mockApi.getAttendance,
  markAttendance: mockApi.markAttendance,
  updateAttendance: mockApi.updateAttendance
}

export const leavesAPI = {
  getLeaves: mockApi.getLeaves,
  createLeave: mockApi.createLeave,
  approveLeave: mockApi.approveLeave,
  rejectLeave: mockApi.rejectLeave
}

export const eventsAPI = {
  getEvents: mockApi.getEvents,
  createEvent: mockApi.createEvent,
  joinEvent: mockApi.joinEvent,
  leaveEvent: mockApi.leaveEvent
}

export const notificationsAPI = {
  getNotifications: mockApi.getNotifications,
  getUnreadCount: mockApi.getUnreadCount,
  markNotificationAsRead: mockApi.markNotificationAsRead,
  markAllNotificationsAsRead: mockApi.markAllNotificationsAsRead,
  deleteNotification: mockApi.deleteNotification
}

export const dashboardAPI = {
  getDashboard: mockApi.getDashboard
}

export const communitiesAPI = {
  getCommunities: mockApi.getCommunities,
  getCommunity: mockApi.getCommunity,
  createCommunity: mockApi.createCommunity,
  updateCommunity: mockApi.updateCommunity,
  deleteCommunity: mockApi.deleteCommunity,
  addMemberToCommunity: mockApi.addMemberToCommunity,
  removeMemberFromCommunity: mockApi.removeMemberFromCommunity,
  updateMemberRole: mockApi.updateMemberRole,
  getCommunityTasks: mockApi.getCommunityTasks,
  getCommunityMembers: mockApi.getCommunityMembers
}

export const calendarAPI = {
  getTaskCalendar: mockApi.getTaskCalendar
}

export default api
