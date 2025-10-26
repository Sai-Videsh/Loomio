import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  UserIcon, 
  EnvelopeIcon, 
  TrophyIcon,
  CalendarIcon,
  UserGroupIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      full_name: user?.full_name || '',
      email: user?.email || '',
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!editForm.full_name.trim()) {
      setError('Full name is required');
      return;
    }

    if (!editForm.email.trim()) {
      setError('Email is required');
      return;
    }

    if (editForm.new_password && editForm.new_password !== editForm.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const updateData = {
        full_name: editForm.full_name,
        email: editForm.email
      };

      if (editForm.new_password) {
        updateData.current_password = editForm.current_password;
        updateData.new_password = editForm.new_password;
      }

      const response = await api.put(`/users/${user.user_id}`, updateData);
      
      // Update user context
      updateUser(response.data.user);
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setEditForm(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveCommunity = async (communityId) => {
    if (!window.confirm('Are you sure you want to leave this community?')) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/communities/leave', {
        community_id: communityId
      });
      
      // Update user context with new community list
      updateUser(response.data.user);
      setSuccess('Successfully left the community!');
    } catch (err) {
      console.error('Leave community error:', err);
      setError(err.response?.data?.message || 'Failed to leave community');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-transparent">
      <div className="w-full max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="glass-card bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                Profile
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Manage your account and preferences
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                <UserIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800 font-medium">{error}</div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-800 font-medium">{success}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Avatar Card */}
          <div className="glass-card bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">
                  {user?.full_name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {user?.full_name}
              </h2>
              
              <div className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
                <span className="capitalize">
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
              
              <div className="flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <TrophyIcon className="w-5 h-5 text-yellow-500 mr-2" />
                <span className="font-semibold text-gray-900 dark:text-white">{user?.points || 0} Points</span>
              </div>
            </div>
          </div>

          {/* Profile Information Card */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Profile Information
                </h3>
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="flex items-center px-4 py-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    <PencilIcon className="w-4 h-4 mr-2" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCancel}
                      className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:text-gray-300 font-medium transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <CheckIcon className="w-4 h-4 mr-2" />
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <UserIcon className="w-4 h-4 mr-2" />
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  ) : (
                    <div className="text-gray-900 dark:text-white font-medium">
                      {user?.full_name}
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <EnvelopeIcon className="w-4 h-4 mr-2" />
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  ) : (
                    <div className="text-gray-900 dark:text-white font-medium">
                      {user?.email}
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Member Since
                  </label>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {formatDate(user?.created_at)}
                  </div>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <UserGroupIcon className="w-4 h-4 mr-2" />
                    Communities
                  </label>
                  <div className="space-y-2">
                    {user?.communities && user.communities.length > 0 ? (
                      user.communities.map((community) => (
                        <div key={community.community_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{community.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                              {community.UserCommunity?.role?.replace('_', ' ')} • Joined {formatDate(community.UserCommunity?.joined_at)}
                            </div>
                          </div>
                          {community.UserCommunity?.role !== 'community_admin' && (
                            <button
                              onClick={() => handleLeaveCommunity(community.community_id)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                            >
                              Leave
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-900 dark:text-white font-medium">No communities joined</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Password Change Section - Only when editing */}
              {isEditing && (
                <div className="pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={editForm.current_password}
                        onChange={(e) => setEditForm({...editForm, current_password: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Leave blank to keep current password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={editForm.new_password}
                        onChange={(e) => setEditForm({...editForm, new_password: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={editForm.confirm_password}
                        onChange={(e) => setEditForm({...editForm, confirm_password: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Leave password fields blank if you don't want to change your password.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
