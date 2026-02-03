require("dotenv").config();
const authRoutes = require("./Routes/auth_routes");
const employeeRoutes = require("./Routes/employee_routes");
const activityRoutes = require("./Routes/activity_routes");
const consultantRoutes = require("./Routes/consultant_routes");
const companyRoutes = require("./Routes/company_routes");
const path = require("path");
const cors = require("cors");
const connectDB = require("./utils/connect_db");
const express = require("express");
const updateDelayedProjects = require("./utils/cornUpdateAllAactivites");

const app = express();

app.use(cors({ origin: "*" }));

app.use(express.json());
connectDB();
updateDelayedProjects();

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/consultant", consultantRoutes);
app.use("/company", companyRoutes);
app.use("/auth", authRoutes);
app.use("/employee", employeeRoutes);
app.use("/activity", activityRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
