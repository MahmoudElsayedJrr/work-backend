const express = require("express");
const router = express.Router();
const controllers = require("../controllers/upload_controllers");
const verifyLogin = require("../middlewares/verifyLogin");
const upload = require("../middlewares/uploads");
const allowedTo = require("../middlewares/allowedTo");
const userRoles = require("../utils/user_roles");

router.post(
  "/image",
  upload.single("file"),
  verifyLogin,
  allowedTo(userRoles.ADMIN, userRoles.MANAGER),
  controllers.uploadImageCall
);

router.post(
  "/pdf/:bucketName",
  upload.single("pdf"),
  verifyLogin,
  allowedTo(userRoles.ADMIN, userRoles.MANAGER),
  controllers.uploadPdfCall
);

module.exports = router;
