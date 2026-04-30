import mongoose, { Schema } from "mongoose";

const overtimeSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        attendance: {
            type: Schema.Types.ObjectId,
            ref: "Attendance",
            required: true
        },
        requestedHours: {
            type: Number,
            required: [true, "Requested hours are required"],
            min: [0.5, "Minimum overtime request is 0.5 hours"]
        },
        reason: {
            type: String,
            required: [true, "Reason for overtime is required"],
            trim: true
        },
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED"],
            default: "PENDING"
        },
        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        managerNotes: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

export const Overtime = mongoose.model("Overtime", overtimeSchema);
