const jwt = require("jsonwebtoken");
const httpStatus = require("../utils/http_status");
const verifyLogin = (req, res, next) => {
  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];
  if (!authHeader) {
    return res
      .status(401)
      .json(httpStatus.httpFaliureStatus("No token provided"));
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.currentEmployee = decoded;

    next();
  } catch (error) {
    return res.status(401).json(httpStatus.httpErrorStatus(error.message));
  }
};

module.exports = verifyLogin;
