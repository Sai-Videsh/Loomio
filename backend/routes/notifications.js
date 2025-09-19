const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { verifyToken, requireLeader } = require('../middleware/auth');

const router = express.Router();

// Get notifications for current user
router.get('/', verifyToken, async (req, res) => {
  try {
    const { 
      type, 
      is_read, 
      page = 1, 
      limit = 20 
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = ['n.user_id = ?'];
    const values = [req.user.id];

    // Build WHERE clause based on filters
    if (type) {
      conditions.push('n.type = ?');
      values.push(type);
    }

    if (is_read !== undefined) {
      conditions.push('n.is_read = ?');
      values.push(is_read === 'true');
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM notifications n ${whereClause}`,
      values
    );
    const total = countResult[0].total;

    // Get notifications
    const [notifications] = await pool.execute(
      `SELECT n.*
       FROM notifications n
       ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT ? OFFSET ?`,
      [...values, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

// Mark notification as read
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if notification exists and belongs to user
    const [notifications] = await pool.execute(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (notifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Mark as read
    await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.patch('/read-all', verifyToken, async (req, res) => {
  try {
    // Mark all user's unread notifications as read
    const [result] = await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );

    res.json({
      success: true,
      message: `${result.affectedRows} notifications marked as read`
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read'
    });
  }
});

// Delete notification
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if notification exists and belongs to user
    const [notifications] = await pool.execute(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (notifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Delete notification
    await pool.execute('DELETE FROM notifications WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
});

// Get unread notification count
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        unread_count: result[0].count
      }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread notification count'
    });
  }
});

// Create notification (admin/leader only)
router.post('/', requireLeader, [
  body('user_id').isInt().withMessage('Valid user ID is required'),
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required and must be less than 200 characters'),
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message is required and must be less than 1000 characters'),
  body('type').isIn(['task_assigned', 'leave_approved', 'leave_rejected', 'deadline_reminder', 'event_reminder', 'points_awarded', 'general']).withMessage('Invalid notification type'),
  body('related_id').optional().isInt().withMessage('Related ID must be an integer'),
  body('related_type').optional().trim()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { user_id, title, message, type, related_id, related_type } = req.body;

    // Check if user exists and is active
    const [users] = await pool.execute(
      'SELECT id, name FROM users WHERE id = ? AND is_active = 1',
      [user_id]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Create notification
    const [result] = await pool.execute(
      'INSERT INTO notifications (user_id, title, message, type, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, title, message, type, related_id, related_type]
    );

    // Get created notification
    const [notifications] = await pool.execute(
      'SELECT * FROM notifications WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notifications[0]
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
});

// Create bulk notifications (admin/leader only)
router.post('/bulk', requireLeader, [
  body('user_ids').isArray().withMessage('User IDs must be an array'),
  body('user_ids.*').isInt().withMessage('Each user ID must be an integer'),
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required and must be less than 200 characters'),
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message is required and must be less than 1000 characters'),
  body('type').isIn(['task_assigned', 'leave_approved', 'leave_rejected', 'deadline_reminder', 'event_reminder', 'points_awarded', 'general']).withMessage('Invalid notification type'),
  body('related_id').optional().isInt().withMessage('Related ID must be an integer'),
  body('related_type').optional().trim()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { user_ids, title, message, type, related_id, related_type } = req.body;

    // Check if users exist and are active
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE id IN (?) AND is_active = 1',
      [user_ids]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid users found'
      });
    }

    // Create notifications for each user
    const notificationValues = users.map(user => [
      user.id, title, message, type, related_id, related_type
    ]);

    await pool.execute(
      'INSERT INTO notifications (user_id, title, message, type, related_id, related_type) VALUES ?',
      [notificationValues]
    );

    res.status(201).json({
      success: true,
      message: `Notifications created successfully for ${users.length} users`
    });
  } catch (error) {
    console.error('Create bulk notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bulk notifications'
    });
  }
});

// Get notification statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const conditions = ['n.user_id = ?'];
    const values = [req.user.id];

    if (start_date) {
      conditions.push('n.created_at >= ?');
      values.push(start_date);
    }

    if (end_date) {
      conditions.push('n.created_at <= ?');
      values.push(end_date);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get notification statistics
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_notifications,
        SUM(CASE WHEN is_read = TRUE THEN 1 ELSE 0 END) as read_notifications,
        SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread_notifications,
        SUM(CASE WHEN type = 'task_assigned' THEN 1 ELSE 0 END) as task_notifications,
        SUM(CASE WHEN type = 'leave_approved' OR type = 'leave_rejected' THEN 1 ELSE 0 END) as leave_notifications,
        SUM(CASE WHEN type = 'event_reminder' THEN 1 ELSE 0 END) as event_notifications,
        SUM(CASE WHEN type = 'points_awarded' THEN 1 ELSE 0 END) as points_notifications
       FROM notifications n ${whereClause}`,
      values
    );

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification statistics'
    });
  }
});

module.exports = router;
