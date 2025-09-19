const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { verifyToken, requireLeader } = require('../middleware/auth');

const router = express.Router();

// Get attendance records
router.get('/', verifyToken, async (req, res) => {
  try {
    const { 
      user_id, 
      date, 
      status, 
      page = 1, 
      limit = 10 
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];

    // Build WHERE clause based on filters
    if (user_id) {
      conditions.push('a.user_id = ?');
      values.push(user_id);
    }

    if (date) {
      conditions.push('a.date = ?');
      values.push(date);
    }

    if (status) {
      conditions.push('a.status = ?');
      values.push(status);
    }

    // Role-based filtering
    if (req.user.role === 'member') {
      conditions.push('a.user_id = ?');
      values.push(req.user.id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM attendance a ${whereClause}`,
      values
    );
    const total = countResult[0].total;

    // Get attendance records with user details
    const [attendance] = await pool.execute(
      `SELECT 
        a.*,
        u1.name as user_name,
        u2.name as recorded_by_name
      FROM attendance a
      LEFT JOIN users u1 ON a.user_id = u1.id
      LEFT JOIN users u2 ON a.recorded_by = u2.id
      ${whereClause}
      ORDER BY a.date DESC, a.created_at DESC
      LIMIT ? OFFSET ?`,
      [...values, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: attendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records'
    });
  }
});

// Mark attendance
router.post('/', requireLeader, [
  body('user_id').isInt().withMessage('Valid user ID is required'),
  body('date').isDate().withMessage('Valid date is required'),
  body('status').isIn(['present', 'absent', 'late', 'leave']).withMessage('Invalid status'),
  body('check_in_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('check_out_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('notes').optional().trim()
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

    const { user_id, date, status, check_in_time, check_out_time, notes } = req.body;

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

    // Check if attendance already exists for this user and date
    const [existingAttendance] = await pool.execute(
      'SELECT id FROM attendance WHERE user_id = ? AND date = ?',
      [user_id, date]
    );

    if (existingAttendance.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this date'
      });
    }

    // Create attendance record
    const [result] = await pool.execute(
      'INSERT INTO attendance (user_id, date, status, check_in_time, check_out_time, notes, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user_id, date, status, check_in_time, check_out_time, notes, req.user.id]
    );

    // Award points for attendance (if present)
    if (status === 'present') {
      try {
        // Get attendance points from weights
        const [weights] = await pool.execute(
          'SELECT base_points FROM point_weights WHERE contribution_type = "attendance" AND is_active = 1'
        );

        if (weights.length > 0) {
          const points = weights[0].base_points;
          
          // Award points
          await pool.execute(
            'INSERT INTO contributions (user_id, points, contribution_type, awarded_by) VALUES (?, ?, ?, ?)',
            [user_id, points, 'attendance', req.user.id]
          );

          // Update user's total points
          await pool.execute(
            'UPDATE users SET total_points = total_points + ? WHERE id = ?',
            [points, user_id]
          );
        }
      } catch (pointsError) {
        console.error('Failed to award attendance points:', pointsError);
      }
    }

    // Get created attendance record with details
    const [attendance] = await pool.execute(
      `SELECT 
        a.*,
        u1.name as user_name,
        u2.name as recorded_by_name
      FROM attendance a
      LEFT JOIN users u1 ON a.user_id = u1.id
      LEFT JOIN users u2 ON a.recorded_by = u2.id
      WHERE a.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance[0]
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance'
    });
  }
});

