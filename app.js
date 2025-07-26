require("dotenv").config();
const authRoutes = require("./Routes/auth_routes");
const employeeRoutes = require("./Routes/employee_routes");
const activityRoutes = require("./Routes/activity_routes");
const uploadRoutes = require("./Routes/uploads_routes");

const connectDB = require("./utils/connect_db");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());

app.use(cors({ origin: "https://reconstructionsinai.netlify.app" }));

connectDB();

app.use("/auth", authRoutes);
app.use("/employee", employeeRoutes);
app.use("/activity", activityRoutes);
app.use("/uploads", uploadRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
