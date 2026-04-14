const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getDepartments, createDepartment, updateDepartment, deleteDepartment } = require('../controllers/departmentController');

router.use(protect);
router.get('/', getDepartments);
router.post('/', authorize('admin'), createDepartment);
router.put('/:id', authorize('admin'), updateDepartment);
router.delete('/:id', authorize('admin'), deleteDepartment);

module.exports = router;
