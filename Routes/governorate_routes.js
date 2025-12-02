const express = require("express");
const router = express.Router();
const controllers = require("../controllers/governorate_controllers");
const verifyLogin = require("../middlewares/verifyLogin");
const allowedTo = require("../middlewares/allowedTo");
const userRoles = require("../utils/user_roles");

router
  .route("/")
  .get(verifyLogin, controllers.getAllGovernorates)
  .post(verifyLogin, allowedTo(userRoles.ADMIN), controllers.addGovernorate);

router
  .route("/:id")
  .put(verifyLogin, allowedTo(userRoles.ADMIN), controllers.updateGovernorate)
  .delete(
    verifyLogin,
    allowedTo(userRoles.ADMIN),
    controllers.deleteGovernorate
  );

module.exports = router;
