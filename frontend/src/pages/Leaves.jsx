import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, Calendar, Clock, CheckCircle, XCircle, FileText } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { leavesAPI } from '../services/api'
import { cn } from '../utils/cn'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'

const Leaves = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: leaves, isLoading, error } = useQuery(
    ['leaves'],
    () => leavesAPI.getLeaves(),
    { refetchInterval: 30000 }
  )

  const createLeaveMutation = useMutation(leavesAPI.createLeave, {
    onSuccess: () => {
      queryClient.invalidateQueries(['leaves'])
      setShowCreateModal(false)
      toast.success('Leave request submitted successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit leave request')
    }
  })

  const approveLeaveMutation = useMutation(
    ({ leaveId, data }) => leavesAPI.approveLeave(leaveId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['leaves'])
        toast.success('Leave request approved!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to approve leave request')
      }
    }
  )

  const rejectLeaveMutation = useMutation(
    ({ leaveId, data }) => leavesAPI.rejectLeave(leaveId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['leaves'])
        toast.success('Leave request rejected!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reject leave request')
      }
    }
  )

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'approved':
        return 'Approved'
      case 'rejected':
        return 'Rejected'
      default:
        return status
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
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
        <p className="text-gray-500">Failed to load leave requests. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage leave requests and approvals
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="mt-4 sm:mt-0 btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Request Leave
        </button>
      </div>

      {/* Leave Requests */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Leave Requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaves?.data?.data?.map((leave) => (
                <tr key={leave.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {leave.user_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {leave.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn('px-2 py-1 text-xs font-medium rounded-full', getStatusColor(leave.status))}>
                      {getStatusLabel(leave.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {leave.status === 'pending' && (user?.role === 'admin' || user?.role === 'leader') && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => approveLeaveMutation.mutate({ leaveId: leave.id, data: { status: 'approved' } })}
                          className="text-green-600 hover:text-green-900"
                          disabled={approveLeaveMutation.isLoading}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectLeaveMutation.mutate({ leaveId: leave.id, data: { status: 'rejected' } })}
                          className="text-red-600 hover:text-red-900"
                          disabled={rejectLeaveMutation.isLoading}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {leaves?.data?.data?.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <FileText className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No leave requests</h3>
          <p className="mt-1 text-sm text-gray-500">
            Submit a leave request to get started.
          </p>
        </div>
      )}

      {/* Create Leave Request Modal */}
      {showCreateModal && (
        <CreateLeaveModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createLeaveMutation.mutate(data)}
          isLoading={createLeaveMutation.isLoading}
        />
      )}
    </div>
  )
}

// Create Leave Request Modal Component
const CreateLeaveModal = ({ onClose, onSubmit, isLoading }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  const handleFormSubmit = (data) => {
    onSubmit(data)
    reset()
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Request Leave</h3>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                {...register('start_date', { required: 'Start date is required' })}
                className="input mt-1 w-full"
              />
              {errors.start_date && (
                <p className="mt-1 text-sm text-danger-600">{errors.start_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                {...register('end_date', { required: 'End date is required' })}
                className="input mt-1 w-full"
              />
              {errors.end_date && (
                <p className="mt-1 text-sm text-danger-600">{errors.end_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Reason</label>
              <textarea
                {...register('reason', { required: 'Reason is required' })}
                rows={3}
                className="input mt-1 w-full"
                placeholder="Enter reason for leave"
              />
              {errors.reason && (
                <p className="mt-1 text-sm text-danger-600">{errors.reason.message}</p>
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
                {isLoading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Leaves
