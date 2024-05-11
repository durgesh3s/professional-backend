import dotenv from "dotenv";
import connectDB from "./db/index.js";
import express from "express";

const app = express();

dotenv.config({
    path: `./env`
})

connectDB()
.then(()=>{
    app.on("Error", (error)=>{
        console.log("Error: ", error);
        throw error
    })
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`App is running at PORT: ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log("MongoDB connection Failed !!!", error);
    throw error
})








/*


import mongoose from "mongoose";
import express from "express";
import { DB_NAME } from "./constants.js"
import dotenv from "dotenv";

const app = express();

( async()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error)=>{
            console.log("error", error);
            throw error
        })
        app.listen(process.env.PORT, ()=>{
            console.log(`App is listening on PORT ${process.env.PORT}`);
        })
    }catch(error){
        console.error("Error", error);
        throw error
    }
})()


*/