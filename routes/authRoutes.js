const express = require('express');
const router  = express.Router();

const authController       = require('../controllers/authController');
const validationMiddleware = require('../middleware/validationMiddleware');

router.get("/test", (req, res) => res.send("auth route working"));

router.post('/signup',
  validationMiddleware(['firstName', 'lastName', 'email', 'password']),
  authController.createUser
);

router.post('/login',
  validationMiddleware(['email', 'password']),
  authController.loginUser
);

module.exports = router;