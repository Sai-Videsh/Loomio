const express = require('express');
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get dashboard data based on user role
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let dashboardData = {};

    if (userRole === 'admin') {
      // Admin dashboard - system overview
      dashboardData = await getAdminDashboard();
    } else if (userRole === 'leader') {
      // Leader dashboard - team overview
      dashboardData = await getLeaderDashboard();
    } else {
      // Member dashboard - personal overview
      dashboardData = await getMemberDashboard(userId);
    }

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Get admin dashboard data
async function getAdminDashboard() {
  // Total users
  const [userStats] = await pool.execute(
    `SELECT 
      COUNT(*) as total_users,
      SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
      SUM(CASE WHEN role = 'leader' THEN 1 ELSE 0 END) as leaders,
      SUM(CASE WHEN role = 'member' THEN 1 ELSE 0 END) as members,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users
     FROM users`
  );

  // Task statistics
  const [taskStats] = await pool.execute(
    `SELECT 
      COUNT(*) as total_tasks,
      SUM(CASE WHEN status = 'not_started' THEN 1 ELSE 0 END) as not_started,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue
     FROM tasks`
  );

  // Contribution statistics
  const [contributionStats] = await pool.execute(
    `SELECT 
      SUM(points) as total_points_awarded,
      COUNT(*) as total_contributions,
      SUM(CASE WHEN contribution_type = 'task_completion' THEN points ELSE 0 END) as task_points,
      SUM(CASE WHEN contribution_type = 'attendance' THEN points ELSE 0 END) as attendance_points,
      SUM(CASE WHEN contribution_type = 'participation' THEN points ELSE 0 END) as participation_points
     FROM contributions`
  );

  // Attendance statistics
  const [attendanceStats] = await pool.execute(
    `SELECT 
      COUNT(*) as total_attendance_records,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
      SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days
     FROM attendance`
  );

  // Leave statistics
  const [leaveStats] = await pool.execute(
    `SELECT 
      COUNT(*) as total_leave_requests,
      SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as pending_requests,
      SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved_requests,
      SUM(CASE WHEN approval_status = 'rejected' THEN 1 ELSE 0 END) as rejected_requests
     FROM leaves`
  );

  // Event statistics
  const [eventStats] = await pool.execute(
    `SELECT 
      COUNT(*) as total_events,
      SUM(CASE WHEN event_type = 'meeting' THEN 1 ELSE 0 END) as meetings,
      SUM(CASE WHEN event_type = 'deadline' THEN 1 ELSE 0 END) as deadlines,
      SUM(CASE WHEN event_type = 'celebration' THEN 1 ELSE 0 END) as celebrations
     FROM events`
  );

  // Recent activities
  const [recentTasks] = await pool.execute(
    `SELECT 
      t.*,
      u1.name as assigned_by_name,
      u2.name as assigned_to_name
     FROM tasks t
     LEFT JOIN users u1 ON t.assigned_by = u1.id
     LEFT JOIN users u2 ON t.assigned_to = u2.id
     ORDER BY t.created_at DESC
     LIMIT 5`
  );

  const [recentContributions] = await pool.execute(
    `SELECT 
      c.*,
      u1.name as user_name,
      u2.name as awarded_by_name
     FROM contributions c
     LEFT JOIN users u1 ON c.user_id = u1.id
     LEFT JOIN users u2 ON c.awarded_by = u2.id
     ORDER BY c.created_at DESC
     LIMIT 5`
  );

  // Top contributors
  const [topContributors] = await pool.execute(
    `SELECT 
      u.name,
      u.total_points,
      COUNT(c.id) as contribution_count
     FROM users u
     LEFT JOIN contributions c ON u.id = c.user_id
     WHERE u.is_active = 1
     GROUP BY u.id, u.name, u.total_points
     ORDER BY u.total_points DESC
     LIMIT 10`
  );

  return {
    userStats: userStats[0],
    taskStats: taskStats[0],
    contributionStats: contributionStats[0],
    attendanceStats: attendanceStats[0],
    leaveStats: leaveStats[0],
    eventStats: eventStats[0],
    recentTasks,
    recentContributions,
    topContributors
  };
}

