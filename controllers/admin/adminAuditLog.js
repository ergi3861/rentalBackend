const AuditLog = require('../../models/auditLog');

/**
 * GET /admin/audit-logs
 * Query params: page, limit, adminId, action, entity, entityId, from, to
 */
const getAll = async (req, res) => {
  try {
    const {
      page     = 1,
      limit    = 50,
      adminId,
      action,
      entity,
      entityId,
      from,
      to,
    } = req.query;

    const result = await AuditLog.getAll({
      page:     Number(page),
      limit:    Number(limit),
      adminId:  adminId  ? Number(adminId)  : undefined,
      entityId: entityId ? Number(entityId) : undefined,
      action,
      entity,
      from,
      to,
    });

    res.json(result);
  } catch (err) {
    console.error('[AuditLog] getAll error:', err.message);
    res.status(500).json({ message: 'Gabim gjatë marrjes së audit logs.' });
  }
};

/**
 * GET /admin/audit-logs/:id
 * Kthen log-un e vetëm me diff të detajuar (from → to për çdo fushë).
 */
const getById = async (req, res) => {
  try {
    const log = await AuditLog.getById(Number(req.params.id));
    if (!log) return res.status(404).json({ message: 'Log nuk u gjet.' });
    res.json(log);
  } catch (err) {
    console.error('[AuditLog] getById error:', err.message);
    res.status(500).json({ message: 'Gabim gjatë marrjes së log-ut.' });
  }
};

/**
 * GET /admin/audit-logs/entity/:entity/:entityId
 * Historiku i plotë i një entiteti të caktuar (p.sh. /entity/users/42).
 */
const getByEntity = async (req, res) => {
  try {
    const { entity, entityId } = req.params;
    const logs = await AuditLog.getByEntity(entity, Number(entityId));
    res.json({ total: logs.length, rows: logs });
  } catch (err) {
    console.error('[AuditLog] getByEntity error:', err.message);
    res.status(500).json({ message: 'Gabim gjatë marrjes së historikut.' });
  }
};

/**
 * DELETE /admin/audit-logs/purge
 * Fshin logs më të vjetra se ?days= ditë. Vetëm superAdmin.
 * Body ose query: { days: 90 }
 */
const purge = async (req, res) => {
  try {
    const days    = Number(req.query.days ?? req.body?.days ?? 90);
    const deleted = await AuditLog.purge(days);
    res.json({ message: `U fshinë ${deleted} logs më të vjetra se ${days} ditë.`, deleted });
  } catch (err) {
    console.error('[AuditLog] purge error:', err.message);
    res.status(500).json({ message: 'Gabim gjatë pastrimit të logs.' });
  }
};

module.exports = { getAll, getById, getByEntity, purge };