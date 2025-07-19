const express = require("express"); 

const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController");

const router = express.Router(); 

const upload = require('../middleware/multer');
const { uploadAvatar } = require('../controllers/userController');

router.route("/get-all-users").get(userController.getAllUsers); 
router.route("/update-password").patch(authController.protect,userController.updatePassword); 
router.route("/update-me").patch(authController.protect,userController.updateMe); 

router.post('/upload-avatar', upload.single('avatar'), uploadAvatar);

module.exports = router;