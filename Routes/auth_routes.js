const express = require("express");
const router = express.Router();
const controllers = require("../controllers/auth_controllers");
const verifyLogin = require("../middlewares/verifyLogin");
const allowedTo = require("../middlewares/allowedTo");
const userRoles = require("../utils/user_roles");

router.post("/register", verifyLogin, allowedTo(userRoles.ADMIN), controllers.register);
router.post("/login", controllers.login);
router.get("/me", verifyLogin, controllers.getProfile);
router.put("/changePassword", verifyLogin, controllers.changePassword);

module.exports = router;
