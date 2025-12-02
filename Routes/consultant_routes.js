/* const express = require("express");
const router = express.Router();
const controllers = require("../controllers/consultant_controllers");
const verifyLogin = require("../middlewares/verifyLogin");
const allowedTo = require("../middlewares/allowedTo");
const userRoles = require("../utils/user_roles");

router
  .route("/")
  .get(verifyLogin, controllers.getAllConsultants)
  .post(verifyLogin, allowedTo(userRoles.ADMIN), controllers.addConsultant);

router
  .route("/:id")
  .put(verifyLogin, allowedTo(userRoles.ADMIN), controllers.updateConsultant)
  .delete(
    verifyLogin,
    allowedTo(userRoles.ADMIN),
    controllers.deleteConsultant
  );

module.exports = router;
 */
