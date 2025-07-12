const express = require("express");
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const sanitize = require('express-mongo-sanitize');

const tasksRouter = require('./routes/taskRouter');
const authRouter = require("./routes/authRouter");
const usersRouter = require("./routes/userRouter");
const CustomError = require("./utils/customError");
const globalErrorHandler = require("./controllers/errorController");

let app = express();

// Enable CORS for all routes
app.use(cors());

let limiter = rateLimit({
    max: 1000,
    windowMs: 60 * 60 * 1000,
    message: "we have received too many request from this Ip. Please try after one hour"
});

app.use('/api', limiter);
app.use(helmet());

app.use(express.json({ limit: '11kb' }));

app.use(sanitize());


if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use('/api/v1/tasks', tasksRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/auth', authRouter);

app.all('*', (req, res, next) => {
    const err = new CustomError(`can't find ${req.originalUrl} on the server`, 404);
    next(err);
})

app.use(globalErrorHandler);

module.exports = app;

