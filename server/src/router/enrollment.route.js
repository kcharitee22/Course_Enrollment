import express from "express";

import {
  enrollInCourse,
  getMyEnrollments,
  withdrawFromCourse,
} from "../controllers/enrollment.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const enrollmentRouter = express.Router();

enrollmentRouter.post("/:courseId", protect, enrollInCourse);

enrollmentRouter.get("/my", protect, getMyEnrollments);

enrollmentRouter.patch("/:enrollmentId/withdraw", protect, withdrawFromCourse);

export default enrollmentRouter;
