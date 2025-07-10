const mongoose = require('mongoose');
const taskSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, ' Name is a require field'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    duration: {
        type: Number,
        required: true
    },
    priority: {
        type: Number,
        min: 1,
        max: 5,
        default: 1,
    },
    compelete: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    }

}, { timestamps: true })

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;

