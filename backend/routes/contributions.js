const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { verifyToken, requireLeader } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

// Get contributions (with filters)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { 
      user_id, 
      contribution_type, 
      page = 1, 
      limit = 10 
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];

    // Build WHERE clause based on filters
    if (user_id) {
      conditions.push('c.user_id = ?');
      values.push(user_id);
    }

    if (contribution_type) {
      conditions.push('c.contribution_type = ?');
      values.push(contribution_type);
    }

    // Role-based filtering
    if (req.user.role === 'member') {
      conditions.push('c.user_id = ?');
      values.push(req.user.id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM contributions c ${whereClause}`,
      values
    );
    const total = countResult[0].total;

    // Get contributions with user details
    const [contributions] = await pool.execute(
      `SELECT 
        c.*,
        u1.name as user_name,
        u2.name as awarded_by_name,
        t.title as task_title
      FROM contributions c
      LEFT JOIN users u1 ON c.user_id = u1.id
      LEFT JOIN users u2 ON c.awarded_by = u2.id
      LEFT JOIN tasks t ON c.task_id = t.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?`,
      [...values, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: contributions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get contributions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contributions'
    });
  }
});

// Award points manually
router.post('/', requireLeader, [
  body('user_id').isInt().withMessage('Valid user ID is required'),
  body('points').isInt({ min: 1 }).withMessage('Points must be a positive integer'),
  body('contribution_type').isIn(['task_completion', 'attendance', 'participation', 'other']).withMessage('Invalid contribution type'),
  body('feedback').optional().trim(),
  body('task_id').optional().isInt().withMessage('Invalid task ID')
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

    const { user_id, points, contribution_type, feedback, task_id } = req.body;

    // Check if user exists and is active
    const [users] = await pool.execute(
      'SELECT id, name, email FROM users WHERE id = ? AND is_active = 1',
      [user_id]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Check if task exists (if provided)
    if (task_id) {
      const [tasks] = await pool.execute(
        'SELECT id FROM tasks WHERE id = ?',
        [task_id]
      );

      if (tasks.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Task not found'
        });
      }
    }

    // Create contribution record
    const [result] = await pool.execute(
      'INSERT INTO contributions (user_id, task_id, points, contribution_type, feedback, awarded_by) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, task_id, points, contribution_type, feedback, req.user.id]
    );

    // Update user's total points
    await pool.execute(
      'UPDATE users SET total_points = total_points + ? WHERE id = ?',
      [points, user_id]
    );

    // Get created contribution with details
    const [contributions] = await pool.execute(
      `SELECT 
        c.*,
        u1.name as user_name,
        u2.name as awarded_by_name,
        t.title as task_title
      FROM contributions c
      LEFT JOIN users u1 ON c.user_id = u1.id
      LEFT JOIN users u2 ON c.awarded_by = u2.id
      LEFT JOIN tasks t ON c.task_id = t.id
      WHERE c.id = ?`,
      [result.insertId]
    );

    const contribution = contributions[0];

    // Send email notification
    try {
      await sendEmail(
        users[0].email,
        'pointsAwarded',
        {
          userName: users[0].name,
          points: points,
          reason: feedback || `${contribution_type.replace('_', ' ')}`
        }
      );
    } catch (emailError) {
      console.error('Failed to send points notification email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Points awarded successfully',
      data: contribution
    });
  } catch (error) {
    console.error('Award points error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to award points'
    });
  }
});

// Get point weights configuration
router.get('/weights', verifyToken, async (req, res) => {
  try {
    const [weights] = await pool.execute(
      'SELECT * FROM point_weights WHERE is_active = 1 ORDER BY contribution_type'
    );

    res.json({
      success: true,
      data: weights
    });
  } catch (error) {
    console.error('Get point weights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch point weights'
    });
  }
});

// Update point weights (admin only)
router.put('/weights', requireLeader, [
  body('weights').isArray().withMessage('Weights must be an array'),
  body('weights.*.contribution_type').isIn(['task_completion', 'attendance', 'participation', 'other']).withMessage('Invalid contribution type'),
  body('weights.*.base_points').isInt({ min: 0 }).withMessage('Base points must be a non-negative integer')
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

    const { weights } = req.body;

    // Update each weight
    for (const weight of weights) {
      await pool.execute(
        'UPDATE point_weights SET base_points = ?, updated_at = CURRENT_TIMESTAMP WHERE contribution_type = ?',
        [weight.base_points, weight.contribution_type]
      );
    }

    // Get updated weights
    const [updatedWeights] = await pool.execute(
      'SELECT * FROM point_weights WHERE is_active = 1 ORDER BY contribution_type'
    );

    res.json({
      success: true,
      message: 'Point weights updated successfully',
      data: updatedWeights
    });
  } catch (error) {
    console.error('Update point weights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update point weights'
    });
  }
});

// Get user contribution summary
router.get('/summary/:user_id', verifyToken, async (req, res) => {
  try {
    const { user_id } = req.params;

    // Check if user has access
    if (req.user.role === 'member' && req.user.id !== parseInt(user_id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get contribution summary by type
    const [summary] = await pool.execute(
      `SELECT 
        contribution_type,
        COUNT(*) as count,
        SUM(points) as total_points
       FROM contributions 
       WHERE user_id = ?
       GROUP BY contribution_type
       ORDER BY total_points DESC`,
      [user_id]
    );

    // Get total points
    const [totalResult] = await pool.execute(
      'SELECT SUM(points) as total_points FROM contributions WHERE user_id = ?',
      [user_id]
    );

    res.json({
      success: true,
      data: {
        summary,
        total_points: totalResult[0].total_points || 0
      }
    });
  } catch (error) {
    console.error('Get contribution summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contribution summary'
    });
  }
});

module.exports = router;
