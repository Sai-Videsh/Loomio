import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Award, TrendingUp, Users, Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { contributionsAPI } from '../services/api'
import { cn } from '../utils/cn'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const Contributions = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showAwardModal, setShowAwardModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  const { data: contributions, isLoading, error } = useQuery(
    ['contributions'],
    () => contributionsAPI.getContributions(),
    { refetchInterval: 30000 }
  )

  const { data: weights } = useQuery(
    ['contribution-weights'],
    () => contributionsAPI.getWeights()
  )

  const awardPointsMutation = useMutation(contributionsAPI.awardPoints, {
    onSuccess: () => {
      queryClient.invalidateQueries(['contributions'])
      setShowAwardModal(false)
      toast.success('Points awarded successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to award points')
    }
  })

  const updateWeightsMutation = useMutation(contributionsAPI.updateWeights, {
    onSuccess: () => {
      queryClient.invalidateQueries(['contribution-weights'])
      toast.success('Point weights updated successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update weights')
    }
  })

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

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
        <p className="text-gray-500">Failed to load contributions. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contributions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage community contributions and points
          </p>
        </div>
        {(user?.role === 'admin' || user?.role === 'leader') && (
          <button
            onClick={() => setShowAwardModal(true)}
            className="mt-4 sm:mt-0 btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Award Points
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Points Awarded</p>
              <p className="text-2xl font-semibold text-gray-900">
                {contributions?.data?.summary?.total_points || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Contributors</p>
              <p className="text-2xl font-semibold text-gray-900">
                {contributions?.data?.summary?.active_contributors || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Points</p>
              <p className="text-2xl font-semibold text-gray-900">
                {contributions?.data?.summary?.average_points || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Contributors Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Contributors</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={contributions?.data?.top_contributors || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="points" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Points Distribution Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Points Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={contributions?.data?.points_distribution || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {contributions?.data?.points_distribution?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Point Weights (Admin/Leader Only) */}
      {(user?.role === 'admin' || user?.role === 'leader') && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Point Weights Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {weights?.data?.weights?.map((weight) => (
              <div key={weight.id} className="border rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {weight.activity_type}
                </label>
                <input
                  type="number"
                  min="0"
                  value={weight.points}
                  onChange={(e) => {
                    const newWeights = weights.data.weights.map(w =>
                      w.id === weight.id ? { ...w, points: parseInt(e.target.value) } : w
                    )
                    updateWeightsMutation.mutate({ weights: newWeights })
                  }}
                  className="input w-full"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contributions List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Contributions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contributions?.data?.recent_contributions?.map((contribution) => (
                <tr key={contribution.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {contribution.user_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {contribution.activity_type}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      +{contribution.points}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(contribution.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Award Points Modal */}
      {showAwardModal && (
        <AwardPointsModal
          onClose={() => setShowAwardModal(false)}
          onSubmit={(data) => awardPointsMutation.mutate(data)}
          isLoading={awardPointsMutation.isLoading}
          weights={weights?.data?.weights || []}
        />
      )}
    </div>
  )
}

// Award Points Modal Component
const AwardPointsModal = ({ onClose, onSubmit, isLoading, weights }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  const handleFormSubmit = (data) => {
    onSubmit(data)
    reset()
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Award Points</h3>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">User</label>
              <select
                {...register('user_id', { required: 'User is required' })}
                className="input mt-1 w-full"
              >
                <option value="">Select a user</option>
                {/* This would be populated with users from API */}
                <option value="1">John Doe</option>
                <option value="2">Jane Smith</option>
              </select>
              {errors.user_id && (
                <p className="mt-1 text-sm text-danger-600">{errors.user_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Activity Type</label>
              <select
                {...register('activity_type', { required: 'Activity type is required' })}
                className="input mt-1 w-full"
              >
                <option value="">Select activity type</option>
                {weights.map((weight) => (
                  <option key={weight.id} value={weight.activity_type}>
                    {weight.activity_type} ({weight.points} points)
                  </option>
                ))}
              </select>
              {errors.activity_type && (
                <p className="mt-1 text-sm text-danger-600">{errors.activity_type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Points</label>
              <input
                type="number"
                min="1"
                {...register('points', { required: 'Points are required', min: 1 })}
                className="input mt-1 w-full"
                placeholder="Enter points to award"
              />
              {errors.points && (
                <p className="mt-1 text-sm text-danger-600">{errors.points.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="input mt-1 w-full"
                placeholder="Enter description for the points awarded"
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
                {isLoading ? 'Awarding...' : 'Award Points'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Contributions
