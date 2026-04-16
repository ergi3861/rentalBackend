const AdminUsersService = require('../../services/adminUserService');
const AuditLog          = require('../../models/auditLog');

exports.getAll = async (req, res) => {
  try {
    const data = await AdminUsersService.getAll(req.query);
    res.json(data);
  } catch (err) {
    console.error("❌ Adminuser error:", err.message); 
    res.status(500).json({ message: "Gabim" });
  }
};

exports.getById = async (req, res) => {
  try {
    const user = await AdminUsersService.getById(req.params.id);
    if (!user) return res.status(404).json({ message: "Useri nuk u gjet" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Gabim" });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    await AdminUsersService.updateRole(req.params.id, role, req.admin.role);
    await AuditLog.log({
      adminId:    req.admin.id,
      action:     'user_role_changed',
      targetType: 'user',
      targetId:   req.params.id,
      details:    { role },
    });
    res.json({ message: 'Roli u ndryshua' });
  } catch (err) {
    res.status(err.code || 500).json({ message: err.message || "Gabim" });
  }
};

exports.delete = async (req, res) => {
  try {
    await AdminUsersService.delete(req.params.id);
    await AuditLog.log({
      adminId:    req.admin.id,
      action:     'user_deleted',
      targetType: 'user',
      targetId:   req.params.id,
    });
    res.json({ message: 'Useri u fshi' });
  } catch (err) {
    res.status(500).json({ message: "Gabim" });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const id = await AdminUsersService.createAdmin(req.body);
    await AuditLog.log({
      adminId:    req.admin.id,
      action:     'admin_created',
      targetType: 'user',
      targetId:   id,
      details:    { email: req.body.email, role: req.body.role },
    });
    res.status(201).json({ message: 'Admin u krijua', id });
  } catch (err) {
    res.status(err.code || 500).json({ message: err.message || "Gabim" });
  }
};