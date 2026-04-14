const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../utils/Upload');
const {
  applyLeave, getMyLeaves, getPendingLeaves, getAllLeaves,
  getLeaveById, updateLeaveStatus, cancelLeave, getLeaveStats
} = require('../controllers/leaveController');

router.use(protect);



router.post('/', protect, upload.single('document'), applyLeave);
router.get('/my', getMyLeaves);
router.get('/stats/:userId?', getLeaveStats);
router.get('/pending', authorize('faculty', 'hod', 'principal', 'admin'), getPendingLeaves);
router.get('/', authorize('admin', 'principal', 'hod'), getAllLeaves);
router.get('/:id', getLeaveById);
router.put('/:id/status', authorize('faculty', 'hod', 'principal', 'admin'), updateLeaveStatus);
router.put('/:id/cancel', cancelLeave);

module.exports = router;
