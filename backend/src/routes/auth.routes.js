import { Router } from "express";
import { signupUser, loginUser, logoutUser, switchRole, getAllUsers } from "../controllers/auth.controller.js";
import { verifyJWT, restrictTo } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/signup", signupUser);
router.post("/login", loginUser);

router.post("/logout", verifyJWT, logoutUser);
router.patch("/switch-role", verifyJWT, switchRole);


router.get("/profile", verifyJWT, (req, res) => {
    res.status(200).json({
        success: true,
        data: req.user,
        message: "Profile data fetched successfully"
    });
});

router.get("/manager-dashboard", verifyJWT, restrictTo("ADMIN", "MANAGER"), (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to the Manager Dashboard! You have elevated privileges."
    });
});

router.get("/admin-only", verifyJWT, restrictTo("ADMIN"), (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome, Almighty Admin."
    });
});

router.get("/users", verifyJWT, restrictTo("ADMIN"), getAllUsers);

export default router;