// Get leader dashboard data
async function getLeaderDashboard() {
  // Team task statistics
  const [taskStats] = await pool.execute(
    `SELECT 
      COUNT(*) as total_tasks,
      SUM(CASE WHEN status = 'not_started' THEN 1 ELSE 0 END) as not_started,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue
     FROM tasks`
  );

  // Team contribution statistics
  const [contributionStats] = await pool.execute(
    `SELECT 
      SUM(points) as total_points_awarded,
      COUNT(*) as total_contributions
     FROM contributions`
  );

  // Pending approvals
  const [pendingLeaves] = await pool.execute(
    `SELECT 
      l.*,
      u.name as user_name
     FROM leaves l
     LEFT JOIN users u ON l.user_id = u.id
     WHERE l.approval_status = 'pending'
     ORDER BY l.created_at ASC`
  );

  // Recent team activities
  const [recentActivities] = await pool.execute(
    `SELECT 
      'task' as type,
      t.title as title,
      t.status as status,
      u.name as user_name,
      t.created_at as date
     FROM tasks t
     LEFT JOIN users u ON t.assigned_to = u.id
     WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     
     UNION ALL
     
     SELECT 
      'contribution' as type,
      CONCAT(c.points, ' points awarded') as title,
      c.contribution_type as status,
      u.name as user_name,
      c.created_at as date
     FROM contributions c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     
     ORDER BY date DESC
     LIMIT 10`
  );

  // Team member performance
  const [teamPerformance] = await pool.execute(
    `SELECT 
      u.name,
      u.total_points,
      COUNT(t.id) as assigned_tasks,
      SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
     FROM users u
     LEFT JOIN tasks t ON u.id = t.assigned_to
     WHERE u.role = 'member' AND u.is_active = 1
     GROUP BY u.id, u.name, u.total_points
     ORDER BY u.total_points DESC`
  );

  return {
    taskStats: taskStats[0],
    contributionStats: contributionStats[0],
    pendingLeaves,
    recentActivities,
    teamPerformance
  };
}

// Get member dashboard data
async function getMemberDashboard(userId) {
  // Personal task statistics
  const [taskStats] = await pool.execute(
    `SELECT 
      COUNT(*) as total_tasks,
      SUM(CASE WHEN status = 'not_started' THEN 1 ELSE 0 END) as not_started,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue
     FROM tasks
     WHERE assigned_to = ?`,
    [userId]
  );

  // Personal contribution statistics
  const [contributionStats] = await pool.execute(
    `SELECT 
      SUM(points) as total_points_earned,
      COUNT(*) as total_contributions,
      SUM(CASE WHEN contribution_type = 'task_completion' THEN points ELSE 0 END) as task_points,
      SUM(CASE WHEN contribution_type = 'attendance' THEN points ELSE 0 END) as attendance_points,
      SUM(CASE WHEN contribution_type = 'participation' THEN points ELSE 0 END) as participation_points
     FROM contributions
     WHERE user_id = ?`,
    [userId]
  );

  // Personal attendance statistics
  const [attendanceStats] = await pool.execute(
    `SELECT 
      COUNT(*) as total_days,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
      SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days
     FROM attendance
     WHERE user_id = ?`,
    [userId]
  );

  // Personal leave statistics
  const [leaveStats] = await pool.execute(
    `SELECT 
      COUNT(*) as total_requests,
      SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as pending_requests,
      SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved_requests,
      SUM(CASE WHEN approval_status = 'rejected' THEN 1 ELSE 0 END) as rejected_requests
     FROM leaves
     WHERE user_id = ?`,
    [userId]
  );

  // My tasks
  const [myTasks] = await pool.execute(
    `SELECT 
      t.*,
      u.name as assigned_by_name
     FROM tasks t
     LEFT JOIN users u ON t.assigned_by = u.id
     WHERE t.assigned_to = ?
     ORDER BY t.deadline ASC
     LIMIT 5`,
    [userId]
  );

  // My recent contributions
  const [myContributions] = await pool.execute(
    `SELECT 
      c.*,
      u.name as awarded_by_name
     FROM contributions c
     LEFT JOIN users u ON c.awarded_by = u.id
     WHERE c.user_id = ?
     ORDER BY c.created_at DESC
     LIMIT 5`,
    [userId]
  );

  // My upcoming events
  const [myEvents] = await pool.execute(
    `SELECT 
      e.*,
      ep.status as participation_status
     FROM events e
     LEFT JOIN event_participants ep ON e.id = ep.event_id AND ep.user_id = ?
     WHERE e.event_date >= CURDATE()
     ORDER BY e.event_date ASC
     LIMIT 5`,
    [userId]
  );

  // My recent attendance
  const [myAttendance] = await pool.execute(
    `SELECT *
     FROM attendance
     WHERE user_id = ?
     ORDER BY date DESC
     LIMIT 7`,
    [userId]
  );

  return {
    taskStats: taskStats[0],
    contributionStats: contributionStats[0],
    attendanceStats: attendanceStats[0],
    leaveStats: leaveStats[0],
    myTasks,
    myContributions,
    myEvents,
    myAttendance
  };
}

