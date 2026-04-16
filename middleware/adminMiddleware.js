const jwt = require("jsonwebtoken");

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Kërkohet autentikim" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin" && decoded.role !== "superadmin") {
      return res.status(403).json({ message: "Nuk keni leje admin" });
    }

    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Token i pavlefshëm" });
  }
}

function requireSuperAdmin(req, res, next) {
  if (req.admin?.role !== "superadmin") {
    return res.status(403).json({ message: "Vetëm superadmin ka këtë leje" });
  }
  next();
}

module.exports = { requireAdmin, requireSuperAdmin };