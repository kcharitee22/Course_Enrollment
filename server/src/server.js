import "dotenv/config.js";
import app from "./app.js";
import connectDB from "./config/db.js";
const PORT = process.env.PORT;
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(
        `ClassEnroll server running on port http://localhost:${PORT}`,
      );
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();