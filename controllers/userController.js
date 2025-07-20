const User = require('../models/userModel');
const asyncErrorHandler = require('./../utils/asyncErrorHandler');
const jwt = require('jsonwebtoken');
const CustomError = require('./../utils/customError');
const util = require('util');
const authController = require('./authController');
const uploadToCloudinary = require('../utils/uploadToCloudinary');

exports.getAllUsers = asyncErrorHandler(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        status: "success",
        result: users.length,
        data: {
            users
        }
    })
})

const filterReqObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(prop => {
        if (allowedFields.includes(prop)) {
            newObj[prop] = obj[prop];
        }
    })
    return newObj;
}


exports.updatePassword = asyncErrorHandler(async (req, res, next) => {
    //GET CURRENT USER DATA FROM DATABASE 
    const user = await User.findById(req.user._id).select('+password');


    //CHECK IF THE SUPPLIED CURRENT PASSWORD CORRECT 
    if (!(await user.comparePasswordInDb(req.body.currentPassword, user.password))) {
        return next(new CustomError('The current password you provide is wrong', 401));
    }

    //IF SUPPLIED PASSWORD IS CORRECT, UPDATE USE PASSWORD WITH NEW VALUE 
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    await user.save();

    // LOGIN USER & SEND JWT
    authController.createSendResponse(user, 200, res);
})



exports.updateMe = asyncErrorHandler(async (req, res, next) => {

    //1. CHECK IF REQUEST DATA CONTAIN PASSOWWRD | CONFIRM PASSWORD
    if (req.body.password || req.body.confirmPassword) {
        return next(new CustomError('You cannot update your password using this endpoint', 400));
    }


    //2. UPDATE USER DETAIL
    const filterObj = filterReqObj(req.body, 'name', 'email');
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filterObj, { runValidators: true, new: true });
    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });


})

exports.uploadAvatar = async (req, res) => {
  
    try {
      const { files } = await parseForm(req);
  
      if (!files.length) return res.status(400).json({ error: 'No file uploaded' });
  
      const { stream, info } = files[0];           
      const publicId        = `${req.user.id}-${Date.now()}`; 
  
      const uploaded = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'avatars', public_id: publicId, resource_type: 'auto' },
          (err, result) => (err ? reject(err) : resolve(result))
        ).end(stream.read() ?? stream);
      });
  
      await User.findByIdAndUpdate(req.user.id, { avatar: uploaded.secure_url });
  
      res.status(200).json({ url: uploaded.secure_url, public_id: uploaded.public_id });
    } catch (err) {
      console.error('[avatar upload]', err);
      res.status(500).json({ error: err.message });
    }
  };