const express = require('express');
const { pool } = require('../config/database');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// List communities current admin manages (or all if query says otherwise in future)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { adminOnly = 'true' } = req.query;

    if (adminOnly === 'true') {
      const [rows] = await pool.execute(
        `SELECT c.*, (
            SELECT COUNT(1) FROM users u2 WHERE u2.community_id = c.id
         ) AS member_count
         FROM communities c
         INNER JOIN users u ON u.community_id = c.id AND u.id = ? AND u.role = 'admin'
         ORDER BY c.created_at DESC`,
        [req.user.id]
      );
      return res.json({ success: true, data: rows });
    }

    // Fallback: communities visible to the user (any membership)
    const [rows] = await pool.execute(
      `SELECT DISTINCT c.* FROM communities c
       INNER JOIN users u ON u.community_id = c.id AND u.id = ?
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get communities error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch communities' });
  }
});

// Get community details (admin only for that community)
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Ensure requester is admin of the community
    const [adminRows] = await pool.execute(
      `SELECT id FROM users WHERE id = ? AND community_id = ? AND role = 'admin'`,
      [req.user.id, id]
    );
    if (adminRows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not an admin of this community' });
    }

    const [rows] = await pool.execute(
      `SELECT c.*, (
          SELECT COUNT(1) FROM users u2 WHERE u2.community_id = c.id
       ) AS member_count
       FROM communities c WHERE c.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Get community error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch community' });
  }
});

// Get community members (admin only)
router.get('/:id/members', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [adminRows] = await pool.execute(
      `SELECT id FROM users WHERE id = ? AND community_id = ? AND role = 'admin'`,
      [req.user.id, id]
    );
    if (adminRows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not an admin of this community' });
    }

    const [rows] = await pool.execute(
      `SELECT id, name, email, role, is_active, join_date, total_points
       FROM users WHERE community_id = ? ORDER BY created_at DESC`,
      [id]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get community members error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch community members' });
  }
});

// Get community tasks (admin only)
router.get('/:id/tasks', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [adminRows] = await pool.execute(
      `SELECT id FROM users WHERE id = ? AND community_id = ? AND role = 'admin'`,
      [req.user.id, id]
    );
    if (adminRows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not an admin of this community' });
    }

    const [rows] = await pool.execute(
      `SELECT 
         t.*, 
         u1.name AS assigned_by_name,
         u2.name AS assigned_to_name
       FROM tasks t
       LEFT JOIN users u1 ON t.assigned_by = u1.id
       LEFT JOIN users u2 ON t.assigned_to = u2.id
       WHERE t.community_id = ?
       ORDER BY t.created_at DESC`,
      [id]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get community tasks error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch community tasks' });
  }
});

module.exports = router;


