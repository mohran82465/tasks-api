const dotenv = require('dotenv');
dotenv.config({ path: './config.env' })
const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
    console.log(err.name, err.message, err.stack);
    console.log('Uncaught Exception occured! Shutting down...');
    process.exit(1);
})

const app = require('./app');

mongoose.connect(process.env.CONN_STR).then(
    (conn) => {
        console.log("DB Connection Successful");
    }
)

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
    console.log(`Server started on port ${port}`);
})

process.on('unhandledRejection', (err) => {
    console.log(err.name, err.message);
    console.log('Unhandled rejection occured! Shutting down...');

    server.close(() => {
        process.exit(1);
    })
})
