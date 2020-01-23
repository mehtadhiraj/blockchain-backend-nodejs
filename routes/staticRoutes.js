const express = require('express');
const router = express.Router();
const staticController = require('../controllers/staticController');

router.get('/', staticController.home);
router.post('/login', staticController.login);

module.exports = router;
