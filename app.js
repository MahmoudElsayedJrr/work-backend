require("dotenv").config();
const authRoutes = require("./Routes/auth_routes");
const employeeRoutes = require("./Routes/employee_routes");
const activityRoutes = require("./Routes/activity_routes");
const connectDB = require("./utils/connect_db");
const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
app.use(cors());
app.use(express.json());
connectDB();
app.use("/auth", authRoutes);
app.use("/employee", employeeRoutes);
app.use("/activity", activityRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.listen(4000, () => {
  console.log("Server is running on port 4000");
});
