import { Router } from "express";
import { 
    requestOvertime, 
    approveOvertime, 
    rejectOvertime, 
    getMyOvertimeRequests, 
    getAllOvertimeRequests 
} from "../controllers/overtime.controller.js";
import { verifyJWT, restrictTo } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
    
router.post("/request", requestOvertime);
router.get("/my", getMyOvertimeRequests);

router.patch("/:id/approve", restrictTo("ADMIN", "MANAGER"), approveOvertime);
router.patch("/:id/reject", restrictTo("ADMIN", "MANAGER"), rejectOvertime);
router.get("/all", restrictTo("ADMIN", "MANAGER"), getAllOvertimeRequests);

export default router;
