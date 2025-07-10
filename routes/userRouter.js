const express = require("express"); 

const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController");

const router = express.Router(); 

router.route("/get-all-users").get(userController.getAllUsers); 
router.route("/update-password").patch(authController.protect,userController.updatePassword); 
router.route("/update-me").patch(authController.protect,userController.updateMe); 

module.exports = router;