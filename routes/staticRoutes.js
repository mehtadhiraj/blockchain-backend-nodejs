const express = require('express');
const router = express.Router();
const staticController = require('../controllers/staticController');

router.get('/', staticController.home);
router.post('/login', staticController.login);
router.post('/register', staticController.register);
module.exports = router;
