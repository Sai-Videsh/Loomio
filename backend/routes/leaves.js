const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { verifyToken, requireLeader } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

// Get leave requests
router.get('/', verifyToken, async (req, res) => {
  try {
    const { 
      user_id, 
      approval_status, 
      page = 1, 
      limit = 10 
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];

    // Build WHERE clause based on filters
    if (user_id) {
      conditions.push('l.user_id = ?');
      values.push(user_id);
    }

    if (approval_status) {
      conditions.push('l.approval_status = ?');
      values.push(approval_status);
    }

    // Role-based filtering
    if (req.user.role === 'member') {
      conditions.push('l.user_id = ?');
      values.push(req.user.id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM leaves l ${whereClause}`,
      values
    );
    const total = countResult[0].total;

    // Get leave requests with user details
    const [leaves] = await pool.execute(
      `SELECT 
        l.*,
        u1.name as user_name,
        u1.email as user_email,
        u2.name as approved_by_name
      FROM leaves l
      LEFT JOIN users u1 ON l.user_id = u1.id
      LEFT JOIN users u2 ON l.approved_by = u2.id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?`,
      [...values, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: leaves,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave requests'
    });
  }
});

// Request leave
router.post('/', verifyToken, [
  body('start_date').isDate().withMessage('Valid start date is required'),
  body('end_date').isDate().withMessage('Valid end date is required'),
  body('reason').trim().isLength({ min: 1, max: 500 }).withMessage('Reason is required and must be less than 500 characters')
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

    const { start_date, end_date, reason } = req.body;

    // Check if start date is not in the past
    if (new Date(start_date) < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be in the past'
      });
    }

    // Check if end date is not before start date
    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be before start date'
      });
    }

    // Check for overlapping leave requests
    const [overlappingLeaves] = await pool.execute(
      `SELECT id FROM leaves 
       WHERE user_id = ? AND approval_status != 'rejected'
       AND (
         (start_date <= ? AND end_date >= ?) OR
         (start_date <= ? AND end_date >= ?) OR
         (start_date >= ? AND end_date <= ?)
       )`,
      [req.user.id, start_date, start_date, end_date, end_date, start_date, end_date]
    );

    if (overlappingLeaves.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have an overlapping leave request for this period'
      });
    }

    // Create leave request
    const [result] = await pool.execute(
      'INSERT INTO leaves (user_id, start_date, end_date, reason) VALUES (?, ?, ?, ?)',
      [req.user.id, start_date, end_date, reason]
    );

    // Get created leave request with details
    const [leaves] = await pool.execute(
      `SELECT 
        l.*,
        u1.name as user_name,
        u1.email as user_email
      FROM leaves l
      LEFT JOIN users u1 ON l.user_id = u1.id
      WHERE l.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: leaves[0]
    });
  } catch (error) {
    console.error('Request leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit leave request'
    });
  }
});

