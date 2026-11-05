import express from "express";

import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  archiveCourse,
} from "../controllers/course.controller.js";

import {
  protect,
  adminOnly,
} from "../middleware/auth.middleware.js";

const courseRouter = express.Router();

// Students and admins can view courses.
courseRouter.get("/", protect, getCourses);
courseRouter.get("/:id", protect, getCourseById);

// Only admins can manage courses.
courseRouter.post("/", protect, adminOnly, createCourse);
courseRouter.patch("/:id", protect, adminOnly, updateCourse);
courseRouter.delete("/:id", protect, adminOnly, archiveCourse);

export default courseRouter;