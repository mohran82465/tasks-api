class CustomError extends Error {
    constructor(message,stateCode){
        super(message); 
        this.stateCode = stateCode ;
        this.status = stateCode >= 400 && stateCode < 500 ? 'fail' : 'error'; 
        this.isOperational = true ; 
        Error.captureStackTrace(this, this.constructor) ; 
    }
}
module.exports = CustomError ;