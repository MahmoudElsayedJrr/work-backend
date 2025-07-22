const express = require("express");
const router = express.Router();
const controllers = require("../controllers/activity_controllers");
const verifyLogin = require("../middlewares/verifyLogin");
const upload = require("../middlewares/uploads");
const allowedTo = require("../middlewares/allowedTo");
const userRoles = require("../utils/user_roles");

router.get("/export-excel", controllers.ExportExcel);
router.post(
  "/",
  verifyLogin,
  allowedTo(userRoles.ADMIN, userRoles.MANAGER),
  controllers.AddNewActivity
);

router.get("/", verifyLogin, controllers.GetAllActivites);
router.post(
  "/delete-pdf",
  verifyLogin,
  allowedTo(userRoles.ADMIN, userRoles.MANAGER),
  controllers.DeletePdfFromActivity
);

router.post(
  "/delete-image",
  verifyLogin,
  allowedTo(userRoles.ADMIN, userRoles.MANAGER),
  controllers.DeleteImageFromActivity
);

router.get("/:activityCode", controllers.GetActivityById);
router.delete(
  "/:activityCode",
  verifyLogin,
  allowedTo(userRoles.ADMIN),
  controllers.DeleteActivity
);
router.put(
  "/:activityCode",
  verifyLogin,
  allowedTo(userRoles.ADMIN, userRoles.MANAGER, userRoles.FINANCIAL),
  upload.fields([
    { name: "images", maxCount: 3 },
    { name: "activityPdf", maxCount: 3 },
    { name: "contractualDocuments", maxCount: 3 },
  ]),
  controllers.UpdateActivity
);

router.get("/:activityCode/images", verifyLogin, controllers.getActivityImages);

module.exports = router;
