// routes/adminRoutes.js
const express      = require('express');
const router       = express.Router();
const { requireAdmin, requireSuperAdmin } = require('../middleware/adminMiddleware');

const dashCtrl     = require('../controllers/admin/adminDashboardController');
const carsCtrl     = require('../controllers/admin/adminCarsControllers');
const resCtrl      = require('../controllers/admin/adminReservationController');
const usersCtrl    = require('../controllers/admin/adminUsersControllers');
const sellCtrl     = require('../controllers/admin/adminSellController');
const auditCtrl    = require('../controllers/admin/adminAuditLogController');
const { getSearchLogs, getTopSearches } = require('../controllers/admin/adminSearchLogController');
const { adminSearch } = require('../controllers/admin/adminSearchController');

router.use(requireAdmin);

router.get('/search', adminSearch);
router.get('/search-logs',     getSearchLogs);
router.get('/search-logs/top', getTopSearches);

// ── DASHBOARD ─────────────────────────────────────────────
router.get('/dashboard/stats',    dashCtrl.getStats);
router.get('/dashboard/chart',    dashCtrl.getChart);
router.get('/dashboard/top-cars', dashCtrl.getTopCars);
router.get('/dashboard/activity', dashCtrl.getRecentActivity);

// ── CARS ──────────────────────────────────────────────────
router.get('/cars',                          carsCtrl.getAll);
router.get('/cars/:id',                      carsCtrl.getById);
router.post('/cars', carsCtrl.upload,        carsCtrl.create);
router.put('/cars/:id',                      carsCtrl.update);
router.delete('/cars/:id',                   carsCtrl.delete);
router.post('/cars/:id/images', carsCtrl.upload, carsCtrl.addImages);
router.delete('/cars/:id/images/:mediaId',   carsCtrl.deleteImage);

// ── RESERVATIONS ──────────────────────────────────────────
router.get('/reservations',                  resCtrl.getAll);
router.get('/reservations/stats/monthly',    resCtrl.getMonthlyStats);
router.get('/reservations/:id',              resCtrl.getById);
router.patch('/reservations/:id/status',     resCtrl.updateStatus);

// ── USERS ─────────────────────────────────────────────────
router.get('/users',                         usersCtrl.getAll);
router.get('/users/:id',                     usersCtrl.getById);
router.patch('/users/:id/role',              usersCtrl.updateRole);
router.delete('/users/:id',                  usersCtrl.delete);
router.post('/users/admin', requireSuperAdmin, usersCtrl.createAdmin);

// ── SELL REQUESTS ─────────────────────────────────────────
router.get('/sell-requests',                 sellCtrl.getAll);
router.get('/sell-requests/:id',             sellCtrl.getById);
router.patch('/sell-requests/:id/status',    sellCtrl.updateStatus);
router.delete('/sell-requests/:id',          sellCtrl.delete);

// ── CONTACTS ──────────────────────────────────────────────
router.get('/contacts', async (req, res) => {
  try {
    const db = require('../config/db');
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const [countResult, dataResult] = await Promise.all([
      db.query('SELECT COUNT(*) as total FROM contacts'),
      db.query(
        'SELECT * FROM contacts ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [Number(limit), Number(offset)]
      )
    ]);

    res.json({
      total: countResult[0][0]?.total || 0,
      rows:  dataResult[0],
    });
  } catch (err) {
    console.error('❌ Contact error:', err.message);
    res.status(500).json({ message: 'Gabim' });
  }
});

// ── AUDIT LOGS ────────────────────────────────────────────
// Renditja e rëndësishme: /entity/:entity/:entityId dhe /purge
// duhet të vijnë PARA /:id, përndryshe Express i trajton si id.
router.get('/audit-logs',                              auditCtrl.getAll);
router.get('/audit-logs/entity/:entity/:entityId',     auditCtrl.getByEntity);
router.delete('/audit-logs/purge', requireSuperAdmin,  auditCtrl.purge);
router.get('/audit-logs/:id',                          auditCtrl.getById);

module.exports = router;