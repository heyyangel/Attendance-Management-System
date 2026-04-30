import mongoose, { Schema } from "mongoose";

const attendanceSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        date: {
            type: Date,
            required: true,
            default: Date.now
        },
        punchInTime: {
            type: Date,
            required: true,
            default: Date.now
        },
        punchOutTime: {
            type: Date
        },
        workingHours: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: ["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE"],
            default: "PRESENT"
        },
        shiftStatus: {
            type: String,
            enum: ["COMPLETED", "INCOMPLETE", "PENDING"],
            default: "PENDING"
        },
        punchInImage: {
            type: String,
            required: [true, 'Selfie image is required for Punch In']
        },
        punchOutImage: {
            type: String
        },
        validationStatus: {
            type: String,
            enum: ["PENDING", "VALID", "INVALID"],
            default: "PENDING"
        },
        validationRemarks: {
            type: String,
            trim: true
        },
        punchInLocation: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
            locationName: { type: String, trim: true }
        },
        punchOutLocation: {
            latitude: { type: Number },
            longitude: { type: Number },
            locationName: { type: String, trim: true }
        }
    },
    {
        timestamps: true
    }
);

export const Attendance = mongoose.model("Attendance", attendanceSchema);
