const express = require("express");
const router = express.Router();
const controllers = require("../controllers/activity_controllers");
const decisionControllers = require("../controllers/decision_controllers");
const contractsControllers = require("../controllers/contracts_controllers");
const extractController = require("../controllers/extract_controllers");
const verifyLogin = require("../middlewares/verifyLogin");
const regionAccessMiddleware = require("../middlewares/governrateUser");
const upload = require("../middlewares/uploads");
const allowedTo = require("../middlewares/allowedTo");
const userRoles = require("../utils/user_roles");

router.get(
  "/export-excel",
  verifyLogin,
  regionAccessMiddleware,
  controllers.ExportExcel
);
router.post(
  "/",
  verifyLogin,
  regionAccessMiddleware,
  allowedTo(userRoles.ADMIN, userRoles.MANAGER),
  controllers.AddNewActivity
);

router.get(
  "/",
  verifyLogin,
  regionAccessMiddleware,
  controllers.GetAllActivites
);
router.get(
  "/statistics",
  verifyLogin,
  regionAccessMiddleware,
  controllers.GetActivitiesStatistics
);
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
  /*   verifyLogin,
  allowedTo(userRoles.ADMIN, userRoles.FINANCIAL), */
  upload.array("extractpdfs", 5),
  extractController.addExtract
);
router.put(
  "/extract/:activityCode/:extractId",
  verifyLogin,
  allowedTo(userRoles.ADMIN, userRoles.FINANCIAL),
  upload.array("extractpdfs"),
  extractController.updateExtract
);
router.delete(
  "/extract/:activityCode/:extractId",
  verifyLogin,
  allowedTo(userRoles.ADMIN, userRoles.FINANCIAL),
  extractController.deleteExtract
);
/* router.delete(
  "/extract/:extractId/pdf/:pdfId",
  extractController.deleteExtractPDF
); */

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

router.get(
  "/total-disbursed",
  verifyLogin,
  regionAccessMiddleware,
  controllers.getTotalDisbursed
);
router.get(
  "/total-contractualValue",
  verifyLogin,
  regionAccessMiddleware,
  controllers.getTotalContractualValue
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
  regionAccessMiddleware,
  allowedTo(
    userRoles.ADMIN,
    userRoles.MANAGER,
    userRoles.FINANCIAL,
    userRoles.PROJETMANAGER,
    userRoles.CONTRACTUAL,
    userRoles.EXECUTIVE
  ),
  upload.fields([
    { name: "images", maxCount: 3 },
    { name: "activitypdfs", maxCount: 3 },
    { name: "contractualDocuments", maxCount: 3 },
  ]),
  controllers.UpdateActivity
);

module.exports = router;
