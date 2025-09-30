const express = require("express");
const router = express.Router();
const controllers = require("../controllers/activity_controllers");
const decisionControllers = require("../controllers/decision_controllers");
const contractsControllers = require("../controllers/contracts_controllers");
const extractController = require("../controllers/extract_controllers");
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
  "/delete-pdf/:bucketName",
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

router.post(
  "/extract/:activityCode",
  verifyLogin,
  allowedTo(userRoles.ADMIN, userRoles.MANAGER),
  upload.array("extractpdfs", 5),
  extractController.addExtract
);

router.put(
  "/contract/:activityCode",
  verifyLogin,
  allowedTo(userRoles.ADMIN, userRoles.MANAGER),
  contractsControllers.AddContractForActivity
);

router.put(
  "/decision/:activityCode",
  verifyLogin,
  allowedTo(userRoles.ADMIN, userRoles.PROJETMANAGER),
  decisionControllers.AddDecisionForActivity
);

router.delete(
  "/decision/:activityCode/:decisionId",
  verifyLogin,
  allowedTo(userRoles.ADMIN, userRoles.PROJETMANAGER),
  decisionControllers.DeleteDecisionById
);

router.put(
  "/decision/:activityCode/:decisionId",
  verifyLogin,
  allowedTo(userRoles.ADMIN, userRoles.PROJETMANAGER),
  decisionControllers.updateDecision
);

router.get("/total-disbursed", controllers.getTotalDisbursed);

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
    { name: "activitypdfs", maxCount: 3 },
    { name: "contractualDocuments", maxCount: 3 },
  ]),
  (req, res, next) => {
    console.log("FILES RECEIVED >>>", req.files);
    console.log("BODY RECEIVED >>>", req.body);
    next();
  },
  controllers.UpdateActivity
);

module.exports = router;
