import { useQuery } from 'react-query'
import { useAuth } from '../contexts/AuthContext'
import { dashboardAPI } from '../services/api'
import { cn } from '../utils/cn'
import LoadingSpinner from '../components/LoadingSpinner'
import {
  Users,
  CheckSquare,
  Award,
  Clock,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuth()
  
  const { data: dashboardData, isLoading, error } = useQuery(
    ['dashboard'],
    () => dashboardAPI.getDashboard(),
    { refetchInterval: 30000 }
  )

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
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    )
  }

  const data = dashboardData?.data

  const StatCard = ({ title, value, icon: Icon, change, changeType = 'neutral' }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-gray-400" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
        {change && (
          <div className="mt-2">
            <span className={cn(
              'text-sm font-medium',
              changeType === 'positive' && 'text-success-600',
              changeType === 'negative' && 'text-danger-600',
              changeType === 'neutral' && 'text-gray-600'
            )}>
              {change}
            </span>
          </div>
        )}
      </div>
    </div>
  )

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">System Overview</h2>
        <p className="mt-1 text-sm text-gray-500">
          Monitor the overall health and activity of your community
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={data?.userStats?.total_users || 0}
          icon={Users}
        />
        <StatCard
          title="Active Tasks"
          value={data?.taskStats?.total_tasks || 0}
          icon={CheckSquare}
        />
        <StatCard
          title="Total Points Awarded"
          value={data?.contributionStats?.total_points_awarded || 0}
          icon={Award}
        />
        <StatCard
          title="Pending Leaves"
          value={data?.leaveStats?.pending_requests || 0}
          icon={FileText}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Tasks</h3>
            <div className="mt-4 space-y-3">
              {data?.recentTasks?.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      Assigned to {task.assigned_to_name || 'Unassigned'}
                    </p>
                  </div>
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    task.status === 'completed' && 'bg-success-100 text-success-800',
                    task.status === 'in_progress' && 'bg-warning-100 text-warning-800',
                    task.status === 'not_started' && 'bg-gray-100 text-gray-800',
                    task.status === 'overdue' && 'bg-danger-100 text-danger-800'
                  )}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Top Contributors</h3>
            <div className="mt-4 space-y-3">
              {data?.topContributors?.slice(0, 5).map((contributor, index) => (
                <div key={contributor.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500 w-6">{index + 1}</span>
                    <span className="text-sm font-medium text-gray-900">{contributor.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">{contributor.total_points} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderMemberDashboard = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Welcome back, {user?.name}!</h2>
        <p className="mt-1 text-sm text-gray-500">
          Here's what's happening with your tasks and contributions
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="My Tasks"
          value={data?.taskStats?.total_tasks || 0}
          icon={CheckSquare}
        />
        <StatCard
          title="Points Earned"
          value={data?.contributionStats?.total_points_earned || 0}
          icon={Award}
        />
        <StatCard
          title="Attendance Days"
          value={data?.attendanceStats?.present_days || 0}
          icon={Clock}
        />
        <StatCard
          title="Leave Requests"
          value={data?.leaveStats?.total_requests || 0}
          icon={FileText}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">My Tasks</h3>
            <div className="mt-4 space-y-3">
              {data?.myTasks?.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                    </p>
                  </div>
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    task.status === 'completed' && 'bg-success-100 text-success-800',
                    task.status === 'in_progress' && 'bg-warning-100 text-warning-800',
                    task.status === 'not_started' && 'bg-gray-100 text-gray-800',
                    task.status === 'overdue' && 'bg-danger-100 text-danger-800'
                  )}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Upcoming Events</h3>
            <div className="mt-4 space-y-3">
              {data?.myEvents?.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {event.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(event.event_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    event.participation_status === 'accepted' && 'bg-success-100 text-success-800',
                    event.participation_status === 'invited' && 'bg-warning-100 text-warning-800',
                    event.participation_status === 'declined' && 'bg-danger-100 text-danger-800'
                  )}>
                    {event.participation_status || 'Not invited'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {user?.role === 'admin' ? renderAdminDashboard() : renderMemberDashboard()}
    </div>
  )
}

export default Dashboard
