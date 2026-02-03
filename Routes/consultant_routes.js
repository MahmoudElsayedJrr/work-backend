const express = require("express");
const router = express.Router();
const {
  getAllConsultants,
  getConsultant,
  createConsultant,
  updateConsultant,
  deleteConsultant,
  toggleConsultantStatus,
} = require("../controllers/consultant_controllers");

const verifyLogin = require("../middlewares/verifyLogin");
const allowedTo = require("../middlewares/allowedTo");
const userRoles = require("../utils/user_roles");

router
  .route("/")
  .get(verifyLogin, getAllConsultants)
  .post(verifyLogin, allowedTo(userRoles.ADMIN), createConsultant);

router
  .route("/:id")
  .get(verifyLogin, getConsultant)
  .put(verifyLogin, allowedTo(userRoles.ADMIN), updateConsultant)
  .delete(verifyLogin, allowedTo(userRoles.ADMIN), deleteConsultant);

router
  .route("/:id/toggle-status")
  .patch(verifyLogin, allowedTo(userRoles.ADMIN), toggleConsultantStatus);

module.exports = router;
