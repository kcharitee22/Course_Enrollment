import express from "express";

import {
  createModule,
  getCourseModules,
  updateModule,
  archiveModule,
} from "../controllers/module.controller.js";

import { protect, adminOnly } from "../middleware/auth.middleware.js";

const moduleRouter = express.Router();

moduleRouter.post(
  "/courses/:courseId/modules",
  protect,
  adminOnly,
  createModule,
);

moduleRouter.get("/courses/:courseId/modules", protect, getCourseModules);

moduleRouter.patch("/:moduleId", protect, adminOnly, updateModule);

moduleRouter.delete("/:moduleId", protect, adminOnly, archiveModule);

export default moduleRouter;
