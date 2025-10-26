import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ChartBarIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  TrophyIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  SparklesIcon,
  BuildingOffice2Icon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { analyticsAPI } from '../services/api';

const Analytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      let response;
      if (user.role === 'platform_admin') {
        response = await analyticsAPI.getPlatformAnalytics();
      } else if (user.role === 'community_admin') {
        response = await analyticsAPI.getMyCommunityAnalytics();
      } else {
        setError('Access denied. Only administrators can view analytics.');
        return;
      }
      
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError(error.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };


  if (!user || (user.role !== 'platform_admin' && user.role !== 'community_admin')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <EyeIcon className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-300">You don't have permission to access analytics.</p>
        </div>
      </div>
    );
  }

  const renderOverviewStats = (stats, title) => {
    const statItems = [
      {
        name: 'Total Users',
        value: stats.totalUsers || stats.totalMembers || 0,
        icon: UserGroupIcon,
        color: 'blue',
        change: '+12%',
        changeType: 'increase'
      },
      {
        name: 'Total Tasks',
        value: stats.totalTasks || 0,
        icon: ClipboardDocumentListIcon,
        color: 'green',
        change: '+8%',
        changeType: 'increase'
      },
      {
        name: 'Completed Tasks',
        value: stats.completedTasks || 0,
        icon: CheckCircleIcon,
        color: 'purple',
        change: '+15%',
        changeType: 'increase'
      },
      {
        name: 'Completion Rate',
        value: `${stats.taskCompletionRate || 0}%`,
        icon: TrophyIcon,
        color: 'orange',
        change: stats.taskCompletionRate > 75 ? '+5%' : '-2%',
        changeType: stats.taskCompletionRate > 75 ? 'increase' : 'decrease'
      }
    ];

    if (stats.totalCommunities !== undefined) {
      statItems.splice(1, 0, {
        name: 'Communities',
        value: stats.totalCommunities || 0,
        icon: BuildingOffice2Icon,
        color: 'indigo',
        change: '+3%',
        changeType: 'increase'
      });
    }

    return (
      <div className="mb-6 sm:mb-8">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {statItems.map((stat, index) => (
            <div key={index} className="glass-card card-hover rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</p>
                  <div className="flex items-center">
                    {stat.changeType === 'increase' ? (
                      <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowDownIcon className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTopContributors = (contributors) => (
    <div className="glass-card rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
        <TrophyIcon className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-300" />
        Top Contributors
      </h3>
      <div className="space-y-4">
        {contributors && contributors.length > 0 ? contributors.slice(0, 5).map((contributor, index) => (
          <div key={contributor.user_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-primary-700">#{index + 1}</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{contributor.full_name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{contributor.email}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900 dark:text-white">{contributor.points || 0} pts</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{contributor.completedTasks || 0} tasks</p>
            </div>
          </div>
        )) : (
          <div className="text-center py-8">
            <TrophyIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-300">No contributors yet</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderTopCommunities = (communities) => (
    <div className="glass-card rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
        <BuildingOffice2Icon className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-300" />
        Top Communities
      </h3>
      <div className="space-y-4">
        {communities && communities.length > 0 ? communities.map((community, index) => (
          <div key={community.community_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-700">#{index + 1}</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{community.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{community.description || 'No description'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900 dark:text-white">{community.memberCount || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">members</p>
            </div>
          </div>
        )) : (
          <div className="text-center py-8">
            <BuildingOffice2Icon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-300">No communities yet</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderGrowthChart = (data, title) => (
    <div className="glass-card card-hover rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
        <ChartBarIcon className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-300" />
        {title}
      </h3>
      {data && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">{item.month || item.date}</span>
              <div className="flex items-center space-x-4">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full" 
                    style={{ width: `${Math.min((item.count || item.completionRate || 0), 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.count || item.completionRate || 0}
                  {item.completionRate !== undefined ? '%' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <ChartBarIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-300">No data available</p>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="glass-card rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
              <ChartBarIcon className="w-8 h-8 mr-3 text-primary-600" />
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {user?.role === 'platform_admin' 
                ? 'Platform-wide analytics and insights' 
                : 'Community analytics and member insights'}
            </p>
          </div>
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <SparklesIcon className="w-6 h-6 text-primary-600" />
          </div>
        </div>
        

      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Analytics Content */}
      {analytics && (
        <>
          {/* Stats Overview */}
          {renderOverviewStats(analytics.overview, user.role === 'platform_admin' ? 'Platform Overview' : 'Community Overview')}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Platform Analytics */}
            {user.role === 'platform_admin' && (
              <>
                {renderTopCommunities(analytics.topCommunities)}
                {renderTopContributors(analytics.topContributors)}
              </>
            )}
            
            {/* Community Analytics */}
            {user.role === 'community_admin' && (
              <>
                <div className="glass-card rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <UserGroupIcon className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-300" />
                    Member Activity
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {analytics.memberActivity && analytics.memberActivity.length > 0 ? 
                      analytics.memberActivity.map((member) => (
                        <div key={member.user_id} className="list-item-hover flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{member.full_name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{member.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                member.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {member.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 dark:text-white">{member.points || 0} pts</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{member.completedTasks || 0} tasks</p>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-8">
                          <UserGroupIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600 dark:text-gray-300">No member activity data</p>
                        </div>
                      )
                    }
                  </div>
                </div>
                
                {analytics.community && (
                  <div className="glass-card rounded-xl shadow-sm border p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Community Info</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Community Name</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{analytics.community.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Description</p>
                        <p className="text-gray-900 dark:text-white">{analytics.community.description || 'No description'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Created</p>
                        <p className="text-gray-900 dark:text-white">{new Date(analytics.community.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Growth Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {user.role === 'platform_admin' && (
              <>
                {renderGrowthChart(analytics.userGrowthData, 'User Growth (Last 6 Months)')}
                {renderGrowthChart(analytics.taskCompletionData, 'Task Completion Trend')}
              </>
            )}
            
            {user.role === 'community_admin' && (
              <>
                {renderGrowthChart(analytics.taskTrend, 'Task Completion Trend (Last 3 Months)')}
              </>
            )}
          </div>
        </>
      )}

      {/* No Data State */}
      {!analytics && !isLoading && (
        <div className="text-center py-12">
          <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Analytics Data</h3>
          <p className="text-gray-600 dark:text-gray-300">Analytics data will appear here once there's activity in the system.</p>
        </div>
      )}
    </div>
  );
};

export default Analytics;
