import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Calendar, CheckCircle, XCircle, Clock, Users } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { attendanceAPI } from '../services/api'
import { cn } from '../utils/cn'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const Attendance = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const { data: attendance, isLoading, error } = useQuery(
    ['attendance', selectedDate],
    () => attendanceAPI.getAttendance({ date: selectedDate }),
    { refetchInterval: 30000 }
  )

  const markAttendanceMutation = useMutation(
    (data) => attendanceAPI.markAttendance(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['attendance'])
        toast.success('Attendance marked successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to mark attendance')
      }
    }
  )

  const updateAttendanceMutation = useMutation(
    ({ id, data }) => attendanceAPI.updateAttendance(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['attendance'])
        toast.success('Attendance updated successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update attendance')
      }
    }
  )

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800'
      case 'absent':
        return 'bg-red-100 text-red-800'
      case 'late':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'present':
        return 'Present'
      case 'absent':
        return 'Absent'
      case 'late':
        return 'Late'
      default:
        return status
    }
  }

  const handleMarkAttendance = (userId, status) => {
    markAttendanceMutation.mutate({
      user_id: userId,
      date: selectedDate,
      status
    })
  }

  const handleUpdateAttendance = (attendanceId, status) => {
    updateAttendanceMutation.mutate({
      id: attendanceId,
      data: { status }
    })
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
        <p className="text-gray-500">Failed to load attendance. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track daily attendance and participation
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Present</p>
              <p className="text-2xl font-semibold text-gray-900">
                {attendance?.data?.summary?.present || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Absent</p>
              <p className="text-2xl font-semibold text-gray-900">
                {attendance?.data?.summary?.absent || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Late</p>
              <p className="text-2xl font-semibold text-gray-900">
                {attendance?.data?.summary?.late || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-semibold text-gray-900">
                {attendance?.data?.summary?.total || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Attendance for {new Date(selectedDate).toLocaleDateString()}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                {(user?.role === 'admin' || user?.role === 'leader') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendance?.data?.data?.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {record.user_name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn('px-2 py-1 text-xs font-medium rounded-full', getStatusColor(record.status))}>
                      {getStatusLabel(record.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.created_at ? new Date(record.created_at).toLocaleTimeString() : '-'}
                  </td>
                  {(user?.role === 'admin' || user?.role === 'leader') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {record.status !== 'present' && (
                          <button
                            onClick={() => handleUpdateAttendance(record.id, 'present')}
                            className="text-green-600 hover:text-green-900"
                            disabled={updateAttendanceMutation.isLoading}
                          >
                            Mark Present
                          </button>
                        )}
                        {record.status !== 'absent' && (
                          <button
                            onClick={() => handleUpdateAttendance(record.id, 'absent')}
                            className="text-red-600 hover:text-red-900"
                            disabled={updateAttendanceMutation.isLoading}
                          >
                            Mark Absent
                          </button>
                        )}
                        {record.status !== 'late' && (
                          <button
                            onClick={() => handleUpdateAttendance(record.id, 'late')}
                            className="text-yellow-600 hover:text-yellow-900"
                            disabled={updateAttendanceMutation.isLoading}
                          >
                            Mark Late
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Mark Attendance (for Leaders/Admins) */}
      {(user?.role === 'admin' || user?.role === 'leader') && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Mark Attendance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleMarkAttendance(user.id, 'present')}
              disabled={markAttendanceMutation.isLoading}
              className="btn btn-success"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark All Present
            </button>
            <button
              onClick={() => handleMarkAttendance(user.id, 'absent')}
              disabled={markAttendanceMutation.isLoading}
              className="btn btn-danger"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Mark All Absent
            </button>
            <button
              onClick={() => handleMarkAttendance(user.id, 'late')}
              disabled={markAttendanceMutation.isLoading}
              className="btn btn-warning"
            >
              <Clock className="h-4 w-4 mr-2" />
              Mark All Late
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Attendance
