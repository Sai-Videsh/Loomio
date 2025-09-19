import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, Filter, Search, Calendar, User, Award, CheckSquare, Users } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { tasksAPI, communitiesAPI, usersAPI } from '../services/api'
import { cn } from '../utils/cn'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'

const Tasks = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: tasks, isLoading, error } = useQuery(
    ['tasks', searchTerm, statusFilter],
    () => tasksAPI.getTasks({ search: searchTerm, status: statusFilter }),
    { refetchInterval: 30000 }
  )

  const { data: communities } = useQuery(
    ['communities'],
    () => communitiesAPI.getCommunities()
  )

  const { data: users } = useQuery(
    ['users'],
    () => usersAPI.getUsers()
  )

  const createTaskMutation = useMutation(tasksAPI.createTask, {
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks'])
      setShowCreateModal(false)
      toast.success('Task created successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create task')
    }
  })

  const updateStatusMutation = useMutation(
    ({ taskId, status }) => tasksAPI.updateTaskStatus(taskId, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks'])
        toast.success('Task status updated!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update task status')
      }
    }
  )

  const getStatusColor = (status) => {
    switch (status) {
      case 'not_started':
        return 'bg-gray-100 text-gray-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'not_started':
        return 'Not Started'
      case 'in_progress':
        return 'In Progress'
      case 'completed':
        return 'Completed'
      case 'overdue':
        return 'Overdue'
      default:
        return status
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'high':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load tasks. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track community tasks and assignments
          </p>
        </div>
        {(user?.role === 'admin' || user?.role === 'leader') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 sm:mt-0 btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
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
          <div className="sm:w-48">
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
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks?.data?.data?.map((task) => (
          <div key={task.id} className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
                {task.title}
              </h3>
              <span className={cn('px-2 py-1 text-xs font-medium rounded-full', getStatusColor(task.status))}>
                {getStatusLabel(task.status)}
              </span>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {task.description}
            </p>

            <div className="space-y-3 mb-4">
              {task.deadline && (
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                </div>
              )}
              
              {task.assigned_to && (
                <div className="flex items-center text-sm text-gray-500">
                  <User className="h-4 w-4 mr-2" />
                  <span>Assigned to: {task.assigned_to_name}</span>
                </div>
              )}

              {task.community_id && (
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-2" />
                  <span>Community: {communities?.data?.data?.find(c => c.id === task.community_id)?.name || 'Unknown'}</span>
                </div>
              )}

              <div className="flex items-center text-sm text-gray-500">
                <Award className="h-4 w-4 mr-2" />
                <span>{task.points_reward} points</span>
              </div>

              <span className={cn('inline-block px-2 py-1 text-xs font-medium rounded-full', getPriorityColor(task.priority))}>
                {task.priority} priority
              </span>
            </div>

            {/* Status Update Buttons */}
            {task.status !== 'completed' && (user?.role === 'admin' || user?.role === 'leader' || task.assigned_to === user?.id) && (
              <div className="flex gap-2">
                {task.status === 'not_started' && (
                  <button
                    onClick={() => updateStatusMutation.mutate({ taskId: task.id, status: 'in_progress' })}
                    className="btn btn-secondary btn-sm"
                    disabled={updateStatusMutation.isLoading}
                  >
                    Start
                  </button>
                )}
                {task.status === 'in_progress' && (
                  <button
                    onClick={() => updateStatusMutation.mutate({ taskId: task.id, status: 'completed' })}
                    className="btn btn-success btn-sm"
                    disabled={updateStatusMutation.isLoading}
                  >
                    Complete
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {tasks?.data?.data?.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <CheckSquare className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating a new task.'
            }
          </p>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createTaskMutation.mutate(data)}
          isLoading={createTaskMutation.isLoading}
        />
      )}
    </div>
  )
}

// Create Task Modal Component
const CreateTaskModal = ({ onClose, onSubmit, isLoading }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  const handleFormSubmit = (data) => {
    onSubmit(data)
    reset()
  }

  const { data: communities } = useQuery(
    ['communities'],
    () => communitiesAPI.getCommunities()
  )

  const { data: users } = useQuery(
    ['users'],
    () => usersAPI.getUsers()
  )

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Task</h3>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                {...register('title', { required: 'Title is required' })}
                className="input mt-1 w-full"
                placeholder="Enter task title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-danger-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="input mt-1 w-full"
                placeholder="Enter task description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Deadline</label>
              <input
                type="datetime-local"
                {...register('deadline')}
                className="input mt-1 w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select {...register('priority')} className="input mt-1 w-full">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Community</label>
              <select {...register('community_id', { required: 'Community is required' })} className="input mt-1 w-full">
                <option value="">Select a community</option>
                {communities?.data?.data?.map((community) => (
                  <option key={community.id} value={community.id}>
                    {community.name}
                  </option>
                ))}
              </select>
              {errors.community_id && (
                <p className="mt-1 text-sm text-red-600">{errors.community_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Assign To</label>
              <select {...register('assigned_to', { required: 'Assignee is required' })} className="input mt-1 w-full">
                <option value="">Select a member</option>
                {users?.data?.data?.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              {errors.assigned_to && (
                <p className="mt-1 text-sm text-red-600">{errors.assigned_to.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Points Reward</label>
              <input
                type="number"
                {...register('points_reward', { min: 1 })}
                className="input mt-1 w-full"
                placeholder="10"
                defaultValue={10}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary flex-1"
              >
                {isLoading ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Tasks
