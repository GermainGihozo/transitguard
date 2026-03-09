const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Get notifications for current user
router.get(
  '/',
  authMiddleware,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 20;
      const unreadOnly = req.query.unread === 'true';
      
      let whereClause = 'WHERE (user_id = ? OR user_id IS NULL)';
      if (unreadOnly) {
        whereClause += ' AND is_read = FALSE';
      }
      
      const [notifications] = await db.execute(
        `SELECT * FROM notifications 
         ${whereClause}
         ORDER BY created_at DESC 
         LIMIT ?`,
        [userId, limit]
      );
      
      // Get unread count
      const [countResult] = await db.execute(
        `SELECT COUNT(*) as unread_count 
         FROM notifications 
         WHERE (user_id = ? OR user_id IS NULL) AND is_read = FALSE`,
        [userId]
      );
      
      res.json({
        notifications,
        unread_count: countResult[0].unread_count
      });
    } catch (error) {
      next(error);
    }
  }
);

// Mark notification as read
router.put(
  '/:id/read',
  authMiddleware,
  async (req, res, next) => {
    try {
      const notificationId = req.params.id;
      const userId = req.user.id;
      
      await db.execute(
        `UPDATE notifications 
         SET is_read = TRUE 
         WHERE id = ? AND (user_id = ? OR user_id IS NULL)`,
        [notificationId, userId]
      );
      
      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      next(error);
    }
  }
);

// Mark all notifications as read
router.put(
  '/read-all',
  authMiddleware,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      await db.execute(
        `UPDATE notifications 
         SET is_read = TRUE 
         WHERE (user_id = ? OR user_id IS NULL) AND is_read = FALSE`,
        [userId]
      );
      
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }
);

// Delete notification
router.delete(
  '/:id',
  authMiddleware,
  async (req, res, next) => {
    try {
      const notificationId = req.params.id;
      const userId = req.user.id;
      
      await db.execute(
        `DELETE FROM notifications 
         WHERE id = ? AND (user_id = ? OR user_id IS NULL)`,
        [notificationId, userId]
      );
      
      res.json({ message: 'Notification deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// Create notification (admin only)
router.post(
  '/',
  authMiddleware,
  roleMiddleware('super_admin'),
  async (req, res, next) => {
    try {
      const { title, message, type, user_id, link } = req.body;
      
      const [result] = await db.execute(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES (?, ?, ?, ?, ?)`,
        [user_id || null, title, message, type || 'info', link || null]
      );
      
      res.status(201).json({
        message: 'Notification created',
        notification_id: result.insertId
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
