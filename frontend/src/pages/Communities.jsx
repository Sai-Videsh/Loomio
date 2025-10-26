import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  UserGroupIcon, 
  PlusIcon, 
  QrCodeIcon, 
  UsersIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
  ArrowRightIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const Communities = () => {
  const { user, updateUser } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: ''
  });
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCommunities();
  }, []);

  // Refresh communities when user communities change (e.g., after leaving from Profile page)
  useEffect(() => {
    if (user) {
      fetchCommunities();
    }
  }, [user?.communities?.length]);

  const fetchCommunities = async () => {
    try {
      const response = await api.get('/communities');
      setCommunities(response.data.communities || []);
    } catch (err) {
      console.error('Failed to fetch communities:', err);
      setError('Failed to load communities. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    
    if (!createForm.name.trim()) {
      setError('Community name is required');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/communities', createForm);
      
      // Update user context with new community data if provided
      if (response.data.user) {
        updateUser(response.data.user);
      }
      
      // Refresh communities list
      await fetchCommunities();
      
      setSuccess(`Community "${response.data.community.name}" created successfully! Your community code is: ${response.data.community.community_code}`);
      setCreateForm({ name: '', description: '' });
      setShowCreateForm(false);
    } catch (err) {
      console.error('Community creation error:', err);
      setError(err.response?.data?.message || 'Failed to create community. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCommunity = async (e) => {
    e.preventDefault();
    
    if (!joinCode || joinCode.length !== 6) {
      setError('Please enter a valid 6-character community code');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/communities/join', {
        community_code: joinCode.toUpperCase()
      });
      
      // Update user context with new community data
      if (response.data.user) {
        updateUser(response.data.user);
      }
      
      // Refresh communities list
      await fetchCommunities();
      
      setSuccess(`Successfully joined ${response.data.community?.name || 'the community'}!`);
      setJoinCode('');
      setShowJoinForm(false);
    } catch (err) {
      console.error('Join community error:', err);
      setError(err.response?.data?.message || 'Failed to join community. Please check the code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCommunity = async (communityId, communityName) => {
    if (!confirm(`Are you sure you want to delete the community "${communityName}"? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.delete(`/communities/${communityId}`);
      
      setSuccess(`Community "${communityName}" has been deleted successfully.`);
      
      // Refresh communities list
      await fetchCommunities();
      
      // Update user communities if they were a member
      if (user?.communities) {
        const updatedCommunities = user.communities.filter(c => c.community_id !== communityId);
        updateUser({ ...user, communities: updatedCommunities });
      }
    } catch (err) {
      console.error('Delete community error:', err);
      setError(err.response?.data?.message || 'Failed to delete community. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-transparent">
      
      <div className="relative z-10 w-full max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="glass-card bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                Communities
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Connect with your community and collaborate on shared goals
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {(user?.role === 'platform_admin' || user?.role === 'community_admin') && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-sm btn-hover btn-primary"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Community
            </button>
          )}
          <button
            onClick={() => setShowJoinForm(true)}
            className="btn-join-community flex items-center justify-center px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors duration-200 shadow-sm"
          >
            <QrCodeIcon className="w-5 h-5 mr-2" />
            Join Community
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800 font-medium">
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-800 font-medium">
              {success}
            </div>
          </div>
        )}

      {/* Your Communities */}
      {user?.communities && user.communities.length > 0 && (
        <div className="glass-card bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Communities</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {user.communities.length} joined
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {user.communities.map((community) => (
              <div key={community.community_id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 card-hover">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <UsersIcon className="w-4 h-4 text-primary-600" />
                    </div>
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">{community.name}</h3>
                  </div>
                  <div className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs font-medium flex-shrink-0 ml-2">
                    {community.community_code}
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{community.description || 'No description'}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col space-y-1">
                    <span className="capitalize font-medium">{community.UserCommunity?.role?.replace('_', ' ')}</span>
                    <span className="text-gray-400 dark:text-gray-500">Joined {new Date(community.UserCommunity?.joined_at).toLocaleDateString()}</span>
                  </div>
                  {(user?.role === 'platform_admin' || 
                    (community.created_by === user?.user_id)) && (
                    <button
                      onClick={() => handleDeleteCommunity(community.community_id, community.name)}
                      className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                      title="Delete Community"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Communities */}
      <div className="glass-card bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Available Communities</h2>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading communities...</p>
          </div>
        ) : communities.length === 0 ? (
          <div className="text-center py-12">
            <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No communities available</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {(user?.role === 'platform_admin' || user?.role === 'community_admin') 
                ? 'Be the first to create a community or get a code to join one.'
                : 'Ask an admin to create a community or get a code to join an existing one.'
              }
            </p>
            {(user?.role === 'platform_admin' || user?.role === 'community_admin') && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Create First Community
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <div 
                key={community.community_id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200 card-hover"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                    <UserGroupIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs font-medium">
                    {community.community_code}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{community.name}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">{community.description || 'No description provided'}</p>
                
                {/* Creator information */}
                {community.creator && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mr-2">
                      <span className="text-primary-600 dark:text-primary-400 text-xs font-medium">
                        {community.creator.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span>Created by {community.creator.full_name}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <UsersIcon className="w-4 h-4 mr-1" />
                    <span>{community.memberCount || 0} members</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                      View Details
                    </button>
                    {(user?.role === 'platform_admin' || 
                      (community.creator && community.creator.user_id === user?.user_id)) && (
                      <button
                        onClick={() => handleDeleteCommunity(community.community_id, community.name)}
                        className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                        title="Delete Community"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Community Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Community</h3>
            
            <form onSubmit={handleCreateCommunity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Community Name
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter community name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 h-24 resize-none"
                  placeholder="Describe your community..."
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Community'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Community Modal */}
      {showJoinForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">Join Community</h3>
            
            <form onSubmit={handleJoinCommunity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Community Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                    setJoinCode(value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center text-lg font-mono tracking-widest bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="ABC123"
                  maxLength="6"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Enter the 6-character code provided by your community admin
                </p>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowJoinForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || joinCode.length !== 6}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Joining...' : 'Join Community'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Communities;
