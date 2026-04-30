import { User } from "../models/user.model.js";
import { Attendance } from "../models/attendance.model.js";
import { Overtime } from "../models/overtime.model.js";
import { catchAsync } from "../utils/catchAsync.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

export const getEmployeeDashboard = catchAsync(async (req, res) => {
    const userId = req.user._id;

    const recentAttendance = await Attendance.find({ user: userId })
        .sort({ date: -1 })
        .limit(5);

    const recentOvertime = await Overtime.find({ user: userId })
        .populate("attendance", "date")
        .sort({ createdAt: -1 })
        .limit(5);
    const hoursAggregation = await Attendance.aggregate([
        { 
            $match: { 
                user: new mongoose.Types.ObjectId(userId),
                date: { $gte: startOfMonth }
            } 
        },
        { 
            $group: { 
                _id: null, 
                totalHours: { $sum: "$workingHours" },
                daysPresent: { $sum: 1 }
            } 
        }
    ]);

    const stats = hoursAggregation.length > 0 ? hoursAggregation[0] : { totalHours: 0, daysPresent: 0 };

    return res.status(200).json(
        new ApiResponse(200, {
            stats,
            recentAttendance,
            recentOvertime
        }, "Employee dashboard data fetched")
    );
});


export const getManagerDashboard = catchAsync(async (req, res) => {
    const department = req.user.department || "";

    const teamMembers = await User.find({ department, isActive: true }).select("_id name employeeId role");
    const teamIds = teamMembers.map(u => u._id);

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const todaysAttendance = await Attendance.find({
        user: { $in: teamIds },
        date: { $gte: start, $lte: end }
    }).populate("user", "name employeeId");

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const weeklyHours = await Attendance.aggregate([
        { $match: { user: { $in: teamIds }, date: { $gte: weekStart, $lte: end } } },
        {
            $group: {
                _id: { $dayOfWeek: "$date" },
                totalHours: { $sum: "$workingHours" },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    const pendingOvertime = await Overtime.find({
        user: { $in: teamIds }
    }).populate("user", "name employeeId").populate("attendance", "date workingHours").sort({ createdAt: -1 }).limit(10);

    return res.status(200).json(
        new ApiResponse(200, {
            teamSize: teamMembers.length,
            todaysAttendance,
            weeklyHours,
            pendingOvertime
        }, "Manager dashboard data fetched")
    );
});

export const getAdminDashboard = catchAsync(async (req, res) => {
    const totalUsers = await User.countDocuments({ isActive: true });
    
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const todaysPunches = await Attendance.countDocuments({
        date: { $gte: start, $lte: end }
    });

    const activeNow = await Attendance.countDocuments({
        date: { $gte: start, $lte: end },
        punchOutTime: { $exists: false }
    });

    const todaysAttendance = await Attendance.find({
        date: { $gte: start, $lte: end }
    })
    .populate("user", "name employeeId department")
    .sort({ punchInTime: -1 });

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const weeklyHours = await Attendance.aggregate([
        { $match: { date: { $gte: weekStart, $lte: end } } },
        {
            $group: {
                _id: { $dayOfWeek: "$date" },
                totalHours: { $sum: "$workingHours" },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    const globalPendingOvertime = await Overtime.find({})
        .populate("user", "name department")
        .sort({ createdAt: -1 })
        .limit(10);

    return res.status(200).json(
        new ApiResponse(200, {
            users: {
                totalActive: totalUsers
            },
            attendanceToday: {
                totalPunchedIn: todaysPunches,
                currentlyWorking: activeNow,
                absent: totalUsers - todaysPunches
            },
            todaysAttendance,
            weeklyHours,
            globalPendingOvertime
        }, "Admin dashboard data fetched")
    );
});
