
import express from "express";
import { registerUser,loginUser,logoutUser ,getCurrentUser} from "../controllers/auth.controller.js";

const authRouter = express.Router();

// Registration route
authRouter.post("/register", registerUser);
authRouter.post("/login",loginUser)
authRouter.post("/logout",logoutUser)
authRouter.get("/me",getCurrentUser)

export default authRouter;
