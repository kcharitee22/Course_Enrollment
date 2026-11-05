import mongoose from "mongoose";
import Course from "../models/Course.js";
import { validateCourse } from "../validator/course.validator.js";

//======================= CREATE COURSE ===================
export const createCourse = async (req, res) => {
  try {
    const validationErrors = validateCourse(req.body);

    if (validationErrors) {
      return res.status(400).json({
        message: "Please correct the course information.",
        errors: validationErrors,
      });
    }

    const {
      title,
      code,
      introduction,
      description,
      concepts,
      instructor,
      capacity,
      status,
    } = req.body;

    const course = await Course.create({
      title: title.trim(),
      code: code.trim().toUpperCase(),
      introduction: introduction.trim(),
      description: description.trim(),
      concepts: concepts?.map((concept) => concept.trim()) ?? [],
      instructor: instructor?.trim() ?? "",
      capacity: capacity === undefined ? 30 : Number(capacity),
      status: status ?? "draft",

      // Always use the authenticated admin's ID.
      createdBy: req.user._id,
    });

    return res.status(201).json({
      message: "Course created successfully.",
      course,
    });
  } catch (error) {
    console.error("Create course error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "A course with this code already exists.",
      });
    }

    return res.status(500).json({
      message: "Unable to create course.",
    });
  }
};


// ==================== GET ALL COURSES ==================
export const getCourses = async (req, res) => {
  try {
    // Students only see published courses.
    // Admins can see every course.
    const filter =
      req.user.role === "admin"
        ? {}
        : { status: "published" };

    const courses = await Course.find(filter)
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Courses retrieved successfully.",
      count: courses.length,
      courses,
    });
  } catch (error) {
    console.error("Get courses error:", error);

    return res.status(500).json({
      message: "Unable to retrieve courses.",
    });
  }
};


// ==================== GET ONE COURSE ====================
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid course ID.",
      });
    }

    const filter = { _id: id };

    // Students cannot access drafts or archived courses.
    if (req.user.role !== "admin") {
      filter.status = "published";
    }

    const course = await Course.findOne(filter)
      .populate("createdBy", "name");

    if (!course) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    return res.status(200).json({
      message: "Course retrieved successfully.",
      course,
    });
  } catch (error) {
    console.error("Get course error:", error);

    return res.status(500).json({
      message: "Unable to retrieve course.",
    });
  }
};


//====================== UPDATE COURSE ========================
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid course ID.",
      });
    }

    const validationErrors = validateCourse(req.body, {
      partial: true,
    });

    if (validationErrors) {
      return res.status(400).json({
        message: "Please provide valid course updates.",
        errors: validationErrors,
      });
    }

    const allowedFields = [
      "title",
      "code",
      "introduction",
      "description",
      "concepts",
      "instructor",
      "capacity",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.title !== undefined) {
      updates.title = updates.title.trim();
    }

    if (updates.code !== undefined) {
      updates.code = updates.code.trim().toUpperCase();
    }

    if (updates.introduction !== undefined) {
      updates.introduction = updates.introduction.trim();
    }

    if (updates.description !== undefined) {
      updates.description = updates.description.trim();
    }

    if (updates.instructor !== undefined) {
      updates.instructor = updates.instructor.trim();
    }

    if (updates.concepts !== undefined) {
      updates.concepts = updates.concepts.map(
        (concept) => concept.trim()
      );
    }

    if (updates.capacity !== undefined) {
      updates.capacity = Number(updates.capacity);
    }

    const course = await Course.findByIdAndUpdate(
      id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!course) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    return res.status(200).json({
      message: "Course updated successfully.",
      course,
    });
  } catch (error) {
    console.error("Update course error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "A course with this code already exists.",
      });
    }

    return res.status(500).json({
      message: "Unable to update course.",
    });
  }
};


// ===========================  ARCHIVE COURSE (SOFT DELETE) ==================
export const archiveCourse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid course ID.",
      });
    }

    const course = await Course.findByIdAndUpdate(
      id,
      { status: "archived" },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!course) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    return res.status(200).json({
      message: "Course archived successfully.",
      course,
    });
  } catch (error) {
    console.error("Archive course error:", error);

    return res.status(500).json({
      message: "Unable to archive course.",
    });
  }
};