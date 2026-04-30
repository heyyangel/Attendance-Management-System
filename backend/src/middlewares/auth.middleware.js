import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { User } from "../models/user.model.js";

export const verifyJWT = catchAsync(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            throw new ApiError(401, "Unauthorized request: No token provided");
        }
    
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});

export const restrictTo = (...roles) => {
    return (req, res, next) => {    
        const userRole = req.user.role?.toUpperCase();
        if (!roles.map(r => r.toUpperCase()).includes(userRole)) {
            return next(new ApiError(403, "You do not have permission to perform this action"));
        }
        next();
    };
};
