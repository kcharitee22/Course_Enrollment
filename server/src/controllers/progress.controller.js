import mongoose from "mongoose";

import Progress from "../models/Progress.js";
import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import Module from "../models/Module.js";
import Lesson from "../models/Lesson.js";

// Check whether the student can access the course.
const verifyStudentEnrollment = async (req, res, courseId) => {
  if (req.user.role !== "student") {
    res.status(403).json({
      message: "Only students can access learning progress.",
    });

    return false;
  }

  const course = await Course.findById(courseId);

  if (!course || course.status !== "published") {
    res.status(404).json({
      message: "Published course not found.",
    });

    return false;
  }

  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
    status: { $in: ["active", "completed"] },
  });

  if (!enrollment) {
    res.status(403).json({
      message: "You are not enrolled in this course.",
    });

    return false;
  }

  return true;
};


// Build the student's progress summary.
const buildProgressSummary = async (studentId, courseId) => {
  const modules = await Module.find({
    course: courseId,
    status: "published",
  }).select("_id");

  const moduleIds = modules.map((module) => module._id);

  const lessons = await Lesson.find({
    module: { $in: moduleIds },
    status: "published",
  })
    .sort({ order: 1 })
    .select("_id title module order durationMinutes");

  const progressRecords = await Progress.find({
    student: studentId,
    course: courseId,
  });

  const progressMap = new Map(
    progressRecords.map((record) => [
      record.lesson.toString(),
      record,
    ])
  );

  const lessonProgress = lessons.map((lesson) => {
    const savedProgress = progressMap.get(
      lesson._id.toString()
    );

    return {
      lessonId: lesson._id,
      title: lesson.title,
      moduleId: lesson.module,
      order: lesson.order,
      durationMinutes: lesson.durationMinutes,

      completed: savedProgress?.completed || false,

      lastPositionSeconds:
        savedProgress?.lastPositionSeconds || 0,

      completedAt: savedProgress?.completedAt || null,

      lastAccessedAt:
        savedProgress?.lastAccessedAt || null,
    };
  });

  const totalLessons = lessons.length;

  const completedLessons = lessonProgress.filter(
    (lesson) => lesson.completed
  ).length;

  const percentage =
    totalLessons === 0
      ? 0
      : Math.round(
          (completedLessons / totalLessons) * 100
        );

  // Find the most recently accessed lesson.
  const lastProgress = progressRecords
    .filter((record) =>
      lessons.some(
        (lesson) =>
          lesson._id.toString() === record.lesson.toString()
      )
    )
    .sort(
      (a, b) =>
        new Date(b.lastAccessedAt) -
        new Date(a.lastAccessedAt)
    )[0];

  const lastLesson = lastProgress
    ? lessons.find(
        (lesson) =>
          lesson._id.toString() ===
          lastProgress.lesson.toString()
      )
    : null;

  return {
    course: courseId,
    totalLessons,
    completedLessons,
    remainingLessons: totalLessons - completedLessons,
    percentage,

    lastLesson: lastLesson
      ? {
          id: lastLesson._id,
          title: lastLesson.title,
        }
      : null,

    lastPositionSeconds:
      lastProgress?.lastPositionSeconds || 0,

    lastAccessedAt:
      lastProgress?.lastAccessedAt || null,

    lessons: lessonProgress,
  };
};


// GET: Retrieve progress for one course.
export const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        message: "Invalid course ID.",
      });
    }

    const hasAccess = await verifyStudentEnrollment(
      req,
      res,
      courseId
    );

    if (!hasAccess) return;

    const summary = await buildProgressSummary(
      req.user._id,
      courseId
    );

    return res.status(200).json({
      message: "Course progress retrieved successfully.",
      progress: summary,
    });
  } catch (error) {
    console.error("Get course progress error:", error);

    return res.status(500).json({
      message: "Unable to retrieve course progress.",
    });
  }
};


// PATCH: Save lesson completion and video position.
export const updateLessonProgress = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    const { completed, lastPositionSeconds } = req.body;

    if (
      !mongoose.isValidObjectId(courseId) ||
      !mongoose.isValidObjectId(lessonId)
    ) {
      return res.status(400).json({
        message: "Invalid course ID or lesson ID.",
      });
    }

    const hasCompleted = Object.hasOwn(req.body, "completed");

    const hasPosition = Object.hasOwn(
      req.body,
      "lastPositionSeconds"
    );

    if (!hasCompleted && !hasPosition) {
      return res.status(400).json({
        message: "Provide completed or lastPositionSeconds.",
      });
    }

    if (
      hasCompleted &&
      typeof completed !== "boolean"
    ) {
      return res.status(400).json({
        message: "Completed must be true or false.",
      });
    }

    if (
      hasPosition &&
      (
        typeof lastPositionSeconds !== "number" ||
        !Number.isFinite(lastPositionSeconds) ||
        lastPositionSeconds < 0
      )
    ) {
      return res.status(400).json({
        message: "Video position must be a valid non-negative number.",
      });
    }

    const hasAccess = await verifyStudentEnrollment(
      req,
      res,
      courseId
    );

    if (!hasAccess) return;

    // Find the lesson.
    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      return res.status(404).json({
        message: "Lesson not found.",
      });
    }

    // Find its parent module.
    const parentModule = await Module.findById(
      lesson.module
    );

    if (
      !parentModule ||
      parentModule.course.toString() !== courseId ||
      parentModule.status !== "published" ||
      lesson.status !== "published"
    ) {
      return res.status(404).json({
        message: "Published lesson not found in this course.",
      });
    }

    // Prepare the fields to update.
    const updateFields = {
      course: courseId,
      module: parentModule._id,
      lastAccessedAt: new Date(),
    };

    if (hasPosition) {
      updateFields.lastPositionSeconds = lastPositionSeconds;
    }

    if (hasCompleted) {
      updateFields.completed = completed;

      updateFields.completedAt = completed
        ? new Date()
        : null;
    }

    // Update existing progress or create it if missing.
    const progress = await Progress.findOneAndUpdate(
      {
        student: req.user._id,
        lesson: lessonId,
      },
      {
        $set: updateFields,

        $setOnInsert: {
          student: req.user._id,
          lesson: lessonId,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    const summary = await buildProgressSummary(
      req.user._id,
      courseId
    );

    return res.status(200).json({
      message: "Lesson progress saved successfully.",
      savedProgress: progress,
      progress: summary,
    });
  } catch (error) {
    console.error("Update lesson progress error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Progress record already exists. Please retry.",
      });
    }

    return res.status(500).json({
      message: "Unable to update lesson progress.",
    });
  }
};