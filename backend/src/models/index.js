const User = require('./User');
const Community = require('./Community');
const UserCommunity = require('./UserCommunity');
const Task = require('./Task');
const TaskAssignment = require('./TaskAssignment');
const Attendance = require('./Attendance');
const LeaveRequest = require('./LeaveRequest');
const Event = require('./Event');
const Contribution = require('./Contribution');
const Notification = require('./Notification');

// User-Community many-to-many associations
User.belongsToMany(Community, { 
  through: UserCommunity, 
  foreignKey: 'user_id', 
  otherKey: 'community_id',
  as: 'communities'
});
Community.belongsToMany(User, { 
  through: UserCommunity, 
  foreignKey: 'community_id', 
  otherKey: 'user_id',
  as: 'members'
});

// UserCommunity associations
UserCommunity.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UserCommunity.belongsTo(Community, { foreignKey: 'community_id', as: 'community' });

// Legacy associations (keep for backward compatibility during migration)
User.belongsTo(Community, { foreignKey: 'community_id', as: 'primaryCommunity' });
Community.hasMany(User, { foreignKey: 'community_id', as: 'primaryMembers' });

// Community associations
Community.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Task associations
Task.belongsTo(User, { foreignKey: 'assigned_by', as: 'creator' });
Task.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer' });
Task.belongsTo(Community, { foreignKey: 'community_id', as: 'community' });
Task.belongsToMany(User, { 
  through: TaskAssignment, 
  foreignKey: 'task_id', 
  otherKey: 'user_id',
  as: 'assignees'
});
User.belongsToMany(Task, { 
  through: TaskAssignment, 
  foreignKey: 'user_id', 
  otherKey: 'task_id',
  as: 'assignedTasks'
});

// TaskAssignment associations
TaskAssignment.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });
TaskAssignment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Contribution associations
Contribution.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Contribution.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });
Contribution.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });
Contribution.belongsTo(Community, { foreignKey: 'community_id', as: 'community' });

// Attendance associations
Attendance.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Attendance.belongsTo(Community, { foreignKey: 'community_id', as: 'community' });
Attendance.belongsTo(User, { foreignKey: 'marked_by', as: 'marker' });

// LeaveRequest associations
LeaveRequest.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
LeaveRequest.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer' });
LeaveRequest.belongsTo(Community, { foreignKey: 'community_id', as: 'community' });

// Event associations
Event.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Event.belongsTo(Community, { foreignKey: 'community_id', as: 'community' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Notification.belongsTo(Community, { foreignKey: 'community_id', as: 'community' });

module.exports = {
  User,
  Community,
  UserCommunity,
  Task,
  TaskAssignment,
  Contribution,
  Attendance,
  LeaveRequest,
  Event,
  Notification
};
