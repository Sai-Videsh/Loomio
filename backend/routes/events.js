const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { verifyToken, requireLeader } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

// Get events
router.get('/', verifyToken, async (req, res) => {
  try {
    const { 
      event_type, 
      start_date, 
      end_date, 
      page = 1, 
      limit = 10 
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];

    // Build WHERE clause based on filters
    if (event_type) {
      conditions.push('e.event_type = ?');
      values.push(event_type);
    }

    if (start_date) {
      conditions.push('e.event_date >= ?');
      values.push(start_date);
    }

    if (end_date) {
      conditions.push('e.event_date <= ?');
      values.push(end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM events e ${whereClause}`,
      values
    );
    const total = countResult[0].total;

    // Get events with user details
    const [events] = await pool.execute(
      `SELECT 
        e.*,
        u.name as created_by_name
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      ${whereClause}
      ORDER BY e.event_date ASC
      LIMIT ? OFFSET ?`,
      [...values, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events'
    });
  }
});

// Get single event
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [events] = await pool.execute(
      `SELECT 
        e.*,
        u.name as created_by_name
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = ?`,
      [id]
    );

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Get event participants
    const [participants] = await pool.execute(
      `SELECT 
        ep.*,
        u.name as user_name,
        u.email as user_email
      FROM event_participants ep
      LEFT JOIN users u ON ep.user_id = u.id
      WHERE ep.event_id = ?`,
      [id]
    );

    const event = events[0];
    event.participants = participants;

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event'
    });
  }
});

// Create event
router.post('/', requireLeader, [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required and must be less than 200 characters'),
  body('description').optional().trim(),
  body('event_date').isISO8601().withMessage('Valid event date is required'),
  body('duration_minutes').optional().isInt({ min: 15, max: 1440 }).withMessage('Duration must be between 15 and 1440 minutes'),
  body('location').optional().trim(),
  body('event_type').optional().isIn(['meeting', 'deadline', 'celebration', 'other']).withMessage('Invalid event type'),
  body('is_all_day').optional().isBoolean().withMessage('is_all_day must be a boolean'),
  body('participants').optional().isArray().withMessage('Participants must be an array')
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
      event_date, 
      duration_minutes = 60,
      location,
      event_type = 'meeting',
      is_all_day = false,
      participants = []
    } = req.body;

    // Check if event date is not in the past
    if (new Date(event_date) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Event date cannot be in the past'
      });
    }

    // Create event
    const [result] = await pool.execute(
      `INSERT INTO events (title, description, event_date, duration_minutes, location, event_type, is_all_day, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, event_date, duration_minutes, location, event_type, is_all_day, req.user.id]
    );

    const eventId = result.insertId;

    // Add participants if provided
    if (participants.length > 0) {
      const participantValues = participants.map(userId => [eventId, userId]);
      await pool.execute(
        'INSERT INTO event_participants (event_id, user_id) VALUES ?',
        [participantValues]
      );
    }

    // Get created event with details
    const [events] = await pool.execute(
      `SELECT 
        e.*,
        u.name as created_by_name
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = ?`,
      [eventId]
    );

    const event = events[0];

    // Send email notifications to participants
    if (participants.length > 0) {
      try {
        const [users] = await pool.execute(
          'SELECT id, name, email FROM users WHERE id IN (?) AND is_active = 1',
          [participants]
        );

        for (const user of users) {
          await sendEmail(
            user.email,
            'eventReminder',
            {
              userName: user.name,
              eventTitle: title,
              eventDate: event_date,
              location: location
            }
          );
        }
      } catch (emailError) {
        console.error('Failed to send event notification emails:', emailError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event'
    });
  }
});

// Update event
router.put('/:id', requireLeader, [
  body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Title must be less than 200 characters'),
  body('description').optional().trim(),
  body('event_date').optional().isISO8601().withMessage('Valid event date is required'),
  body('duration_minutes').optional().isInt({ min: 15, max: 1440 }).withMessage('Duration must be between 15 and 1440 minutes'),
  body('location').optional().trim(),
  body('event_type').optional().isIn(['meeting', 'deadline', 'celebration', 'other']).withMessage('Invalid event type'),
  body('is_all_day').optional().isBoolean().withMessage('is_all_day must be a boolean')
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
      event_date, 
      duration_minutes,
      location,
      event_type,
      is_all_day 
    } = req.body;

    // Check if event exists
    const [existingEvents] = await pool.execute(
      'SELECT * FROM events WHERE id = ?',
      [id]
    );

    if (existingEvents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if event date is not in the past (if being updated)
    if (event_date && new Date(event_date) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Event date cannot be in the past'
      });
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

    if (event_date !== undefined) {
      updates.push('event_date = ?');
      values.push(event_date);
    }

    if (duration_minutes !== undefined) {
      updates.push('duration_minutes = ?');
      values.push(duration_minutes);
    }

    if (location !== undefined) {
      updates.push('location = ?');
      values.push(location);
    }

    if (event_type !== undefined) {
      updates.push('event_type = ?');
      values.push(event_type);
    }

    if (is_all_day !== undefined) {
      updates.push('is_all_day = ?');
      values.push(is_all_day);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    values.push(id);

    // Update event
    await pool.execute(
      `UPDATE events SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    // Get updated event
    const [updatedEvents] = await pool.execute(
      `SELECT 
        e.*,
        u.name as created_by_name
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvents[0]
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event'
    });
  }
});

