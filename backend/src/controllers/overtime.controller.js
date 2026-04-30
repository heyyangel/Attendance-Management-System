import { Overtime } from "../models/overtime.model.js";
import { Attendance } from "../models/attendance.model.js";
import { catchAsync } from "../utils/catchAsync.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const requestOvertime = catchAsync(async (req, res) => {
    const { attendanceId, requestedHours, reason } = req.body;

    if (!attendanceId || !requestedHours || !reason) {
        throw new ApiError(400, "Attendance ID, requested hours, and reason are required");
    }

    const attendanceRecord = await Attendance.findOne({
        _id: attendanceId,
        user: req.user._id
    });

    if (!attendanceRecord) {
        throw new ApiError(404, "Attendance record not found");
    }

    const existingRequest = await Overtime.findOne({ attendance: attendanceId });
    if (existingRequest) {
        throw new ApiError(400, "An overtime request already exists for this shift");
    }

    const overtime = await Overtime.create({
        user: req.user._id,
        attendance: attendanceId,
        requestedHours,
        reason,
        status: "PENDING"
    });

    return res.status(201).json(
        new ApiResponse(201, overtime, "Overtime requested successfully")
    );
});

export const approveOvertime = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { managerNotes } = req.body;

    const overtime = await Overtime.findById(id);

    if (!overtime) {
        throw new ApiError(404, "Overtime request not found");
    }

    if (overtime.status !== "PENDING") {
        throw new ApiError(400, `Cannot approve a request that is already ${overtime.status}`);
    }

    overtime.status = "APPROVED";
    overtime.approvedBy = req.user._id;
    if (managerNotes) overtime.managerNotes = managerNotes;

    await overtime.save();

    return res.status(200).json(
        new ApiResponse(200, overtime, "Overtime approved successfully")
    );
});

export const rejectOvertime = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { managerNotes } = req.body;

    const overtime = await Overtime.findById(id);

    if (!overtime) {
        throw new ApiError(404, "Overtime request not found");
    }

    if (overtime.status !== "PENDING") {
        throw new ApiError(400, `Cannot reject a request that is already ${overtime.status}`);
    }

    overtime.status = "REJECTED";
    overtime.approvedBy = req.user._id;
    if (managerNotes) overtime.managerNotes = managerNotes;

    await overtime.save();

    return res.status(200).json(
        new ApiResponse(200, overtime, "Overtime rejected successfully")
    );
});

export const getMyOvertimeRequests = catchAsync(async (req, res) => {
    const requests = await Overtime.find({ user: req.user._id })
        .populate("attendance", "date punchInTime punchOutTime workingHours")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, requests, "Overtime requests fetched")
    );
});

export const getAllOvertimeRequests = catchAsync(async (req, res) => {
    const requests = await Overtime.find()
        .populate("user", "name employeeId email")
        .populate("attendance", "date punchInTime punchOutTime workingHours")
        .populate("approvedBy", "name")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, requests, "All overtime requests fetched")
    );
});
