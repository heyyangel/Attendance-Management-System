import { Router } from "express";
import {
    punchIn,
    punchOut,
    getTodayStatus,
    getMyAttendance,
    getAttendanceForReview,
    validateAttendance,
    getAttendanceReport
} from "../controllers/attendance.controller.js";
import { verifyJWT, restrictTo } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post("/punch-in", punchIn);
router.post("/punch-out", punchOut);
router.get("/today", getTodayStatus);
router.get("/my", getMyAttendance);
router.get("/report", getAttendanceReport);

router.get("/review", restrictTo("ADMIN", "MANAGER"), getAttendanceForReview);
router.patch("/:id/validate", restrictTo("ADMIN", "MANAGER"), validateAttendance);

export default router;
