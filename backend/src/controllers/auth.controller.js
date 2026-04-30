import { User } from "../models/user.model.js";
import { catchAsync } from "../utils/catchAsync.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens");
    }
};

export const signupUser = catchAsync(async (req, res) => {
    const { name, email, password, employeeId, department, role } = req.body;

    if ([name, email, password, employeeId].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "Name, email, password, and employeeId are required fields");
    }

    const existedUser = await User.findOne({ 
        $or: [{ email }, { employeeId }] 
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or employeeId already exists");
    }

    const userRole = role ? role.toUpperCase() : "EMPLOYEE";

    const user = await User.create({
        name,
        email,
        password,
        employeeId,
        department,
        role: userRole
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});

export const loginUser = catchAsync(async (req, res) => {
    const { email, password, employeeId } = req.body;

    if (!email && !employeeId) {
        throw new ApiError(400, "Email or Employee ID is required");
    }

    if (!password) {
        throw new ApiError(400, "Password is required");
    }

    const user = await User.findOne({
        $or: [{ email }, { employeeId }]
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    if (!user.isActive) {
        throw new ApiError(403, "Your account has been deactivated. Please contact HR.");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser,
                accessToken,
                refreshToken
            }, "User logged in successfully")
        );
});

export const logoutUser = catchAsync(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"));
});

export const switchRole = catchAsync(async (req, res) => {
    const { role } = req.body;
    
    if (!["EMPLOYEE", "MANAGER", "ADMIN"].includes(role)) {
        throw new ApiError(400, "Invalid role");
    }

    req.user.role = role;
    await req.user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, req.user, `Role successfully switched to ${role}`)
    );
});
export const getAllUsers = catchAsync(async (req, res) => {
    const users = await User.find().select("-password -refreshToken").sort({ createdAt: -1 });
    
    return res.status(200).json(
        new ApiResponse(200, users, "All users fetched successfully")
    );
});
