import { Router } from "express";
import { 
    getEmployeeDashboard, 
    getManagerDashboard, 
    getAdminDashboard 
} from "../controllers/dashboard.controller.js";
import { verifyJWT, restrictTo } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.get("/employee", getEmployeeDashboard);

router.get("/manager", restrictTo("MANAGER", "ADMIN"), getManagerDashboard);

router.get("/admin", restrictTo("ADMIN"), getAdminDashboard);

export default router;
