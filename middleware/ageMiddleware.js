const db = require('../config/db');

const checkAge = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT date_of_birth FROM users WHERE id = ?', [req.user.id]
    );
    const dob = rows[0]?.date_of_birth;
    if (dob) {
      const age = Math.floor((Date.now() - new Date(dob)) / 31557600000);
      if (age < 20) {
        return res.status(403).json({
          message: 'Duhet të jeni të paktën 20 vjeç për të bërë rezervime ose kërkesa.',
          min_age: 20,
          your_age: age
        });
      }
    }
    next();
  } catch (err) {
    next();
  }
};

module.exports = checkAge;