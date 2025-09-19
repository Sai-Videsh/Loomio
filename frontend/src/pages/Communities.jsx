import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, Users, Edit, Trash2, UserPlus, Settings, Calendar } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { communitiesAPI } from '../services/api'
import { cn } from '../utils/cn'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'

const Communities = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCommunity, setSelectedCommunity] = useState(null)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [showTasksModal, setShowTasksModal] = useState(false)

  const { data: communities, isLoading, error } = useQuery(
    ['communities'],
    () => communitiesAPI.getCommunities(),
    { refetchInterval: 30000 }
  )

  const createCommunityMutation = useMutation(communitiesAPI.createCommunity, {
    onSuccess: () => {
      queryClient.invalidateQueries(['communities'])
      setShowCreateModal(false)
      toast.success('Community created successfully!')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create community')
    }
  })

  const deleteCommunityMutation = useMutation(communitiesAPI.deleteCommunity, {
    onSuccess: () => {
      queryClient.invalidateQueries(['communities'])
      toast.success('Community deleted successfully!')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete community')
    }
  })

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
        <p className="text-gray-500">Failed to load communities. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communities</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your communities and collaborate with members
          </p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 sm:mt-0 btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Community
          </button>
        )}
      </div>

      {/* Communities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {communities?.data?.data?.map((community) => (
          <div key={community.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {community.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {community.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {community.member_count} members
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {community.task_count} tasks
                    </div>
                  </div>

                  <div className="text-xs text-gray-400">
                    Created {new Date(community.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setSelectedCommunity(community)
                    setShowMembersModal(true)
                  }}
                  className="btn btn-secondary btn-sm flex-1"
                >
                  <Users className="h-4 w-4 mr-1" />
                  Members
                </button>
                <button
                  onClick={() => {
                    setSelectedCommunity(community)
                    setShowTasksModal(true)
                  }}
                  className="btn btn-secondary btn-sm flex-1"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Tasks
                </button>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this community?')) {
                        deleteCommunityMutation.mutate(community.id)
                      }
                    }}
                    className="btn btn-danger btn-sm"
                    disabled={deleteCommunityMutation.isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {communities?.data?.data?.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No communities</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new community.
          </p>
          {user?.role === 'admin' && (
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Community
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Community Modal */}
      {showCreateModal && (
        <CreateCommunityModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createCommunityMutation.mutate(data)}
          isLoading={createCommunityMutation.isLoading}
        />
      )}

      {/* Members Modal */}
      {showMembersModal && selectedCommunity && (
        <MembersModal
          community={selectedCommunity}
          onClose={() => {
            setShowMembersModal(false)
            setSelectedCommunity(null)
          }}
        />
      )}

      {/* Tasks Modal */}
      {showTasksModal && selectedCommunity && (
        <TasksModal
          community={selectedCommunity}
          onClose={() => {
            setShowTasksModal(false)
            setSelectedCommunity(null)
          }}
        />
      )}
    </div>
  )
}

// Create Community Modal Component
const CreateCommunityModal = ({ onClose, onSubmit, isLoading }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  const handleFormSubmit = (data) => {
    onSubmit(data)
    reset()
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Community</h3>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Community Name</label>
              <input
                type="text"
                {...register('name', { required: 'Community name is required' })}
                className="input mt-1 w-full"
                placeholder="Enter community name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                className="input mt-1 w-full"
                rows={3}
                placeholder="Describe your community"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
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
                {isLoading ? 'Creating...' : 'Create Community'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Members Modal Component
const MembersModal = ({ community, onClose }) => {
  const { data: members, isLoading } = useQuery(
    ['community-members', community.id],
    () => communitiesAPI.getCommunityMembers(community.id)
  )

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Members - {community.name}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <span className="sr-only">Close</span>
              ×
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <div className="space-y-3">
              {members?.data?.data?.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {member.user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {member.user?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {member.user?.email}
                      </p>
                    </div>
                  </div>
                  <span className={cn('px-2 py-1 text-xs font-medium rounded-full', {
                    'bg-red-100 text-red-800': member.role === 'admin',
                    'bg-blue-100 text-blue-800': member.role === 'leader',
                    'bg-green-100 text-green-800': member.role === 'member'
                  })}>
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Tasks Modal Component
const TasksModal = ({ community, onClose }) => {
  const { data: tasks, isLoading } = useQuery(
    ['community-tasks', community.id],
    () => communitiesAPI.getCommunityTasks(community.id)
  )

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'not_started':
        return 'bg-gray-100 text-gray-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Tasks - {community.name}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <span className="sr-only">Close</span>
              ×
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <div className="space-y-3">
              {tasks?.data?.data?.map((task) => (
                <div key={task.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        {task.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {task.description}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>Assigned to: {task.assigned_to_name}</span>
                        <span>•</span>
                        <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{task.points_reward} points</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <span className={cn('px-2 py-1 text-xs font-medium rounded-full', getStatusColor(task.status))}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className={cn('px-2 py-1 text-xs font-medium rounded-full', getPriorityColor(task.priority))}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Communities
