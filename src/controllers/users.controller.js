import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false})
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating Access and Refresh Token")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation -> not empty 
    // check user is already exists: username, email
    // check for coverImages, check for avatar
    // upload then to cloudinary, avatar
    // create user object -> create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return result
    

    // ---> 1. get user details from frontend
    const {fullName, email, username, password} = req.body
    // console.log("email: ", email);


    // ---> 2. validation -> not empty
    if([fullName, email, username, password].some((field)=>field?.trim()==="")){
        throw new ApiError(400, "All fields are required!")
    }


    // ---> 3. check user is already exists: username, email
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exist")
    }


    // ---> 4. check for coverImages, check for avatar
    const avatarLoacalPath = req.files?.avatar[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if(!avatarLoacalPath){
        throw new ApiError(400, "Avatar file is required")
    }


    // ---> 5. upload then to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLoacalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }


    // ---> 6. create user object -> create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // ---> 7. remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )


    // ---> 8. check for user creation
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering user")
    }



    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

})

const loginUser = asyncHandler( async (req, res) => {
    // req body --> Data
    const {email, username, password} = req.body

    // username or email
    if(!(username || email)){
        throw new ApiError(400, "username or email is required")
    }


    // find the username
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    // check password
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials")
    }

    // access refresh token
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options ={
        httpOnly: true,
        secure: true
    }
    

    // send cookies 
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json( new ApiResponse(200, {user: loggedInUser, accessToken, refreshToken}, "User logged in successfully"))
})

const logoutUser = asyncHandler(async (req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined 
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json( new ApiResponse(200, {}, "User LoggedOut"))
})

const refreshAccessToken = asyncHandler(async (req, res) =>{
    const incommingRefreshToken = req.cookie.refreshToken || req.body.refreshToken
    if(!incommingRefreshToken){
        throw new ApiError(401, "Unauthorize request")
    }
    try {
        const decodedToken = jwt.verify(
            incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }
        if(incommingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh Token is Expired or Used")
        }
        const options={
            httpOnly: true,
            secure: true
        }
        const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: new RefreshToken},
                "AccessToken Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh Token")
    }
})
export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}