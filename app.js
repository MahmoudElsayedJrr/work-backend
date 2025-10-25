require("dotenv").config();
const authRoutes = require("./Routes/auth_routes");
const employeeRoutes = require("./Routes/employee_routes");
const activityRoutes = require("./Routes/activity_routes");

const path = require("path");

const connectDB = require("./utils/connect_db");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());
connectDB();

/* const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
}; */

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/auth", authRoutes);
app.use("/employee", employeeRoutes);
app.use("/activity", activityRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
