const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../controllers/auth');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/addaccount', auth.checkLogin, auth.checkUser, userController.addAccount);
router.post('/getaccount', auth.checkLogin, auth.checkUser, userController.getAccount);

module.exports = router;
