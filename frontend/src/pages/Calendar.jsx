import { useState } from 'react'
import { useQuery } from 'react-query'
import { Calendar as CalendarIcon, Filter, Search, Clock, User, Award } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { calendarAPI, communitiesAPI } from '../services/api'
import { cn } from '../utils/cn'
import LoadingSpinner from '../components/LoadingSpinner'

const Calendar = () => {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [communityFilter, setCommunityFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: calendarData, isLoading: calendarLoading } = useQuery(
    ['task-calendar', { user_id: user?.id }],
    () => calendarAPI.getTaskCalendar({ user_id: user?.id })
  )

  const { data: communities } = useQuery(
    ['communities'],
    () => communitiesAPI.getCommunities()
  )

  // Filter tasks based on selected filters
  const filteredTasks = calendarData?.data?.data?.filter(task => {
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
    const matchesCommunity = communityFilter === 'all' || task.community_id === parseInt(communityFilter)
    const matchesSearch = !searchTerm || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesStatus && matchesPriority && matchesCommunity && matchesSearch
  }) || []

  // Group tasks by date
  const tasksByDate = filteredTasks.reduce((acc, task) => {
    const date = new Date(task.start).toDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(task)
    return acc
  }, {})

  // Get dates for the current month view
  const getMonthDates = () => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const dates = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return dates
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'not_started':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500'
      case 'medium':
        return 'border-l-yellow-500'
      case 'low':
        return 'border-l-green-500'
      default:
        return 'border-l-gray-300'
    }
  }

  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date) => {
    return date.getMonth() === selectedDate.getMonth()
  }

  if (calendarLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Calendar</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your task deadlines
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
          <button
            onClick={() => setSelectedDate(new Date())}
            className="btn btn-secondary btn-sm"
          >
            Today
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full"
            >
              <option value="all">All Status</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="input w-full"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Community Filter */}
          <div>
            <select
              value={communityFilter}
              onChange={(e) => setCommunityFilter(e.target.value)}
              className="input w-full"
            >
              <option value="all">All Communities</option>
              {communities?.data?.data?.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            const newDate = new Date(selectedDate)
            newDate.setMonth(newDate.getMonth() - 1)
            setSelectedDate(newDate)
          }}
          className="btn btn-secondary btn-sm"
        >
          Previous
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <button
          onClick={() => {
            const newDate = new Date(selectedDate)
            newDate.setMonth(newDate.getMonth() + 1)
            setSelectedDate(newDate)
          }}
          className="btn btn-secondary btn-sm"
        >
          Next
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="px-4 py-3 text-sm font-medium text-gray-900 text-center">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {getMonthDates().map((date, index) => {
            const dateString = date.toDateString()
            const dayTasks = tasksByDate[dateString] || []
            const isCurrentMonthDay = isCurrentMonth(date)
            const isTodayDate = isToday(date)

            return (
              <div
                key={index}
                className={cn(
                  "min-h-[120px] border-r border-b border-gray-200 p-2",
                  !isCurrentMonthDay && "bg-gray-50",
                  isTodayDate && "bg-blue-50"
                )}
              >
                <div className={cn(
                  "text-sm font-medium mb-1",
                  isTodayDate && "text-blue-600",
                  !isCurrentMonthDay && "text-gray-400"
                )}>
                  {date.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "text-xs p-1 rounded border-l-2 cursor-pointer hover:bg-gray-50",
                        getStatusColor(task.status),
                        getPriorityColor(task.priority)
                      )}
                      title={`${task.title} - ${task.status} (${task.priority} priority)`}
                    >
                      <div className="font-medium truncate">{task.title}</div>
                      <div className="text-xs opacity-75">{task.assigned_to_name}</div>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Task List View */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Upcoming Tasks ({filteredTasks.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <div key={task.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {task.title}
                      </h4>
                      <span className={cn('px-2 py-1 text-xs font-medium rounded-full', getStatusColor(task.status))}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className={cn('px-2 py-1 text-xs font-medium rounded-full', getPriorityColor(task.priority))}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {task.assigned_to_name}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Due: {new Date(task.start).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Award className="h-3 w-3 mr-1" />
                        {task.points_reward} points
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your filters or create new tasks.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Calendar
