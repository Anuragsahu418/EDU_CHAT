import express from "express";
import upload from "../middleware/multer.middleware.js";
import { updateProfile } from "../controllers/auth.controller.js";

const router = express.Router();

router.put("/update", upload.single("profilePic"), updateProfile);

export default router;
