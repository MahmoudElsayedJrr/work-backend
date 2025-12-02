const express = require("express");
const verifyLogin = require("../middlewares/verifyLogin");
const allowedTo = require("../middlewares/allowedTo");
const controllers = require("../controllers/employee_controllers");
const regionAccessMiddleware = require("../middlewares/governrateUser");
const userRoles = require("../utils/user_roles");
const router = express.Router();
/* const allowedTo = require("../middlewares/allowedTo");
const verifyLogin = require("../middlewares/verifyLogin"); */

router.get(
  "/",
  verifyLogin,
  regionAccessMiddleware,
  allowedTo(userRoles.ADMIN),
  controllers.GetAllEmployees
);
router.get(
  "/:name",
  verifyLogin,
  allowedTo(userRoles.ADMIN),
  controllers.GetEmployeeById
);
router.delete(
  "/deleteEmployee/:name",
  verifyLogin,
  regionAccessMiddleware,
  allowedTo(userRoles.ADMIN),
  controllers.DeleteEmployee
);
router.patch(
  "/UpdateEmployee/:name",
  verifyLogin,
  regionAccessMiddleware,
  allowedTo(userRoles.ADMIN),
  controllers.UpdateEmployee
);

module.exports = router;
