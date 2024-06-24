import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
    // extract data 
    const {email, fullName, username, password} = req.body

    // validates
    if(
        [email, fullName, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError("All fields are required!!")
    }

    // check if user already exists or not on the basis of username & email
    const existedUser = User.findOne(
        {
            $or: [{ username }, { email }]
        }
    )
    if(existedUser){
        throw new ApiError(409, "User with username or email already exists")
    }

    // avatar and coverImage files local path
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required!!")
    }

    // upload avatar and coverImage in clodinary..
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required!!")
    }

    // create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase(),
        email,
        password
    })

    // remove password and refreshToken field from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // return response.
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully!!")
    )

})

export {registerUser}