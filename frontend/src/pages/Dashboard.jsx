import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ClipboardDocumentListIcon, 
  CheckCircleIcon, 
  TrophyIcon, 
  CalendarDaysIcon,
  ChartBarIcon,
  UserGroupIcon,
  SparklesIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { taskAPI, eventAPI, userAPI } from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalTasks: 0,
    completedTasks: 0,
    eventsAttended: 0,
    isLoading: true
  });
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      setDashboardData(prev => ({ ...prev, isLoading: true }));
      
      // Fetch user's tasks
      const tasksResponse = await taskAPI.getAllTasks({ user_id: user.user_id });
      const tasks = tasksResponse.data.tasks || [];
      const completedTasks = tasks.filter(task => task.status === 'completed');
      
      // Fetch user's events (if available)
      let eventsAttended = 0;
      try {
        const eventsResponse = await eventAPI.getAllEvents({ user_id: user.user_id });
        eventsAttended = eventsResponse.data.events?.length || 0;
      } catch (err) {
        console.log('Events not available yet');
      }
      
      setDashboardData({
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        eventsAttended,
        isLoading: false
      });
      
      // Set recent activities based on tasks
      const activities = tasks
        .filter(task => task.status === 'completed')
        .slice(0, 3)
        .map(task => ({
          id: task.task_id,
          type: 'task_completed',
          title: `Completed "${task.title}"`,
          time: new Date(task.completion_date || task.updated_at).toLocaleDateString(),
          points: '+10',
          icon: CheckCircleIcon,
          color: 'success'
        }));
      
      setRecentActivities(activities);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setDashboardData(prev => ({ ...prev, isLoading: false }));
    }
  };

  const stats = [
    {
      id: 1,
      name: 'Total Tasks',
      value: dashboardData.isLoading ? '...' : dashboardData.totalTasks.toString(),
      change: dashboardData.totalTasks > 0 ? '+' + dashboardData.totalTasks : '0',
      changeType: 'increase',
      icon: ClipboardDocumentListIcon,
      color: 'blue'
    },
    {
      id: 2,
      name: 'Completed Tasks',
      value: dashboardData.isLoading ? '...' : dashboardData.completedTasks.toString(),
      change: dashboardData.completedTasks > 0 ? '+' + dashboardData.completedTasks : '0',
      changeType: 'increase',
      icon: CheckCircleIcon,
      color: 'green'
    },
    {
      id: 3,
      name: 'Points Earned',
      value: user?.points?.toString() || '0',
      change: user?.points > 0 ? '+' + user.points : '0',
      changeType: 'increase',
      icon: TrophyIcon,
      color: 'orange'
    },
    {
      id: 4,
      name: 'Events Attended',
      value: dashboardData.isLoading ? '...' : dashboardData.eventsAttended.toString(),
      change: dashboardData.eventsAttended > 0 ? '+' + dashboardData.eventsAttended : '0',
      changeType: 'increase',
      icon: CalendarDaysIcon,
      color: 'purple'
    }
  ];



  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Welcome Header */}
      <div className="glass-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white dark:text-white dark:text-white mb-1 sm:mb-2">
              Welcome back, {user?.full_name}! 
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 dark:text-gray-300">
              Here's an overview of your community activity
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div 
            key={stat.id} 
            className="glass-card card-hover rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-400 mb-1">
                  {stat.name}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white dark:text-white dark:text-white mb-2">
                  {stat.value}
                </p>
                <div className="flex items-center">
                  {stat.changeType === 'increase' ? (
                    <ArrowUpIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownIcon className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs sm:text-sm font-semibold ${
                    stat.changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-700 dark:bg-gray-700 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-300 dark:text-gray-300" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white dark:text-white flex items-center">
                <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-600 dark:text-gray-300 dark:text-gray-300" />
                Recent Activity
              </h3>
              <button className="text-primary-600 hover:text-primary-700 font-medium text-xs sm:text-sm transition-colors duration-200">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {dashboardData.isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-300 dark:text-gray-300">Loading activities...</p>
                </div>
              ) : recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div 
                    key={activity.id}
                    className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:bg-gray-700 dark:bg-gray-700 transition-colors duration-200"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <activity.icon className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white dark:text-white">{activity.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300">{activity.time}</p>
                    </div>
                    {activity.points && (
                      <div className="text-green-600 font-semibold">
                        {activity.points}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <ClipboardDocumentListIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-300 dark:text-gray-300">No recent activities</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Complete some tasks to see your activity here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4 sm:space-y-6">
          {/* Community Info */}
          <div className="glass-card rounded-xl shadow-sm border p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white dark:text-white mb-4 flex items-center">
              <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-600 dark:text-gray-300 dark:text-gray-300" />
              Communities ({user?.communities?.length || 0})
            </h3>
            {user?.communities && user.communities.length > 0 ? (
              <div className="space-y-3">
                {user.communities.slice(0, 2).map((community) => (
                  <div key={community.community_id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg card-hover">
                    <p className="text-base font-semibold text-gray-900 dark:text-white dark:text-white">{community.name}</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{community.description || 'No description'}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Your Role</span>
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium capitalize">
                        {community.UserCommunity?.role?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
                {user.communities.length > 2 && (
                  <div className="text-center pt-2">
                    <Link
                      to="/communities"
                      className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                      View all {user.communities.length} communities →
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <UserGroupIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-300 text-sm">No community assigned</p>
                <Link
                  to="/communities"
                  className="mt-2 inline-block text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  Join a Community
                </Link>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="glass-card rounded-xl shadow-sm border p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white dark:text-white mb-4">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300 dark:text-gray-300">Tasks Completed</span>
                <span className="font-semibold text-gray-900 dark:text-white dark:text-white">{dashboardData.isLoading ? '...' : dashboardData.completedTasks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300 dark:text-gray-300">Points Earned</span>
                <span className="font-semibold text-gray-900 dark:text-white dark:text-white">{user?.points || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300 dark:text-gray-300">Events Attended</span>
                <span className="font-semibold text-gray-900 dark:text-white dark:text-white">{dashboardData.isLoading ? '...' : dashboardData.eventsAttended}</span>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300 dark:text-gray-300">Total Tasks</span>
                  <span className="font-semibold text-gray-900 dark:text-white dark:text-white">{dashboardData.isLoading ? '...' : dashboardData.totalTasks}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
