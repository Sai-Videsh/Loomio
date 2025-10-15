import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CogIcon,
  TrophyIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import loomioLogo from '../assets/Loomio.png';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Communities', href: '/communities', icon: UserGroupIcon },
    { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentListIcon },
    { name: 'Calendar', href: '/calendar', icon: CalendarDaysIcon },
    { name: 'Leaderboard', href: '/leaderboard', icon: TrophyIcon },
  ];

  // Add admin-only routes
  if (user?.role === 'platform_admin' || user?.role === 'community_admin') {
    navigation.push({ name: 'Analytics', href: '/analytics', icon: ChartBarIcon });
  }

  navigation.push({ name: 'Settings', href: '/settings', icon: CogIcon });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        flex flex-col w-72 bg-slate-900 shadow-xl border-r border-slate-700 
        fixed lg:relative inset-y-0 left-0 z-50 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg z-10"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Logo/Brand */}
      <div className="px-6 py-8 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center">
            <img src={loomioLogo} alt="Loomio" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              Loomio
            </h1>
            <p className="text-sm text-slate-400 font-medium">Community Hub</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-6 py-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-slate-700 rounded-lg flex items-center justify-center">
            <span className="text-lg font-semibold text-white">
              {user?.full_name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              {user?.full_name}
            </p>
            <p className="text-xs text-slate-400 capitalize">
              {user?.role?.replace('_', ' ')}
            </p>
            <div className="flex items-center mt-1 text-xs text-slate-300">
              <span>{user?.points || 0} points</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={() => onClose && onClose()}
            className={({ isActive }) =>
              `group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Community info */}
      <div className="px-6 py-6 border-t border-slate-700">
        {user?.community ? (
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-2">
              Community
            </div>
            <div className="text-sm font-semibold text-white mb-1">
              {user.community.name}
            </div>
            <div className="text-xs text-slate-400">
              {user.community.description || 'Active community member'}
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-2">
              Community
            </div>
            <div className="text-xs text-slate-400 mb-2">
              No community assigned
            </div>
            <NavLink 
              to="/communities"
              onClick={() => onClose && onClose()}
              className="text-xs text-primary-400 hover:text-primary-300 font-medium"
            >
              Join a Community →
            </NavLink>
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default Sidebar;
