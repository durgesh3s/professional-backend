import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
    path: `./env`
})

connectDB()








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