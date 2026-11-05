import express from "express";

import {
  createLesson,
  getModuleLessons,
  updateLesson,
  archiveLesson,
} from "../controllers/lesson.controller.js";

import { protect, adminOnly } from "../middleware/auth.middleware.js";

const lessonRouter = express.Router();

lessonRouter.post(
  "/modules/:moduleId/lessons",
  protect,
  adminOnly,
  createLesson,
);

lessonRouter.get("/modules/:moduleId/lessons", protect, getModuleLessons);

lessonRouter.patch("/:lessonId", protect, adminOnly, updateLesson);

lessonRouter.delete("/:lessonId", protect, adminOnly, archiveLesson);

export default lessonRouter;