// Delete event
router.delete('/:id', requireLeader, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event exists
    const [events] = await pool.execute(
      'SELECT * FROM events WHERE id = ?',
      [id]
    );

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Delete event participants first
    await pool.execute('DELETE FROM event_participants WHERE event_id = ?', [id]);

    // Delete event
    await pool.execute('DELETE FROM events WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event'
    });
  }
});

// Join event
router.post('/:id/join', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event exists
    const [events] = await pool.execute(
      'SELECT * FROM events WHERE id = ?',
      [id]
    );

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is already a participant
    const [participants] = await pool.execute(
      'SELECT id FROM event_participants WHERE event_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (participants.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You are already a participant in this event'
      });
    }

    // Add user as participant
    await pool.execute(
      'INSERT INTO event_participants (event_id, user_id, status) VALUES (?, ?, ?)',
      [id, req.user.id, 'accepted']
    );

    res.json({
      success: true,
      message: 'Successfully joined the event'
    });
  } catch (error) {
    console.error('Join event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join event'
    });
  }
});

// Leave event
router.delete('/:id/join', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is a participant
    const [participants] = await pool.execute(
      'SELECT id FROM event_participants WHERE event_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'You are not a participant in this event'
      });
    }

    // Remove user from participants
    await pool.execute(
      'DELETE FROM event_participants WHERE event_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    res.json({
      success: true,
      message: 'Successfully left the event'
    });
  } catch (error) {
    console.error('Leave event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave event'
    });
  }
});

// Update participant status
router.patch('/:id/participants/:user_id', requireLeader, [
  body('status').isIn(['invited', 'accepted', 'declined', 'maybe']).withMessage('Invalid status')
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

    const { id, user_id } = req.params;
    const { status } = req.body;

    // Check if participant exists
    const [participants] = await pool.execute(
      'SELECT id FROM event_participants WHERE event_id = ? AND user_id = ?',
      [id, user_id]
    );

    if (participants.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    // Update participant status
    await pool.execute(
      'UPDATE event_participants SET status = ? WHERE event_id = ? AND user_id = ?',
      [status, id, user_id]
    );

    res.json({
      success: true,
      message: 'Participant status updated successfully'
    });
  } catch (error) {
    console.error('Update participant status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update participant status'
    });
  }
});

// Get event statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const conditions = [];
    const values = [];

    if (start_date) {
      conditions.push('event_date >= ?');
      values.push(start_date);
    }

    if (end_date) {
      conditions.push('event_date <= ?');
      values.push(end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get event statistics
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_events,
        SUM(CASE WHEN event_type = 'meeting' THEN 1 ELSE 0 END) as meetings,
        SUM(CASE WHEN event_type = 'deadline' THEN 1 ELSE 0 END) as deadlines,
        SUM(CASE WHEN event_type = 'celebration' THEN 1 ELSE 0 END) as celebrations,
        SUM(CASE WHEN event_type = 'other' THEN 1 ELSE 0 END) as other_events
       FROM events ${whereClause}`,
      values
    );

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Get event stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event statistics'
    });
  }
});

module.exports = router;
