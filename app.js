require("dotenv").config();
const authRoutes = require("./Routes/auth_routes");
const employeeRoutes = require("./Routes/employee_routes");
const activityRoutes = require("./Routes/activity_routes");
const path = require("path");

const connectDB = require("./utils/connect_db");
const express = require("express");
const corsMiddleware = require("./middlewares/cors.middleware");

const app = express();

app.use((req, res, next) => {
  console.log(
    `📥 Incoming Request: ${req.method} ${req.url} from ${
      req.headers.origin || "unknown origin"
    }`
  );

  // السماح لجميع الـ Origins (للتطوير)
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);

  // الـ Headers الأساسية
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization, Origin"
  );
  res.setHeader("Access-Control-Expose-Headers", "Content-Length, X-JSON");
  res.setHeader("Access-Control-Max-Age", "86400");

  // معالجة OPTIONS request (Preflight)
  if (req.method === "OPTIONS") {
    console.log("✅ OPTIONS request - sending 200");
    return res.status(200).end();
  }

  next();
});

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
