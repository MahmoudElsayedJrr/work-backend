const express = require("express");
const router = express.Router();
const {
  getAllCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  toggleCompanyStatus,
} = require("../controllers/company_controllers");

const verifyLogin = require("../middlewares/verifyLogin");
const allowedTo = require("../middlewares/allowedTo");
const userRoles = require("../utils/user_roles");
// Routes
router
  .route("/")
  .get(verifyLogin, getAllCompanies)
  .post(verifyLogin, allowedTo(userRoles.ADMIN), createCompany);

router
  .route("/:id")
  .get(verifyLogin, getCompany)
  .put(verifyLogin, allowedTo(userRoles.ADMIN), updateCompany)
  .delete(verifyLogin, allowedTo(userRoles.ADMIN), deleteCompany);

router
  .route("/:id/toggle-status")
  .patch(verifyLogin, allowedTo(userRoles.ADMIN), toggleCompanyStatus);

module.exports = router;
