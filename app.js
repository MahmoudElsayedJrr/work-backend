require("dotenv").config();
const authRoutes = require("./Routes/auth_routes");
const employeeRoutes = require("./Routes/employee_routes");
const activityRoutes = require("./Routes/activity_routes");
const path = require("path");
const cors = require("cors");
const connectDB = require("./utils/connect_db");
const express = require("express");
const corsMiddleware = require("./middlewares/cors.middleware");

const app = express();

 app.use(cors({origin: "*"}));



app.use(express.json());
connectDB();

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/auth", authRoutes);
app.use("/employee", employeeRoutes);
app.use("/activity", activityRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
