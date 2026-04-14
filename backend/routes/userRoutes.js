// userRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getAllUsers, getUserById, createUser, updateUser, toggleUserStatus, resetLeaveBalance } = require('../controllers/userController');

router.use(protect);
router.get('/', authorize('admin', 'principal', 'hod', 'faculty'), getAllUsers);
router.post('/', authorize('admin'), createUser);
router.put('/reset-balance', authorize('admin'), resetLeaveBalance);
router.get('/:id', getUserById);
router.put('/:id', authorize('admin'), updateUser);
router.patch('/:id/toggle', authorize('admin'), toggleUserStatus);

module.exports = router;
