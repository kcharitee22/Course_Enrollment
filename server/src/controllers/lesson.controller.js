import mongoose from "mongoose";
import Lesson from "../models/Lesson.js";
import Module from "../models/Module.js";

const validId = (id) => mongoose.isValidObjectId(id);

const validText = (value) =>
  typeof value === "string" && value.trim().length > 0;

const validStatus = (status) =>
  ["draft", "published", "archived"].includes(status);

const validVideoUrl = (value) => {
  if (typeof value !== "string" || value.trim() === "") {
    return false;
  }

  try {
    const url = new URL(value);

    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};


// =================== CREATE LESSON ===================
export const createLesson = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const {
      title,
      content,
      videoUrl,
      order,
      durationMinutes,
      status,
    } = req.body;

    if (!validId(moduleId)) {
      return res.status(400).json({
        message: "Invalid module ID.",
      });
    }

    if (!validText(title)) {
      return res.status(400).json({
        message: "Lesson title is required.",
      });
    }

    if (
      !Number.isInteger(Number(order)) ||
      Number(order) < 1
    ) {
      return res.status(400).json({
        message: "Order must be a positive whole number.",
      });
    }

    if (
      content !== undefined &&
      typeof content !== "string"
    ) {
      return res.status(400).json({
        message: "Lesson content must be text.",
      });
    }

    if (
      videoUrl !== undefined &&
      videoUrl !== "" &&
      !validVideoUrl(videoUrl)
    ) {
      return res.status(400).json({
        message: "Please provide a valid HTTP or HTTPS video URL.",
      });
    }

    if (
      durationMinutes !== undefined &&
      (!Number.isInteger(Number(durationMinutes)) ||
        Number(durationMinutes) < 0)
    ) {
      return res.status(400).json({
        message: "Duration must be zero or a positive whole number.",
      });
    }

    if (status !== undefined && !validStatus(status)) {
      return res.status(400).json({
        message: "Invalid lesson status.",
      });
    }

    const parentModule = await Module.findById(moduleId);

    if (
      !parentModule ||
      parentModule.status === "archived"
    ) {
      return res.status(404).json({
        message: "Module not found or archived.",
      });
    }

    const newLesson = await Lesson.create({
      module: moduleId,
      title: title.trim(),
      content: content?.trim() ?? "",
      videoUrl: videoUrl?.trim() ?? "",
      order: Number(order),
      durationMinutes:
        durationMinutes === undefined
          ? 0
          : Number(durationMinutes),
      status: status ?? "draft",
      createdBy: req.user._id,
    });

    return res.status(201).json({
      message: "Lesson created successfully.",
      lesson: newLesson,
    });
  } catch (error) {
    console.error("Create lesson error:", error);

    return res.status(500).json({
      message: "Unable to create lesson.",
    });
  }
};


// ====================== GET LESSONS IN A MODULE =================
export const getModuleLessons = async (req, res) => {
  try {
    const { moduleId } = req.params;

    if (!validId(moduleId)) {
      return res.status(400).json({
        message: "Invalid module ID.",
      });
    }

    const parentModule = await Module.findById(moduleId)
      .populate("course");

    if (!parentModule) {
      return res.status(404).json({
        message: "Module not found.",
      });
    }

    if (
      req.user.role !== "admin" &&
      (
        parentModule.status !== "published" ||
        !parentModule.course ||
        parentModule.course.status !== "published"
      )
    ) {
      return res.status(404).json({
        message: "Module not found.",
      });
    }

    const filter = { module: moduleId };

    if (req.user.role !== "admin") {
      filter.status = "published";
    }

    const lessons = await Lesson.find(filter).sort({
      order: 1,
    });

    return res.status(200).json({
      message: "Lessons retrieved successfully.",
      count: lessons.length,
      lessons,
    });
  } catch (error) {
    console.error("Get lessons error:", error);

    return res.status(500).json({
      message: "Unable to retrieve lessons.",
    });
  }
};


//  ================= UPDATE LESSON ====================
export const updateLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;

    if (!validId(lessonId)) {
      return res.status(400).json({
        message: "Invalid lesson ID.",
      });
    }

    const allowedFields = [
      "title",
      "content",
      "videoUrl",
      "order",
      "durationMinutes",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Provide at least one field to update.",
      });
    }

    if (
      updates.title !== undefined &&
      !validText(updates.title)
    ) {
      return res.status(400).json({
        message: "Lesson title cannot be empty.",
      });
    }

    if (
      updates.content !== undefined &&
      typeof updates.content !== "string"
    ) {
      return res.status(400).json({
        message: "Lesson content must be text.",
      });
    }

    if (
      updates.videoUrl !== undefined &&
      updates.videoUrl !== "" &&
      !validVideoUrl(updates.videoUrl)
    ) {
      return res.status(400).json({
        message: "Please provide a valid HTTP or HTTPS video URL.",
      });
    }

    for (const field of ["order", "durationMinutes"]) {
      if (updates[field] !== undefined) {
        const value = Number(updates[field]);

        if (
          !Number.isInteger(value) ||
          (field === "order" ? value < 1 : value < 0)
        ) {
          return res.status(400).json({
            message: `${field} must be a valid whole number.`,
          });
        }

        updates[field] = value;
      }
    }

    if (
      updates.status !== undefined &&
      !validStatus(updates.status)
    ) {
      return res.status(400).json({
        message: "Invalid lesson status.",
      });
    }

    for (const field of ["title", "content", "videoUrl"]) {
      if (updates[field] !== undefined) {
        updates[field] = updates[field].trim();
      }
    }

    const updatedLesson = await Lesson.findByIdAndUpdate(
      lessonId,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedLesson) {
      return res.status(404).json({
        message: "Lesson not found.",
      });
    }

    return res.status(200).json({
      message: "Lesson updated successfully.",
      lesson: updatedLesson,
    });
  } catch (error) {
    console.error("Update lesson error:", error);

    return res.status(500).json({
      message: "Unable to update lesson.",
    });
  }
};


//  ======================= ARCHIVE LESSON =====================
export const archiveLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;

    if (!validId(lessonId)) {
      return res.status(400).json({
        message: "Invalid lesson ID.",
      });
    }

    const updatedLesson = await Lesson.findByIdAndUpdate(
      lessonId,
      { status: "archived" },
      { new: true, runValidators: true }
    );

    if (!updatedLesson) {
      return res.status(404).json({
        message: "Lesson not found.",
      });
    }

    return res.status(200).json({
      message: "Lesson archived successfully.",
      lesson: updatedLesson,
    });
  } catch (error) {
    console.error("Archive lesson error:", error);

    return res.status(500).json({
      message: "Unable to archive lesson.",
    });
  }
};