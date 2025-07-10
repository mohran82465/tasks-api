const Task = require("./../models/taskModel");
const ApiFeatures = require("./../utils/ApiFeatures");
const asyncErrorHandler = require("./../utils/asyncErrorHandler");
const CustomError = require("./../utils/customError");


exports.getAllTasks = asyncErrorHandler(async (req, res, next) => {
    const features = new ApiFeatures(Movie.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const tasks = await features.query;

    res.status(200).json({
        status: 'success',
        length: tasks.length,
        data: {
            tasks
        }
    })
});

exports.getTask = asyncErrorHandler(async (req,res,next)=>{
    
    const task = await Task.findById(req.params.id); 

    if(!task){
        const error = new CustomError('Task with that ID is not found',404); 
        return next(error); 
    }

    res.status(200).json({
        status: 'success', 
        data: {
            task
        }
    })
})

exports.createTask = asyncErrorHandler(async (req,res,next)=>{
    const task = await Task.create(req.body); 
    res.status(201).json({
        status:'success', 
        data:{
            task
        }
    }); 
})

exports.updateTask = asyncErrorHandler(async (req,res,next)=>{
    const updateTask = await Task.findByIdAndUpdate(req.params.id, req.body,{new:true, runValidators:true}); 
    
    if(!updateTask){
        const error = new CustomError('Task with that ID is not found',404); 
        return next(error); 
    }

    res.status(200).json({
        status:"success", 
        data:{
            task:updateTask
        }
    })
})


exports.deleteTask = asyncErrorHandler(async (req,res,next)=>{
    const deleteTask = await Task.findByIdAndDelete(req.params.id); 
    if(! deleteTask){
        const error = new CustomError('Task with that ID is not found',404); 
        return next(error); 
    }
    res.status(204).json({
        status: 'success', 
        data: {
            task:null
        }
    })
})