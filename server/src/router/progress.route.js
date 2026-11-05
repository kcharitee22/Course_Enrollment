import express from "express";

import {
  getCourseProgress,
  updateLessonProgress,
} from "../controllers/progress.controller.js";

import {
  protect,
  studentOnly,
} from "../middleware/auth.middleware.js";

const progressRouter = express.Router();

// Retrieve progress for a course.
progressRouter.get(
  "/courses/:courseId",
  protect,
  studentOnly,
  getCourseProgress
);

// Update progress for a specific lesson.
progressRouter.patch(
  "/courses/:courseId/lessons/:lessonId",
  protect,
  studentOnly,
  updateLessonProgress
);

export default progressRouter;