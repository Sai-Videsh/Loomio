const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Create community + admin
router.post('/communities',
  [
    body('community_name').trim().isLength({ min: 2, max: 150 }),
    body('name').trim().isLength({ min: 2, max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { community_name, name, email, password } = req.body;

      // Generate unique community code
      const code = Math.random().toString(36).slice(2, 10).toUpperCase();

      // Ensure email not used in any community? We scope per community, so allow duplicates across communities.
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create community
      const [commResult] = await pool.execute(
        'INSERT INTO communities (name, code) VALUES (?, ?)',
        [community_name, code]
      );
      const communityId = commResult.insertId;

      // Create admin user inside community
      const [userResult] = await pool.execute(
        'INSERT INTO users (community_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [communityId, name, email, passwordHash, 'admin']
      );

      // Update community creator
      await pool.execute('UPDATE communities SET created_by = ? WHERE id = ?', [userResult.insertId, communityId]);

      // JWT with community context
      const token = jwt.sign(
        { userId: userResult.insertId, email, role: 'admin', communityId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'Community created successfully',
        data: {
          community: { id: communityId, name: community_name, code },
          user: { id: userResult.insertId, name, email, role: 'admin', community_id: communityId },
          token
        }
      });
    } catch (error) {
      console.error('Create community error:', error);
      res.status(500).json({ success: false, message: 'Failed to create community' });
    }
  }
);

// Register (join existing community)
router.post('/register',
  [
    body('community_code').trim().isLength({ min: 6, max: 16 }).withMessage('Community code is required'),
    body('name').trim().isLength({ min: 2, max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { community_code, name, email, password, role = 'member' } = req.body;

      // Find community
      const [comms] = await pool.execute('SELECT id FROM communities WHERE code = ?', [community_code]);
      if (comms.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid community code' });
      }
      const communityId = comms[0].id;

      // Unique email within community
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE community_id = ? AND email = ?',
        [communityId, email]
      );
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: 'Email already used in this community' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const [result] = await pool.execute(
        'INSERT INTO users (community_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [communityId, name, email, passwordHash, role]
      );

      const [users] = await pool.execute(
        'SELECT id, community_id, name, email, role, join_date, total_points FROM users WHERE id = ?',
        [result.insertId]
      );
      const user = users[0];

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role, communityId: user.community_id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(201).json({ success: true, message: 'User registered', data: { user, token } });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ success: false, message: 'Failed to register user' });
    }
  }
);

// Login requires community_code
router.post('/login',
  [
    body('community_code').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { community_code, email, password } = req.body;

      const [comms] = await pool.execute('SELECT id FROM communities WHERE code = ?', [community_code]);
      if (comms.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid community code or credentials' });
      }
      const communityId = comms[0].id;

      const [users] = await pool.execute(
        'SELECT id, community_id, name, email, password_hash, role, join_date, total_points, is_active FROM users WHERE community_id = ? AND email = ?',
        [communityId, email]
      );

      if (users.length === 0 || !users[0].is_active) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const user = users[0];
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      delete user.password_hash;

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role, communityId: user.community_id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({ success: true, message: 'Login successful', data: { user, token } });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Failed to login' });
    }
  }
);

module.exports = router;