// Approve/reject leave request
router.patch('/:id/approve', requireLeader, [
  body('approval_status').isIn(['approved', 'rejected']).withMessage('Invalid approval status'),
  body('reason').optional().trim()
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
    const { approval_status, reason } = req.body;

    // Check if leave request exists
    const [leaves] = await pool.execute(
      `SELECT 
        l.*,
        u1.name as user_name,
        u1.email as user_email
      FROM leaves l
      LEFT JOIN users u1 ON l.user_id = u1.id
      WHERE l.id = ?`,
      [id]
    );

    if (leaves.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    const leave = leaves[0];

    // Check if already processed
    if (leave.approval_status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Leave request has already been processed'
      });
    }

    // Update leave request
    await pool.execute(
      'UPDATE leaves SET approval_status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?',
      [approval_status, req.user.id, id]
    );

    // Send email notification
    try {
      if (approval_status === 'approved') {
        await sendEmail(
          leave.user_email,
          'leaveApproved',
          {
            userName: leave.user_name,
            startDate: leave.start_date,
            endDate: leave.end_date
          }
        );
      } else {
        await sendEmail(
          leave.user_email,
          'leaveRejected',
          {
            userName: leave.user_name,
            startDate: leave.start_date,
            endDate: leave.end_date,
            reason: reason || 'No reason provided'
          }
        );
      }
    } catch (emailError) {
      console.error('Failed to send leave notification email:', emailError);
    }

    // Get updated leave request
    const [updatedLeaves] = await pool.execute(
      `SELECT 
        l.*,
        u1.name as user_name,
        u1.email as user_email,
        u2.name as approved_by_name
      FROM leaves l
      LEFT JOIN users u1 ON l.user_id = u1.id
      LEFT JOIN users u2 ON l.approved_by = u2.id
      WHERE l.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: `Leave request ${approval_status} successfully`,
      data: updatedLeaves[0]
    });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process leave request'
    });
  }
});

// Update leave request (only pending requests)
router.put('/:id', verifyToken, [
  body('start_date').optional().isDate().withMessage('Valid start date is required'),
  body('end_date').optional().isDate().withMessage('Valid end date is required'),
  body('reason').optional().trim().isLength({ min: 1, max: 500 }).withMessage('Reason must be less than 500 characters')
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
    const { start_date, end_date, reason } = req.body;

    // Check if leave request exists and user has access
    const [leaves] = await pool.execute(
      'SELECT * FROM leaves WHERE id = ?',
      [id]
    );

    if (leaves.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    const leave = leaves[0];

    // Check if user owns this leave request or is admin/leader
    if (req.user.role === 'member' && leave.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if leave request is still pending
    if (leave.approval_status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update processed leave request'
      });
    }

    // Validate dates if provided
    if (start_date && new Date(start_date) < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be in the past'
      });
    }

    if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be before start date'
      });
    }

    // Build update query
    const updates = [];
    const values = [];

    if (start_date !== undefined) {
      updates.push('start_date = ?');
      values.push(start_date);
    }

    if (end_date !== undefined) {
      updates.push('end_date = ?');
      values.push(end_date);
    }

    if (reason !== undefined) {
      updates.push('reason = ?');
      values.push(reason);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    values.push(id);

    // Update leave request
    await pool.execute(
      `UPDATE leaves SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated leave request
    const [updatedLeaves] = await pool.execute(
      `SELECT 
        l.*,
        u1.name as user_name,
        u1.email as user_email,
        u2.name as approved_by_name
      FROM leaves l
      LEFT JOIN users u1 ON l.user_id = u1.id
      LEFT JOIN users u2 ON l.approved_by = u2.id
      WHERE l.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Leave request updated successfully',
      data: updatedLeaves[0]
    });
  } catch (error) {
    console.error('Update leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update leave request'
    });
  }
});

// Delete leave request (only pending requests)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if leave request exists and user has access
    const [leaves] = await pool.execute(
      'SELECT * FROM leaves WHERE id = ?',
      [id]
    );

    if (leaves.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    const leave = leaves[0];

    // Check if user owns this leave request or is admin/leader
    if (req.user.role === 'member' && leave.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if leave request is still pending
    if (leave.approval_status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete processed leave request'
      });
    }

    // Delete leave request
    await pool.execute('DELETE FROM leaves WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Leave request deleted successfully'
    });
  } catch (error) {
    console.error('Delete leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete leave request'
    });
  }
});

// Get leave statistics
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
      conditions.push('start_date >= ?');
      values.push(start_date);
    }

    if (end_date) {
      conditions.push('end_date <= ?');
      values.push(end_date);
    }

    // Role-based filtering
    if (req.user.role === 'member') {
      conditions.push('user_id = ?');
      values.push(req.user.id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get leave statistics
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as pending_requests,
        SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved_requests,
        SUM(CASE WHEN approval_status = 'rejected' THEN 1 ELSE 0 END) as rejected_requests,
        SUM(CASE WHEN approval_status = 'approved' THEN DATEDIFF(end_date, start_date) + 1 ELSE 0 END) as total_days_approved
       FROM leaves ${whereClause}`,
      values
    );

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Get leave stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave statistics'
    });
  }
});

module.exports = router;
