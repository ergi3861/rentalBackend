const AuthService = require('../services/AuthService');

exports.createUser = async (req, res) => {
  try {
    const result = await AuthService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.code || 500).json({ message: err.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const result = await AuthService.login(req.body);
    res.json(result);
  } catch (err) {
    res.status(err.code || 500).json({ message: err.message });
  }
};