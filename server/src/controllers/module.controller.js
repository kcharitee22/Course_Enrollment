import mongoose from "mongoose";
import Module from "../models/Module.js";
import Course from "../models/Course.js";

const validId = (id) => mongoose.isValidObjectId(id);

const validText = (value) =>
  typeof value === "string" && value.trim().length > 0;

const validStatus = (status) =>
  ["draft", "published", "archived"].includes(status);


//  ========================== CREATE MODULE ==========================
export const createModule = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, order, status } = req.body;

    if (!validId(courseId)) {
      return res.status(400).json({
        message: "Invalid course ID.",
      });
    }

    if (!validText(title)) {
      return res.status(400).json({
        message: "Module title is required.",
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
      description !== undefined &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        message: "Description must be text.",
      });
    }

    if (status !== undefined && !validStatus(status)) {
      return res.status(400).json({
        message: "Invalid module status.",
      });
    }

    const course = await Course.findById(courseId);

    if (!course || course.status === "archived") {
      return res.status(404).json({
        message: "Course not found or archived.",
      });
    }

    const newModule = await Module.create({
      course: courseId,
      title: title.trim(),
      description: description?.trim() ?? "",
      order: Number(order),
      status: status ?? "draft",
      createdBy: req.user._id,
    });

    return res.status(201).json({
      message: "Module created successfully.",
      module: newModule,
    });
  } catch (error) {
    console.error("Create module error:", error);

    return res.status(500).json({
      message: "Unable to create module.",
    });
  }
};


//   ======================== GET MODULES IN A COURSE ====================
export const getCourseModules = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!validId(courseId)) {
      return res.status(400).json({
        message: "Invalid course ID.",
      });
    }

    const course = await Course.findById(courseId);

    if (
      !course ||
      (req.user.role !== "admin" && course.status !== "published")
    ) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    const filter = { course: courseId };

    if (req.user.role !== "admin") {
      filter.status = "published";
    }

    const modules = await Module.find(filter).sort({
      order: 1,
    });

    return res.status(200).json({
      message: "Modules retrieved successfully.",
      count: modules.length,
      modules,
    });
  } catch (error) {
    console.error("Get modules error:", error);

    return res.status(500).json({
      message: "Unable to retrieve modules.",
    });
  }
};


// ==================== UPDATE MODULE ==================
export const updateModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    if (!validId(moduleId)) {
      return res.status(400).json({
        message: "Invalid module ID.",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "order",
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
        message: "Module title cannot be empty.",
      });
    }

    if (updates.description !== undefined) {
      if (typeof updates.description !== "string") {
        return res.status(400).json({
          message: "Description must be text.",
        });
      }

      updates.description = updates.description.trim();
    }

    if (updates.order !== undefined) {
      if (
        !Number.isInteger(Number(updates.order)) ||
        Number(updates.order) < 1
      ) {
        return res.status(400).json({
          message: "Order must be a positive whole number.",
        });
      }

      updates.order = Number(updates.order);
    }

    if (
      updates.status !== undefined &&
      !validStatus(updates.status)
    ) {
      return res.status(400).json({
        message: "Invalid module status.",
      });
    }

    if (updates.title !== undefined) {
      updates.title = updates.title.trim();
    }

    const updatedModule = await Module.findByIdAndUpdate(
      moduleId,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedModule) {
      return res.status(404).json({
        message: "Module not found.",
      });
    }

    return res.status(200).json({
      message: "Module updated successfully.",
      module: updatedModule,
    });
  } catch (error) {
    console.error("Update module error:", error);

    return res.status(500).json({
      message: "Unable to update module.",
    });
  }
};


// ======================== ARCHIVE MODULE ==================
export const archiveModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    if (!validId(moduleId)) {
      return res.status(400).json({
        message: "Invalid module ID.",
      });
    }

    const updatedModule = await Module.findByIdAndUpdate(
      moduleId,
      { status: "archived" },
      { new: true, runValidators: true }
    );

    if (!updatedModule) {
      return res.status(404).json({
        message: "Module not found.",
      });
    }

    return res.status(200).json({
      message: "Module archived successfully.",
      module: updatedModule,
    });
  } catch (error) {
    console.error("Archive module error:", error);

    return res.status(500).json({
      message: "Unable to archive module.",
    });
  }
};