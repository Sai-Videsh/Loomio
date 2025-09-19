import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, Calendar, Clock, MapPin, Users, UserPlus, UserMinus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { eventsAPI } from '../services/api'
import { cn } from '../utils/cn'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'

const Events = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)

  const { data: events, isLoading, error } = useQuery(
    ['events'],
    () => eventsAPI.getEvents(),
    { refetchInterval: 30000 }
  )

  const createEventMutation = useMutation(eventsAPI.createEvent, {
    onSuccess: () => {
      queryClient.invalidateQueries(['events'])
      setShowCreateModal(false)
      toast.success('Event created successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create event')
    }
  })

  const joinEventMutation = useMutation(
    (eventId) => eventsAPI.joinEvent(eventId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['events'])
        toast.success('Joined event successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to join event')
      }
    }
  )

  const leaveEventMutation = useMutation(
    (eventId) => eventsAPI.leaveEvent(eventId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['events'])
        toast.success('Left event successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to leave event')
      }
    }
  )

  const isUserParticipating = (event) => {
    return event.participants?.some(p => p.user_id === user?.id)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
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
        <p className="text-gray-500">Failed to load events. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community Events</h1>
          <p className="mt-1 text-sm text-gray-500">
            Schedule and join community events and activities
          </p>
        </div>
        {(user?.role === 'admin' || user?.role === 'leader') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 sm:mt-0 btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </button>
        )}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events?.data?.data?.map((event) => (
          <div key={event.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
                  {event.title}
                </h3>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800">
                  Event
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {event.description}
              </p>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{formatDate(event.date)}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{formatTime(event.date)}</span>
                </div>

                {event.location && (
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{event.location}</span>
                  </div>
                )}

                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{event.participants?.length || 0} participants</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {isUserParticipating(event) ? (
                  <button
                    onClick={() => leaveEventMutation.mutate(event.id)}
                    className="btn btn-danger btn-sm"
                    disabled={leaveEventMutation.isLoading}
                  >
                    <UserMinus className="h-4 w-4 mr-1" />
                    Leave
                  </button>
                ) : (
                  <button
                    onClick={() => joinEventMutation.mutate(event.id)}
                    className="btn btn-success btn-sm"
                    disabled={joinEventMutation.isLoading}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Join
                  </button>
                )}
                
                <button
                  onClick={() => setSelectedEvent(event)}
                  className="btn btn-secondary btn-sm"
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {events?.data?.data?.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <Calendar className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No events scheduled</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new community event.
          </p>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createEventMutation.mutate(data)}
          isLoading={createEventMutation.isLoading}
        />
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          isUserParticipating={isUserParticipating(selectedEvent)}
          onJoin={() => joinEventMutation.mutate(selectedEvent.id)}
          onLeave={() => leaveEventMutation.mutate(selectedEvent.id)}
          isLoading={joinEventMutation.isLoading || leaveEventMutation.isLoading}
        />
      )}
    </div>
  )
}

// Create Event Modal Component
const CreateEventModal = ({ onClose, onSubmit, isLoading }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  const handleFormSubmit = (data) => {
    onSubmit(data)
    reset()
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Event</h3>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                {...register('title', { required: 'Title is required' })}
                className="input mt-1 w-full"
                placeholder="Enter event title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-danger-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="input mt-1 w-full"
                placeholder="Enter event description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date & Time</label>
              <input
                type="datetime-local"
                {...register('date', { required: 'Date is required' })}
                className="input mt-1 w-full"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-danger-600">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                {...register('location')}
                className="input mt-1 w-full"
                placeholder="Enter event location"
              />
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
                {isLoading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Event Details Modal Component
const EventDetailsModal = ({ event, onClose, isUserParticipating, onJoin, onLeave, isLoading }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{event.title}</h3>
          
          <div className="space-y-4">
            <p className="text-gray-600">{event.description}</p>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{formatDate(event.date)}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-2" />
                <span>{formatTime(event.date)}</span>
              </div>

              {event.location && (
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{event.location}</span>
                </div>
              )}

              <div className="flex items-center text-sm text-gray-500">
                <Users className="h-4 w-4 mr-2" />
                <span>{event.participants?.length || 0} participants</span>
              </div>
            </div>

            {event.participants && event.participants.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Participants:</h4>
                <div className="space-y-1">
                  {event.participants.map((participant) => (
                    <div key={participant.user_id} className="text-sm text-gray-600">
                      • {participant.user_name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {isUserParticipating ? (
                <button
                  onClick={onLeave}
                  disabled={isLoading}
                  className="btn btn-danger flex-1"
                >
                  <UserMinus className="h-4 w-4 mr-1" />
                  Leave Event
                </button>
              ) : (
                <button
                  onClick={onJoin}
                  disabled={isLoading}
                  className="btn btn-success flex-1"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Join Event
                </button>
              )}
              
              <button
                onClick={onClose}
                className="btn btn-secondary flex-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Events
