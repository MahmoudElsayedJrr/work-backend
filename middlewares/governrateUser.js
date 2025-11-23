const httpStatus = require("../utils/http_status");

const regionAccessMiddleware = (req, res, next) => {
  try {
    const user = req.currentEmployee;

    if (!user) {
      return res
        .status(401)
        .json(httpStatus.httpFaliureStatus("User Not Found"));
    }

    const isSuperAdmin = user.region === "super" || user.region === undefined;

    if (isSuperAdmin) {
      req.regionFilter = {};
      req.userRegion = null;
      return next();
    }

    req.regionFilter = { governorate: user.region };
    req.userRegion = user.region;

    next();
  } catch (error) {
    return res.status(500).json(httpStatus.httpErrorStatus(error.message));
  }
};

module.exports = regionAccessMiddleware;
