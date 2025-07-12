const User = require("../models/userModel");
const asyncErrorHandler = require("./../utils/asyncErrorHandler");
const jwt = require('jsonwebtoken');
const CustomError = require("./../utils/customError");
const util = require('util');
const crypto = require('crypto');

// Basic email sending function (you may want to implement proper email service later)
const sendEmail = async (options) => {
    // For now, just log the email details
    console.log('Email would be sent:', options);
    // TODO: Implement actual email sending logic (e.g., using nodemailer)
};


const signToken = (user) => {
    return jwt.sign({ id: user._id, name: user.name, avatar: user.avatar }, process.env.SECRET_STR, {
        expiresIn: process.env.LOGIN_EXPIRES
    });
}

// Helper function to convert time string to milliseconds
const convertTimeToMs = (timeStr) => {
    const unit = timeStr.slice(-1);
    const value = parseInt(timeStr.slice(0, -1));

    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return value * 1000;
    }
};

exports.createSendResponse = (user, statusCode, res) => {
    const token = signToken(user);
    const options = {
        maxAge: convertTimeToMs(process.env.LOGIN_EXPIRES),
        httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax',
 	path: '/',
    }

   

    res.cookie('jwt', token, options);
    user.password = undefined;
    res.status(statusCode).json({
        status: "success",
        data: {
            message: "successful login",
        }
    })

}

exports.signup = asyncErrorHandler(async (req, res, next) => {
    const existingUser = await User.findne({ email: req.body.email }).select('+active');

    if (existingUser) {
        if (existingUser.active === false) {
            existingUser.name = req.body.name;
            existingUser.password = req.body.password;
            existingUser.confirmPassword = req.body.confirmPassword;
            existingUser.photo = req.body.photo || existingUser.photo;
            existingUser.active = true;
            await existingUser.save();

            return createSendResponse(existingUser, 200, res);
        } else {
            return next(new CustomError('Email is already in use', 400));
        }
    }



    const newUser = await User.create(req.body);


    this.createSendResponse(newUser, 201, res);

})

exports.login = asyncErrorHandler(async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
        const error = new CustomError("Please provide email & password for login ", 400);
        return next(error);
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePasswordInDb(password, user.password))) {
        const error = new CustomError('Incorrect email or password', 400);
        return next(error);
    }

    this.createSendResponse(user, 200, res);

})


exports.protect = asyncErrorHandler(async (req, res, next) => {
    //1. read the token & check if it exist
    const testToken = req.headers.authorization;
    let token;
    if (testToken && testToken.startsWith('Bearer')) {
        token = testToken.split(' ')[1];
    }
    if (!token) {
        next(new CustomError('You are not logged in!', 401));
    }


    //2. validate the token
    const decodedToken = await util.promisify(jwt.verify)(token, process.env.SECRET_STR);


    //3. if the user exists
    const user = await User.findById(decodedToken.id)

    if (!user) {
        const error = new CustomError('The use with given token does not exist', 401);
        next(error);
    }

    //4. if the user changed password after the token was issued 
    const isPasswordChanged = await user.isPasswordChanged(decodedToken.iat);
    if (isPasswordChanged) {
        const error = new CustomError('The password has been changed recently. please login again', 401);
        return next(error)
    }

    //5. Allow user to access route
    req.user = user;
    next();

});



exports.restrict = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role) {
            const error = new CustomError('You do not have permission to perform this action', 403);
            next(error)
        }
        next()
    }
}



exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
    //1. GET USER BASED ON POSTED EMAIL
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        const error = new CustomError('We could not find the user with given email', 404);
        next(error);
    }
    //2. GENERATE A RANDOM RESET TOKEN
    const resetToken = user.createResetPasswordToken();


    await user.save({ validateBeforeSave: false });

    //3. SEND THE TOKEN BACK TO THE USER EMAIL
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resetToken}`;
    const message = `We have recevied a password reset request. Please use the below link to reset your password\n\n ${resetUrl}\n\n This reset password link will be vaild only for 10 minutes.`;
    try {

        await sendEmail({
            email: user.email,
            subject: 'Password change request received',
            message: message
        })

        res.status(200).json({
            status: 'success',
            message: 'password reset link send to the user email'
        })
    } catch (error) {
        console.error('Email sending failed:', error); // <--- Add this
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new CustomError('There was an error sending password reset email please try again later', 500));
    }
});



exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
    const token = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ passwordResetToken: token, passwordResetTokenExpires: { $gte: Date.now() } });
    if (!user) {
        const error = new CustomError('Token is invalid or has expired!', 400);
        next(error);
    }
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.passwordChangedAt = Date.now();
    user.save();



    this.createSendResponse(user, 200, res);

})