// Get analytics data
router.get('/analytics', verifyToken, async (req, res) => {
  try {
    const { start_date, end_date, type } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let analyticsData = {};

    if (type === 'contributions') {
      analyticsData = await getContributionAnalytics(userId, userRole, start_date, end_date);
    } else if (type === 'tasks') {
      analyticsData = await getTaskAnalytics(userId, userRole, start_date, end_date);
    } else if (type === 'attendance') {
      analyticsData = await getAttendanceAnalytics(userId, userRole, start_date, end_date);
    } else {
      // Return all analytics
      analyticsData = {
        contributions: await getContributionAnalytics(userId, userRole, start_date, end_date),
        tasks: await getTaskAnalytics(userId, userRole, start_date, end_date),
        attendance: await getAttendanceAnalytics(userId, userRole, start_date, end_date)
      };
    }

    res.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data'
    });
  }
});

// Get contribution analytics
async function getContributionAnalytics(userId, userRole, startDate, endDate) {
  const conditions = [];
  const values = [];

  if (userRole === 'member') {
    conditions.push('c.user_id = ?');
    values.push(userId);
  }

  if (startDate) {
    conditions.push('c.created_at >= ?');
    values.push(startDate);
  }

  if (endDate) {
    conditions.push('c.created_at <= ?');
    values.push(endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Contribution by type
  const [contributionByType] = await pool.execute(
    `SELECT 
      contribution_type,
      COUNT(*) as count,
      SUM(points) as total_points
     FROM contributions c
     ${whereClause}
     GROUP BY contribution_type
     ORDER BY total_points DESC`,
    values
  );

  // Contribution over time
  const [contributionOverTime] = await pool.execute(
    `SELECT 
      DATE(c.created_at) as date,
      COUNT(*) as count,
      SUM(points) as total_points
     FROM contributions c
     ${whereClause}
     GROUP BY DATE(c.created_at)
     ORDER BY date DESC
     LIMIT 30`,
    values
  );

  return {
    byType: contributionByType,
    overTime: contributionOverTime
  };
}

// Get task analytics
async function getTaskAnalytics(userId, userRole, startDate, endDate) {
  const conditions = [];
  const values = [];

  if (userRole === 'member') {
    conditions.push('t.assigned_to = ?');
    values.push(userId);
  }

  if (startDate) {
    conditions.push('t.created_at >= ?');
    values.push(startDate);
  }

  if (endDate) {
    conditions.push('t.created_at <= ?');
    values.push(endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Task status distribution
  const [taskStatus] = await pool.execute(
    `SELECT 
      status,
      COUNT(*) as count
     FROM tasks t
     ${whereClause}
     GROUP BY status`,
    values
  );

  // Task completion over time
  const [taskCompletion] = await pool.execute(
    `SELECT 
      DATE(t.created_at) as date,
      COUNT(*) as created,
      SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed
     FROM tasks t
     ${whereClause}
     GROUP BY DATE(t.created_at)
     ORDER BY date DESC
     LIMIT 30`,
    values
  );

  return {
    byStatus: taskStatus,
    completionOverTime: taskCompletion
  };
}

// Get attendance analytics
async function getAttendanceAnalytics(userId, userRole, startDate, endDate) {
  const conditions = [];
  const values = [];

  if (userRole === 'member') {
    conditions.push('a.user_id = ?');
    values.push(userId);
  }

  if (startDate) {
    conditions.push('a.date >= ?');
    values.push(startDate);
  }

  if (endDate) {
    conditions.push('a.date <= ?');
    values.push(endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Attendance by status
  const [attendanceByStatus] = await pool.execute(
    `SELECT 
      status,
      COUNT(*) as count
     FROM attendance a
     ${whereClause}
     GROUP BY status`,
    values
  );

  // Attendance over time
  const [attendanceOverTime] = await pool.execute(
    `SELECT 
      a.date,
      COUNT(*) as total,
      SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present,
      SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent,
      SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late
     FROM attendance a
     ${whereClause}
     GROUP BY a.date
     ORDER BY a.date DESC
     LIMIT 30`,
    values
  );

  return {
    byStatus: attendanceByStatus,
    overTime: attendanceOverTime
  };
}

module.exports = router;
