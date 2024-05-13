import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export { 
    registerUser,
}