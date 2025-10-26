import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  CalendarDaysIcon, 
  PlusIcon, 
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  UsersIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const Calendar = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [userTasks, setUserTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate]);

  // Refresh calendar data when user communities change
  useEffect(() => {
    if (user && user.communities) {
      fetchCalendarData();
    }
  }, [user?.communities?.length]);

  const fetchCalendarData = async () => {
    setIsLoading(true);
    try {
      // Fetch events and tasks for the current month
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // Fetch user's tasks for calendar
      const tasksResponse = await api.get('/tasks', {
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          limit: 100 // Get more tasks for calendar view
        }
      });
      
      // Fetch community events
      const eventsResponse = await api.get('/events', {
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        }
      });

      setUserTasks(tasksResponse.data.tasks || []);
      setEvents(eventsResponse.data.events || []);
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
      // Don't use fallback data - show empty state instead
      setUserTasks([]);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDate; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date) => {
    if (!date) return { events: [], tasks: [] };
    const dateString = date.toISOString().split('T')[0];
    
    const dayEvents = events.filter(event => event.date === dateString);
    const dayTasks = userTasks.filter(task => {
      const taskDate = task.deadline ? task.deadline.split('T')[0] : null;
      return taskDate === dateString;
    });
    
    return { events: dayEvents, tasks: dayTasks };
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'meeting': return 'bg-blue-500';
      case 'volunteer': return 'bg-green-500';
      case 'workshop': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-transparent p-3 sm:p-4 md:p-6">
      <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="glass-card bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Calendar</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Manage your community events and schedule</p>
            </div>
            <button className="btn-hover btn-primary flex items-center justify-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors text-sm">
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Event
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Main Calendar */}
          <div className="lg:col-span-3">
            <div className="glass-card bg-white dark:bg-gray-800 rounded-xl shadow-sm border">
              {/* Calendar Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="p-2 hover:bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="p-2 hover:bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="p-6">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {dayNames.map(day => (
                    <div key={day} className="h-10 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{day}</span>
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(currentDate).map((date, index) => {
                    const { events: dayEvents, tasks: dayTasks } = getEventsForDate(date);
                    const hasUserTasks = dayTasks.length > 0;
                    
                    return (
                      <div
                        key={index}
                        className={`card-hover min-h-[120px] p-2 border border-gray-100 dark:border-gray-700 rounded-lg transition-all ${
                          date ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700' : 'bg-gray-50 dark:bg-gray-900'
                        } ${isToday(date) ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/30' : ''} ${
                          hasUserTasks ? 'ring-1 ring-green-300 dark:ring-green-700 bg-green-50 dark:bg-green-900/20' : ''
                        }`}
                      >
                        {date && (
                          <>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm font-bold ${
                                isToday(date) ? 'text-primary-600 dark:text-primary-400' : hasUserTasks ? 'text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-white'
                              }`}>
                                {date.getDate()}
                              </span>
                              {hasUserTasks && (
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              )}
                            </div>
                            
                            {/* User's tasks (highlighted) */}
                            <div className="space-y-1 mb-1">
                              {dayTasks.slice(0, 1).map(task => (
                                <div
                                  key={task.task_id}
                                  className="card-hover text-xs p-1 rounded text-white bg-green-600 dark:bg-green-700 border-2 border-green-700 dark:border-green-600"
                                >
                                  <div className="font-bold truncate">📋 {task.title}</div>
                                  <div className="opacity-90 font-medium">Your task</div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Community events (dimmed if user has tasks) */}
                            <div className={`space-y-1 ${hasUserTasks ? 'opacity-60' : ''}`}>
                              {dayEvents.slice(0, hasUserTasks ? 1 : 2).map(event => (
                                <div
                                  key={event.id}
                                  className={`card-hover text-xs p-1 rounded text-white ${getEventTypeColor(event.type)}`}
                                >
                                  <div className="font-bold truncate">{event.title}</div>
                                  <div className="opacity-90 font-medium">{event.time || 'All day'}</div>
                                </div>
                              ))}
                              
                              {/* Show overflow count */}
                              {(dayTasks.length > 1 || dayEvents.length > (hasUserTasks ? 1 : 2)) && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 font-bold">
                                  +{(dayTasks.length - 1) + (dayEvents.length - (hasUserTasks ? 1 : 2))} more
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Your Upcoming Tasks */}
            {userTasks.length > 0 && (
              <div className="glass-card bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-green-700 mb-4">📋 Your Tasks</h3>
                <div className="space-y-3">
                  {userTasks.slice(0, 3).map(task => (
                    <div key={task.task_id} className="card-hover flex items-start space-x-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200">
                      <div className="w-3 h-3 rounded-full mt-1.5 bg-green-600"></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{task.title}</p>
                        {task.deadline && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mt-1">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            Due: {new Date(task.deadline).toLocaleDateString()}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mt-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Events */}
            <div className="glass-card bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Community Events</h3>
              <div className="space-y-3">
                {events.length > 0 ? events.slice(0, 5).map(event => (
                  <div key={event.id} className={`card-hover flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors ${
                    userTasks.length > 0 ? 'opacity-75' : ''
                  }`}>
                    <div className={`w-3 h-3 rounded-full mt-1.5 ${getEventTypeColor(event.type)}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{event.title}</p>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {event.date && event.time ? 
                          `${new Date(event.date).toLocaleDateString()} at ${event.time}` :
                          event.date ? new Date(event.date).toLocaleDateString() : 'Date TBD'
                        }
                      </div>
                      {event.location && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <MapPinIcon className="w-4 h-4 mr-1" />
                          {event.location}
                        </div>
                      )}
                      {event.attendees && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <UsersIcon className="w-4 h-4 mr-1" />
                          {event.attendees} attending
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No upcoming events
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="glass-card bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">This Month</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Total Events</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{events.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Meetings</span>
                  <span className="font-semibold text-blue-600">
                    {events.filter(e => e.type === 'meeting').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Workshops</span>
                  <span className="font-semibold text-purple-600">
                    {events.filter(e => e.type === 'workshop').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Volunteer Events</span>
                  <span className="font-semibold text-green-600">
                    {events.filter(e => e.type === 'volunteer').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
