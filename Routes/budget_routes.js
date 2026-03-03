const express = require("express");
const router = express.Router();
const {
  upsertBudget,
  getAllBudgets,
  getBudgetByYear,
  deleteBudget,
} = require("../controllers/budgetByYear_controllers");
const verifyLogin = require("../middlewares/verifyLogin");
const allowedTo = require("../middlewares/allowedTo");
const userRoles = require("../utils/user_roles");

router.post(
  "/",
  verifyLogin,
  allowedTo(userRoles.ADMIN, userRoles.MANAGER),
  upsertBudget,
);

router.get(
  "/",
  verifyLogin,
  allowedTo(userRoles.ADMIN, userRoles.MANAGER),
  getAllBudgets,
);

router.get("/:fiscalYear", verifyLogin, getBudgetByYear);

router.delete(
  "/:id",
  verifyLogin,
  allowedTo(userRoles.ADMIN, userRoles.MANAGER),
  deleteBudget,
);

module.exports = router;
