import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  TrophyIcon,
  ChartBarIcon,
  SparklesIcon,
  FireIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { TrophyIcon as TrophySolidIcon } from '@heroicons/react/24/solid';
import api from '../services/api';

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [period, setPeriod] = useState('all-time'); // all-time, monthly, weekly
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await api.get('/leaderboard', {
        params: {
          period,
          limit: 20
        }
      });

      setLeaderboard(response.data.leaderboard || []);
      setCurrentUserRank(response.data.currentUserRank);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      setError('Failed to load leaderboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-lg">
          <TrophySolidIcon className="w-7 h-7 text-white" />
        </div>
      );
    } else if (rank === 2) {
      return (
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full shadow-lg">
          <TrophySolidIcon className="w-6 h-6 text-white" />
        </div>
      );
    } else if (rank === 3) {
      return (
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-lg">
          <TrophySolidIcon className="w-6 h-6 text-white" />
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full">
          <span className="text-lg font-bold text-gray-600 dark:text-gray-300">#{rank}</span>
        </div>
      );
    }
  };

  const getPointsDisplay = (points) => {
    return points?.toLocaleString() || '0';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <TrophyIcon className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-yellow-500" />
              Leaderboard
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1 sm:mt-2">Top contributors in the community</p>
          </div>

          {/* Period Filter */}
          <div className="flex items-center space-x-1 sm:space-x-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-1 overflow-x-auto">
            {['weekly', 'monthly', 'all-time'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                  period === p
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p === 'all-time' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Current User Rank */}
        {currentUserRank && (
          <div className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-xl p-4 sm:p-6 border border-primary-200 dark:border-primary-800/30">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-xl sm:text-2xl font-bold text-white">#{currentUserRank}</span>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Your Rank</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{user?.full_name}</p>
                  <p className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 font-medium">
                    {getPointsDisplay(user?.points)} points
                  </p>
                </div>
              </div>
              {user?.current_streak > 0 && (
                <div className="flex items-center space-x-2 bg-white dark:bg-gray-800/60 rounded-lg px-3 sm:px-4 py-2 shadow-sm border border-transparent dark:border-gray-700">
                  <FireIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Streak</p>
                    <p className="text-base sm:text-lg font-bold text-orange-600 dark:text-orange-400">{user.current_streak} days</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-800 dark:text-red-300 font-semibold">{error}</p>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="glass-card bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <ChartBarIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No leaderboard data available</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.user_id}
                className={`list-item-hover flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  entry.user_id === user?.user_id ? 'bg-primary-50 dark:bg-primary-900/30' : ''
                }`}
              >
                {/* Rank and User Info */}
                <div className="flex items-center space-x-4 flex-1">
                  {getRankBadge(entry.rank)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="font-bold text-gray-900 dark:text-white truncate">
                        {entry.full_name}
                        {entry.user_id === user?.user_id && (
                          <span className="ml-2 text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full font-bold">
                            You
                          </span>
                        )}
                      </p>
                      {entry.rank <= 3 && (
                        <StarIcon className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate font-medium">{entry.email}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-8">
                  {/* Points */}
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Points</p>
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {getPointsDisplay(entry.points)}
                    </p>
                  </div>

                  {/* Tasks Completed (for all-time) */}
                  {period === 'all-time' && entry.tasks_completed !== undefined && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Tasks</p>
                      <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                        {entry.tasks_completed || 0}
                      </p>
                    </div>
                  )}

                  {/* Contributions (for period-based) */}
                  {period !== 'all-time' && entry.contributions !== undefined && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Contributions</p>
                      <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                        {entry.contributions || 0}
                      </p>
                    </div>
                  )}

                  {/* Streak */}
                  {entry.current_streak > 0 && (
                    <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400">
                      <FireIcon className="w-5 h-5" />
                      <span className="font-bold">{entry.current_streak}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Rankings are updated in real-time based on points earned from tasks and contributions</p>
      </div>
    </div>
  );
};

export default Leaderboard;