// Update attendance
router.put('/:id', requireLeader, [
  body('status').optional().isIn(['present', 'absent', 'late', 'leave']).withMessage('Invalid status'),
  body('check_in_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('check_out_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('notes').optional().trim()
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

    const { id } = req.params;
    const { status, check_in_time, check_out_time, notes } = req.body;

    // Check if attendance record exists
    const [existingAttendance] = await pool.execute(
      'SELECT * FROM attendance WHERE id = ?',
      [id]
    );

    if (existingAttendance.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    const attendance = existingAttendance[0];

    // Build update query
    const updates = [];
    const values = [];

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    if (check_in_time !== undefined) {
      updates.push('check_in_time = ?');
      values.push(check_in_time);
    }

    if (check_out_time !== undefined) {
      updates.push('check_out_time = ?');
      values.push(check_out_time);
    }

    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    values.push(id);

    // Update attendance record
    await pool.execute(
      `UPDATE attendance SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Handle points adjustment if status changed
    if (status !== undefined && status !== attendance.status) {
      try {
        // Remove old points if status was 'present'
        if (attendance.status === 'present') {
          const [oldContributions] = await pool.execute(
            'SELECT id FROM contributions WHERE user_id = ? AND contribution_type = "attendance" AND DATE(created_at) = ?',
            [attendance.user_id, attendance.date]
          );

          if (oldContributions.length > 0) {
            // Get points to remove
            const [weights] = await pool.execute(
              'SELECT base_points FROM point_weights WHERE contribution_type = "attendance" AND is_active = 1'
            );

            if (weights.length > 0) {
              const points = weights[0].base_points;
              
              // Remove contribution record
              await pool.execute(
                'DELETE FROM contributions WHERE id = ?',
                [oldContributions[0].id]
              );

              // Update user's total points
              await pool.execute(
                'UPDATE users SET total_points = total_points - ? WHERE id = ?',
                [points, attendance.user_id]
              );
            }
          }
        }

        // Award new points if status is 'present'
        if (status === 'present') {
          const [weights] = await pool.execute(
            'SELECT base_points FROM point_weights WHERE contribution_type = "attendance" AND is_active = 1'
          );

          if (weights.length > 0) {
            const points = weights[0].base_points;
            
            // Award points
            await pool.execute(
              'INSERT INTO contributions (user_id, points, contribution_type, awarded_by) VALUES (?, ?, ?, ?)',
              [attendance.user_id, points, 'attendance', req.user.id]
            );

            // Update user's total points
            await pool.execute(
              'UPDATE users SET total_points = total_points + ? WHERE id = ?',
              [points, attendance.user_id]
            );
          }
        }
      } catch (pointsError) {
        console.error('Failed to adjust attendance points:', pointsError);
      }
    }

    // Get updated attendance record
    const [updatedAttendance] = await pool.execute(
      `SELECT 
        a.*,
        u1.name as user_name,
        u2.name as recorded_by_name
      FROM attendance a
      LEFT JOIN users u1 ON a.user_id = u1.id
      LEFT JOIN users u2 ON a.recorded_by = u2.id
      WHERE a.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Attendance updated successfully',
      data: updatedAttendance[0]
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance'
    });
  }
});

// Delete attendance record
router.delete('/:id', requireLeader, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if attendance record exists
    const [attendance] = await pool.execute(
      'SELECT * FROM attendance WHERE id = ?',
      [id]
    );

    if (attendance.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Remove points if status was 'present'
    if (attendance[0].status === 'present') {
      try {
        const [contributions] = await pool.execute(
          'SELECT id FROM contributions WHERE user_id = ? AND contribution_type = "attendance" AND DATE(created_at) = ?',
          [attendance[0].user_id, attendance[0].date]
        );

        if (contributions.length > 0) {
          const [weights] = await pool.execute(
            'SELECT base_points FROM point_weights WHERE contribution_type = "attendance" AND is_active = 1'
          );

          if (weights.length > 0) {
            const points = weights[0].base_points;
            
            // Remove contribution record
            await pool.execute(
              'DELETE FROM contributions WHERE id = ?',
              [contributions[0].id]
            );

            // Update user's total points
            await pool.execute(
              'UPDATE users SET total_points = total_points - ? WHERE id = ?',
              [points, attendance[0].user_id]
            );
          }
        }
      } catch (pointsError) {
        console.error('Failed to remove attendance points:', pointsError);
      }
    }

    // Delete attendance record
    await pool.execute('DELETE FROM attendance WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attendance record'
    });
  }
});

// Get attendance statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const { user_id, start_date, end_date } = req.query;
    const conditions = [];
    const values = [];

    if (user_id) {
      conditions.push('user_id = ?');
      values.push(user_id);
    }

    if (start_date) {
      conditions.push('date >= ?');
      values.push(start_date);
    }

    if (end_date) {
      conditions.push('date <= ?');
      values.push(end_date);
    }

    // Role-based filtering
    if (req.user.role === 'member') {
      conditions.push('user_id = ?');
      values.push(req.user.id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get attendance statistics
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
        SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave_days
       FROM attendance ${whereClause}`,
      values
    );

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance statistics'
    });
  }
});

module.exports = router;
