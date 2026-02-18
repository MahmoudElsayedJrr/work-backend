const express = require("express");
const router = express.Router();
const {
  upsertBudget,
  getAllBudgets,
  getBudgetByYear,
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

router.get("/", verifyLogin, getAllBudgets);

router.get("/:fiscalYear", verifyLogin, getBudgetByYear);

module.exports = router;
