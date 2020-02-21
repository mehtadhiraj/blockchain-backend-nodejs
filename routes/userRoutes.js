const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../controllers/auth');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// Add account routes
router.post('/addaccount', auth.checkLogin, auth.checkUser, userController.addAccount);
router.post('/getaccount', auth.checkLogin, auth.checkUser, userController.getAccount);

// Initiate transaction
router.post('/transaction', auth.checkLogin, auth.checkUser, userController.initiateTransaction);
module.exports = router;
