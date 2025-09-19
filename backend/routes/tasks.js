const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { verifyToken, requireLeader } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

// Get all tasks (with filters)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { 
      status, 
      assigned_to, 
      priority, 
      page = 1, 
      limit = 10,
      search 
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];

    // Build WHERE clause based on filters
    if (status) {
      conditions.push('t.status = ?');
      values.push(status);
    }

    if (assigned_to) {
      conditions.push('t.assigned_to = ?');
      values.push(assigned_to);
    }

    if (priority) {
      conditions.push('t.priority = ?');
      values.push(priority);
    }

    if (search) {
      conditions.push('(t.title LIKE ? OR t.description LIKE ?)');
      values.push(`%${search}%`, `%${search}%`);
    }

    // Role-based filtering
    if (req.user.role === 'member') {
      conditions.push('(t.assigned_to = ? OR t.assigned_by = ?)');
      values.push(req.user.id, req.user.id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM tasks t ${whereClause}`,
      values
    );
    const total = countResult[0].total;

    // Get tasks with user details
    const [tasks] = await pool.execute(
      `SELECT 
        t.*,
        u1.name as assigned_by_name,
        u2.name as assigned_to_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?`,
      [...values, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks'
    });
  }
});

// Get single task
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [tasks] = await pool.execute(
      `SELECT 
        t.*,
        u1.name as assigned_by_name,
        u2.name as assigned_to_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      WHERE t.id = ?`,
      [id]
    );

    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const task = tasks[0];

    // Check if user has access to this task
    if (req.user.role === 'member' && 
        task.assigned_to !== req.user.id && 
        task.assigned_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task'
    });
  }
});

// Create new task
router.post('/', requireLeader, [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required and must be less than 200 characters'),
  body('description').optional().trim(),
  body('assigned_to').optional().isInt().withMessage('Invalid user ID'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('deadline').optional().isISO8601().withMessage('Invalid deadline format'),
  body('points_reward').optional().isInt({ min: 0 }).withMessage('Points must be a positive integer')
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

    const { 
      title, 
      description, 
      assigned_to, 
      priority = 'medium',
      deadline,
      points_reward = 10 
    } = req.body;

    // Check if assigned user exists
    if (assigned_to) {
      const [users] = await pool.execute(
        'SELECT id, name, email FROM users WHERE id = ? AND is_active = 1',
        [assigned_to]
      );

      if (users.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user not found or inactive'
        });
      }
    }

    // Create task
    const [result] = await pool.execute(
      `INSERT INTO tasks (title, description, assigned_by, assigned_to, priority, deadline, points_reward) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description, req.user.id, assigned_to, priority, deadline, points_reward]
    );

    const taskId = result.insertId;

    // Get created task with user details
    const [tasks] = await pool.execute(
      `SELECT 
        t.*,
        u1.name as assigned_by_name,
        u2.name as assigned_to_name,
        u2.email as assigned_to_email
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      WHERE t.id = ?`,
      [taskId]
    );

    const task = tasks[0];

    // Send email notification if task is assigned
    if (assigned_to && task.assigned_to_email) {
      try {
        await sendEmail(
          task.assigned_to_email,
          'taskAssigned',
          {
            userName: task.assigned_to_name,
            taskTitle: title,
            taskDescription: description || 'No description provided',
            deadline: deadline
          }
        );
      } catch (emailError) {
        console.error('Failed to send task assignment email:', emailError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task'
    });
  }
});

// Update task
router.put('/:id', requireLeader, [
  body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Title must be less than 200 characters'),
  body('description').optional().trim(),
  body('assigned_to').optional().isInt().withMessage('Invalid user ID'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('deadline').optional().isISO8601().withMessage('Invalid deadline format'),
  body('points_reward').optional().isInt({ min: 0 }).withMessage('Points must be a positive integer')
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
    const { 
      title, 
      description, 
      assigned_to, 
      priority,
      deadline,
      points_reward 
    } = req.body;

    // Check if task exists
    const [existingTasks] = await pool.execute(
      'SELECT * FROM tasks WHERE id = ?',
      [id]
    );

    if (existingTasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const task = existingTasks[0];

    // Check if assigned user exists
    if (assigned_to) {
      const [users] = await pool.execute(
        'SELECT id, name, email FROM users WHERE id = ? AND is_active = 1',
        [assigned_to]
      );

      if (users.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user not found or inactive'
        });
      }
    }

    // Build update query
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }

    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      values.push(assigned_to);
    }

    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }

    if (deadline !== undefined) {
      updates.push('deadline = ?');
      values.push(deadline);
    }

    if (points_reward !== undefined) {
      updates.push('points_reward = ?');
      values.push(points_reward);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    values.push(id);

    // Update task
    await pool.execute(
      `UPDATE tasks SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    // Get updated task
    const [updatedTasks] = await pool.execute(
      `SELECT 
        t.*,
        u1.name as assigned_by_name,
        u2.name as assigned_to_name,
        u2.email as assigned_to_email
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      WHERE t.id = ?`,
      [id]
    );

    const updatedTask = updatedTasks[0];

    // Send email notification if assignment changed
    if (assigned_to !== undefined && 
        assigned_to !== task.assigned_to && 
        assigned_to && 
        updatedTask.assigned_to_email) {
      try {
        await sendEmail(
          updatedTask.assigned_to_email,
          'taskAssigned',
          {
            userName: updatedTask.assigned_to_name,
            taskTitle: updatedTask.title,
            taskDescription: updatedTask.description || 'No description provided',
            deadline: updatedTask.deadline
          }
        );
      } catch (emailError) {
        console.error('Failed to send task assignment email:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task'
    });
  }
});

// Update task status
router.patch('/:id/status', verifyToken, [
  body('status').isIn(['not_started', 'in_progress', 'completed', 'overdue']).withMessage('Invalid status'),
  body('progress_notes').optional().trim()
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
    const { status, progress_notes } = req.body;

    // Check if task exists and user has access
    const [tasks] = await pool.execute(
      'SELECT * FROM tasks WHERE id = ?',
      [id]
    );

    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const task = tasks[0];

    // Check permissions
    if (req.user.role === 'member' && 
        task.assigned_to !== req.user.id && 
        task.assigned_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update status
    await pool.execute(
      'UPDATE tasks SET status = ?, progress_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, progress_notes, id]
    );

    // Award points if task is completed
    if (status === 'completed' && task.status !== 'completed' && task.assigned_to) {
      try {
        // Check if points already awarded
        const [contributions] = await pool.execute(
          'SELECT id FROM contributions WHERE task_id = ? AND contribution_type = "task_completion"',
          [id]
        );

        if (contributions.length === 0) {
          // Award points
          await pool.execute(
            'INSERT INTO contributions (user_id, task_id, points, contribution_type, awarded_by) VALUES (?, ?, ?, ?, ?)',
            [task.assigned_to, id, task.points_reward, 'task_completion', req.user.id]
          );

          // Update user's total points
          await pool.execute(
            'UPDATE users SET total_points = total_points + ? WHERE id = ?',
            [task.points_reward, task.assigned_to]
          );
        }
      } catch (pointsError) {
        console.error('Failed to award points:', pointsError);
      }
    }

    res.json({
      success: true,
      message: 'Task status updated successfully'
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task status'
    });
  }
});

// Delete task
router.delete('/:id', requireLeader, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if task exists
    const [tasks] = await pool.execute(
      'SELECT * FROM tasks WHERE id = ?',
      [id]
    );

    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Delete task
    await pool.execute('DELETE FROM tasks WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task'
    });
  }
});

module.exports = router;
