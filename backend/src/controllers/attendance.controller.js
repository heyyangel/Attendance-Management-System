import { Attendance } from "../models/attendance.model.js";
import { User } from "../models/user.model.js";
import { catchAsync } from "../utils/catchAsync.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getTodayBounds = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

export const punchIn = catchAsync(async (req, res) => {
    const { start, end } = getTodayBounds();

    await Attendance.updateMany(
        {
            user: req.user._id,
            date: { $lt: start },
            punchOutTime: { $exists: false }
        },
        {
            $set: {
                shiftStatus: "INCOMPLETE",
                workingHours: 0
            }
        }
    );

    const existingRecord = await Attendance.findOne({
        user: req.user._id,
        date: { $gte: start, $lte: end }
    });

    if (existingRecord) {
        throw new ApiError(400, "You have already punched in today");
    }

    const { latitude, longitude, locationName, image } = req.body;
    
    if (!latitude || !longitude) {
        throw new ApiError(400, "Location (latitude, longitude) is required");
    }

    if (!image) {
        throw new ApiError(400, "Selfie image is required to punch in");
    }

    const newAttendance = await Attendance.create({
        user: req.user._id,
        date: new Date(),
        punchInTime: new Date(),
        status: "PRESENT",
        punchInLocation: {
            latitude,
            longitude,
            locationName
        },
        punchInImage: image
    });

    return res.status(201).json(
        new ApiResponse(201, newAttendance, "Punched in successfully")
    );
});

export const punchOut = catchAsync(async (req, res) => {
    const { start, end } = getTodayBounds();

    const record = await Attendance.findOne({
        user: req.user._id,
        date: { $gte: start, $lte: end }
    });

    if (!record) {
        throw new ApiError(400, "You haven't punched in today yet. Please punch in first.");
    }

    if (record.punchOutTime) {
        throw new ApiError(400, "You have already punched out today.");
    }

    const { latitude, longitude, locationName, image } = req.body;

    if (!latitude || !longitude) {
        throw new ApiError(400, "Location (latitude, longitude) is required to punch out");
    }

    if (!image) {
        throw new ApiError(400, "Selfie image is required to punch out");
    }

    record.punchOutTime = new Date();
    record.punchOutLocation = { latitude, longitude, locationName };
    record.punchOutImage = image;
    
    const diffMs = record.punchOutTime - record.punchInTime;
    const diffHrs = diffMs / (1000 * 60 * 60);
    record.workingHours = parseFloat(diffHrs.toFixed(2));

    if (record.workingHours >= 8) {
        record.shiftStatus = "COMPLETED";
    } else {
        record.shiftStatus = "INCOMPLETE";
    }

    await record.save();

    return res.status(200).json(
        new ApiResponse(200, record, "Punched out successfully")
    );
});

export const getMyAttendance = catchAsync(async (req, res) => {
    const records = await Attendance.find({ user: req.user._id })
        .sort({ date: -1 });

    return res.status(200).json(
        new ApiResponse(200, records, "Attendance records fetched successfully")
    );
});

export const getAllAttendance = catchAsync(async (req, res) => {
    const records = await Attendance.find()
        .populate("user", "name email employeeId department role")
        .sort({ date: -1 });

    return res.status(200).json(
        new ApiResponse(200, records, "All attendance records fetched")
    );
});

export const getTodayStatus = catchAsync(async (req, res) => {
    const { start, end } = getTodayBounds();

    const record = await Attendance.findOne({
        user: req.user._id,
        date: { $gte: start, $lte: end }
    });

    return res.status(200).json(
        new ApiResponse(200, record || null, "Today's status fetched")
    );
});

export const getAttendanceForReview = catchAsync(async (req, res) => {
    let query = { validationStatus: "PENDING", punchInImage: { $exists: true, $ne: "" } };

    if (req.user.role === "MANAGER") {
        const teamMembers = await User.find({ department: req.user.department }).select("_id");
        const teamIds = teamMembers.map(u => u._id);
        query.user = { $in: teamIds };
    }

    const records = await Attendance.find(query)
        .populate("user", "name employeeId department email")
        .sort({ date: -1 })
        .limit(50);

    return res.status(200).json(
        new ApiResponse(200, records, "Pending reviews fetched")
    );
});

export const validateAttendance = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { validationStatus, shiftStatus, remarks } = req.body;

    const record = await Attendance.findById(id).populate("user");

    if (!record) {
        throw new ApiError(404, "Attendance record not found");
    }

    if (req.user.role === "MANAGER" && record.user.department !== req.user.department) {
        throw new ApiError(403, "You can only validate attendance for your own department");
    }

    if (validationStatus) {
        if (!["VALID", "INVALID"].includes(validationStatus)) {
            throw new ApiError(400, "Validation status must be either VALID or INVALID");
        }
        record.validationStatus = validationStatus;
    }

    if (shiftStatus) {
        if (!["ACTIVE", "COMPLETED", "INCOMPLETE"].includes(shiftStatus)) {
            throw new ApiError(400, "Shift status must be ACTIVE, COMPLETED, or INCOMPLETE");
        }
        record.shiftStatus = shiftStatus;
    }

    if (remarks) record.validationRemarks = remarks;

    await record.save();

    return res.status(200).json(
        new ApiResponse(200, record, `Attendance updated`)
    );
});

export const getAttendanceReport = catchAsync(async (req, res) => {
    const { startDate, endDate, page = 1, limit = 10, userId } = req.query;

    let query = {};

    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.date.$lte = end;
        }
    }

    if (req.user.role === "EMPLOYEE") {
        query.user = req.user._id;
    } else if (req.user.role === "MANAGER") {
        // Managers can see their own department's records
        const teamMembers = await User.find({ department: req.user.department }).select("_id");
        const teamIds = teamMembers.map(u => u._id.toString());
        
        if (userId) {
            if (!teamIds.includes(userId) && userId !== req.user._id.toString()) {
                throw new ApiError(403, "Not authorized to view this user's report");
            }
            query.user = userId;
        } else {
            teamIds.push(req.user._id.toString());
            query.user = { $in: teamIds };
        }
    } else if (req.user.role === "ADMIN") {
        if (userId) {
            query.user = userId;
        }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const records = await Attendance.find(query)
        .populate("user", "name email employeeId department role")
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum);

    const totalRecords = await Attendance.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(200, {
            records,
            pagination: {
                totalRecords,
                currentPage: pageNum,
                totalPages: Math.ceil(totalRecords / limitNum),
                limit: limitNum,
                hasNextPage: pageNum * limitNum < totalRecords,
                hasPrevPage: pageNum > 1
            }
        }, "Attendance report fetched successfully")
    );
});
