import mongoose from "mongoose";
import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";


//  ===================== ENROLL IN A COURSE ===============
export const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        message: "Invalid course ID.",
      });
    }

    const course = await Course.findById(courseId);

    if (!course || course.status !== "published") {
      return res.status(404).json({
        message: "Course not found or unavailable.",
      });
    }

    // Check if the student already enrolled.
    const existingEnrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (existingEnrollment) {
      return res.status(409).json({
        message: "You already have an enrollment record for this course.",
      });
    }

    // ====================== Count students currently enrolled.===============
    const activeEnrollments = await Enrollment.countDocuments({
      course: courseId,
      status: "active",
    });

    if (activeEnrollments >= course.capacity) {
      return res.status(409).json({
        message: "This course has reached its enrollment capacity.",
      });
    }

    const enrollment = await Enrollment.create({
      student: req.user._id,
      course: courseId,
      status: "active",
    });

    return res.status(201).json({
      message: "You have successfully enrolled in this course.",
      enrollment,
    });
  } catch (error) {
    console.error("Enrollment error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "You already have an enrollment record for this course.",
      });
    }

    return res.status(500).json({
      message: "Unable to enroll in this course.",
    });
  }
};


// ======================= GET MY ENROLLMENTS =====================
export const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      student: req.user._id,
      status: { $ne: "withdrawn" },
    })
      .populate("course")
      .sort({ enrolledAt: -1 });

    return res.status(200).json({
      message: "Your enrollments retrieved successfully.",
      count: enrollments.length,
      enrollments,
    });
  } catch (error) {
    console.error("Get enrollments error:", error);

    return res.status(500).json({
      message: "Unable to retrieve your enrollments.",
    });
  }
};


// ===================== WITHDRAW FROM A COURSE ===================
export const withdrawFromCourse = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    if (!mongoose.isValidObjectId(enrollmentId)) {
      return res.status(400).json({
        message: "Invalid enrollment ID.",
      });
    }

    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      student: req.user._id,
      status: "active",
    });

    if (!enrollment) {
      return res.status(404).json({
        message: "Active enrollment not found.",
      });
    }

    enrollment.status = "withdrawn";

    await enrollment.save();

    return res.status(200).json({
      message: "You have withdrawn from the course.",
      enrollment,
    });
  } catch (error) {
    console.error("Withdraw enrollment error:", error);

    return res.status(500).json({
      message: "Unable to withdraw from the course.",
    });
  }
};