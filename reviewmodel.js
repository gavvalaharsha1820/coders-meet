const  mongoose  = require("mongoose");

const review=new mongoose.Schema({
    taskprovider:{
        type:String,
        required:true,
    },
    taskworker:{
        type:String,
        required:true,
    },
    rating:{
        type:Number,
        required:true,
    }
})
module.exports =mongoose.model('review',review);