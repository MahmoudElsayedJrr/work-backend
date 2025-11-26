const ActivityModel = require("../Models/activity_model");
const httpStatus = require("../utils/http_status");
const supabase = require("../utils/supabase");
const fs = require("fs");
const ExcelJS = require("exceljs");
const saveImageLocally = require("../utils/uploadImage");
const savePdfLocally = require("../utils/uploadPDF");
const path = require("path");

const AddNewActivity = async (req, res) => {
  try {
    if (req.userRegion) {
      if (!req.body.governorate) {
        return res
          .status(400)
          .json(httpStatus.httpFaliureStatus("يجب تحديد المحافظة"));
      }

      if (req.body.governorate.trim() !== req.userRegion.trim()) {
        return res
          .status(403)
          .json(
            httpStatus.httpFaliureStatus(
              `غير مسموح لك بإضافة مشاريع في محافظة ${req.body.governorate}. يمكنك فقط إضافة مشاريع في محافظة ${req.userRegion}`
            )
          );
      }
    } else {
      if (!req.body.governorate) {
        return res
          .status(400)
          .json(httpStatus.httpFaliureStatus("يجب تحديد المحافظة"));
      }
    }

    const existingActivity = await ActivityModel.findOne({
      activityCode: req.body.activityCode.toUpperCase(),
    });

    if (existingActivity) {
      return res
        .status(400)
        .json(
          httpStatus.httpFaliureStatus("Activity with this code already exists")
        );
    }

    const {
      contractualDocuments,
      activitypdfs,
      images,
      roaddetails,
      ...otherFields
    } = req.body;

    const processedRoadDetails = roaddetails
      ? {
          petroleumCompany: Array.isArray(roaddetails.petroleumCompany)
            ? roaddetails.petroleumCompany[0] || "N/A"
            : roaddetails.petroleumCompany || "N/A",
          bitumenQuantity: Array.isArray(roaddetails.bitumenQuantity)
            ? parseFloat(roaddetails.bitumenQuantity[0]) || 0
            : parseFloat(roaddetails.bitumenQuantity) || 0,
          mc: Array.isArray(roaddetails.mc)
            ? parseFloat(roaddetails.mc[0]) || 0
            : parseFloat(roaddetails.mc) || 0,
          rc: Array.isArray(roaddetails.rc)
            ? parseFloat(roaddetails.rc[0]) || 0
            : parseFloat(roaddetails.rc) || 0,
          remainingQuantitiesTons: Array.isArray(
            roaddetails.remainingQuantitiesTons
          )
            ? parseFloat(roaddetails.remainingQuantitiesTons[0]) || 0
            : parseFloat(roaddetails.remainingQuantitiesTons) || 0,
          notes: Array.isArray(roaddetails.notes)
            ? roaddetails.notes[0] || ""
            : roaddetails.notes || "",
        }
      : {};

    const newActivityData = {
      ...otherFields,
      activityCode: req.body.activityCode.toUpperCase(),
      contractualDocuments: [],
      activitypdfs: [],
      images: [],
      roaddetails: processedRoadDetails,
    };

    const newActivity = new ActivityModel(newActivityData);
    await newActivity.save();

    res.status(201).json(httpStatus.httpSuccessStatus(newActivity));
  } catch (error) {
    res.status(500).json(httpStatus.httpErrorStatus(error.message));
  }
};

// ==================== جلب مشروع واحد ====================
const GetActivityById = async (req, res) => {
  try {
    const { activityCode } = req.params;

    const query = {
      activityCode: activityCode.toUpperCase(),
      ...req.regionFilter,
    };

    const activity = await ActivityModel.findOne(query);

    if (!activity) {
      return res
        .status(404)
        .json(
          httpStatus.httpFaliureStatus("Activity not found or not accessible")
        );
    }

    res.status(200).json(httpStatus.httpSuccessStatus(activity));
  } catch (error) {
    res.status(400).json(httpStatus.httpErrorStatus(error.message));
  }
};

// ==================== حذف مشروع ====================
const DeleteActivity = async (req, res) => {
  try {
    const { activityCode } = req.params;

    const query = {
      activityCode: activityCode.toUpperCase(),
      ...req.regionFilter,
    };

    const activity = await ActivityModel.findOne(query);

    if (!activity) {
      return res
        .status(404)
        .json(
          httpStatus.httpFaliureStatus(
            "Activity not found or you don't have permission to delete it"
          )
        );
    }

    const deleteFiles = (files) => {
      if (!Array.isArray(files)) return;
      files.forEach((file) => {
        const relativePath = file.path || file;
        const filePath = path.join(
          process.cwd(),
          relativePath.replace(/^\//, "")
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    };

    deleteFiles(activity.images);
    deleteFiles(activity.activitypdfs);
    deleteFiles(activity.contractualDocuments);
    deleteFiles(activity.extractpdfs);

    await ActivityModel.findOneAndDelete(query);

    res
      .status(200)
      .json(
        httpStatus.httpSuccessStatus(
          "Activity and its files deleted successfully"
        )
      );
  } catch (error) {
    console.error("Error in DeleteActivity:", error);
    res.status(400).json(httpStatus.httpErrorStatus(error.message));
  }
};

// ==================== تعديل مشروع ====================
const updatableFieldsByRole = {
  admin: [
    "activityName",
    "executingCompany",
    "fundingType",
    "fundingSource",
    "projectCategory",
    "consultant",
    "governorate",
    "supervisorEngineer",
    "supervisorPhone",
    "activityDescription",
    "estimatedValue",
    "contractualValue",
    "completionDate",
    "receptionDate",
    "status",
    "progress",
    "executivePosition",
    "projectLocationLink",
    "mediaFiles",
    "disbursedAmount",
    "roaddetails",
    "petroleumCompany",
    "bitumenQuantity",
    "mc",
    "rc",
    "remainingQuantitiesTons",
    "notes",
    "publishDate",
    "technicalDecisionDate",
    "financialDecisionDate",
    "assignmentOrderDate",
    "siteHandoverDate",
    "contractualDocuments",
    "extensionDate",
    "suspensionDate",
    "resumptionDate",
    "decisionName",
    "decisionType",
    "decisionUnit",
    "decisionQuantity",
    "decisionPrice",
    "contractDate",
    "contractPrice",
    "extractDate",
    "extractValue",
    "extractPDFs",
    "fiscalYear",
  ],
  manager: [
    "activityName",
    "executingCompany",
    "governorate",
    "projectCategory",
    "fundingType",
    "fundingSource",
    "consultant",
    "activityDescription",
    "supervisorEngineer",
    "supervisorPhone",
    "mediaFiles",
    "estimatedValue",
    "contractualValue",
    "completionDate",
    "receptionDate",
    "fiscalYear",
  ],
  executive: [
    "status",
    "progress",
    "executivePosition",
    "projectLocationLink",
    "mediaFiles",
  ],
  financial: ["disbursedAmount", "extractDate", "extractValue", "extractPDFs"],
  projectManager: [
    "roaddetails",
    "petroleumCompany",
    "bitumenQuantity",
    "mc",
    "rc",
    "remainingQuantitiesTons",
    "notes",
    "extensionDate",
    "suspensionDate",
    "resumptionDate",
    "decisionName",
    "decisionType",
    "decisionUnit",
    "decisionQuantity",
    "decisionPrice",
    "contractDate",
    "contractPrice",
  ],
  contractual: [
    "publishDate",
    "technicalDecisionDate",
    "financialDecisionDate",
    "assignmentOrderDate",
    "siteHandoverDate",
    "contractualDocuments",
  ],
  employee: [],
};

const UpdateActivity = async (req, res) => {
  try {
    const { activityCode } = req.params;
    const employeeRole = req.currentEmployee.role;

    // ✅ إضافة فلتر المحافظة
    const query = {
      activityCode: activityCode.toUpperCase(),
      ...req.regionFilter,
    };

    const activityToUpdate = await ActivityModel.findOne(query);

    if (!activityToUpdate) {
      return res
        .status(404)
        .json(
          httpStatus.httpFaliureStatus(
            "Activity not found or you don't have permission to update it"
          )
        );
    }

    // ✅ منع تغيير المحافظة إلا للـ super admin
    if (req.body.region && req.userRegion) {
      if (req.body.region !== req.userRegion) {
        return res
          .status(403)
          .json(
            httpStatus.httpFaliureStatus(
              "لا يمكنك تغيير المحافظة إلى محافظة أخرى"
            )
          );
      }
    }

    const allowedFields = updatableFieldsByRole[employeeRole];

    Object.keys(req.body).forEach((key) => {
      if (
        allowedFields.includes(key) &&
        key !== "contractualDocuments" &&
        key !== "activitypdfs"
      ) {
        activityToUpdate[key] = req.body[key];
      }
    });

    if (req.body.extensionDate) {
      if (!Array.isArray(activityToUpdate.extension)) {
        activityToUpdate.extension = [];
      }

      if (activityToUpdate.extension.length === 0) {
        activityToUpdate.extension.push({
          extensionNumber: 0,
          extensionDate: activityToUpdate.completionDate,
        });
      }
      const nextExtensionNumber = activityToUpdate.extension.length;
      activityToUpdate.extension.push({
        extensionNumber: nextExtensionNumber,
        extensionDate: req.body.extensionDate,
      });

      activityToUpdate.completionDate = req.body.extensionDate;
    }

    if (req.body.disbursedAmount !== undefined) {
      const totalInvoices = Array.isArray(activityToUpdate.extract)
        ? activityToUpdate.extract.reduce((sum, inv) => {
            const val = parseFloat(inv.extractValue) || 0;
            return sum + val;
          }, 0)
        : 0;

      activityToUpdate.disbursedAmount =
        parseFloat(req.body.disbursedAmount) + totalInvoices;
    }

    if (req.body.roaddetails) {
      const road = req.body.roaddetails;

      activityToUpdate.roaddetails = {
        petroleumCompany: Array.isArray(road.petroleumCompany)
          ? road.petroleumCompany[0] || "N/A"
          : road.petroleumCompany || "N/A",
        bitumenQuantity: Array.isArray(road.bitumenQuantity)
          ? parseFloat(road.bitumenQuantity[0]) || 0
          : parseFloat(road.bitumenQuantity) || 0,
        mc: Array.isArray(road.mc)
          ? parseFloat(road.mc[0]) || 0
          : parseFloat(road.mc) || 0,
        rc: Array.isArray(road.rc)
          ? parseFloat(road.rc[0]) || 0
          : parseFloat(road.rc) || 0,
        remainingQuantitiesTons: Array.isArray(road.remainingQuantitiesTons)
          ? parseFloat(road.remainingQuantitiesTons[0]) || 0
          : parseFloat(road.remainingQuantitiesTons) || 0,
        notes: Array.isArray(road.notes)
          ? road.notes[0] || ""
          : road.notes || "",
      };
    }

    if (req.files?.images?.length > 0) {
      if (!Array.isArray(activityToUpdate.images)) {
        activityToUpdate.images = [];
      }
      for (const file of req.files.images) {
        const { publicUrl } = await saveImageLocally(file);
        activityToUpdate.images.push(publicUrl);
      }
    }

    if (req.files?.contractualDocuments?.length > 0) {
      if (!Array.isArray(activityToUpdate.contractualDocuments)) {
        activityToUpdate.contractualDocuments = [];
      }
      for (const file of req.files.contractualDocuments) {
        const { publicUrl, originalName } = await savePdfLocally(
          file,
          "contractualDocuments"
        );
        activityToUpdate.contractualDocuments.push({
          filename: originalName,
          path: publicUrl,
        });
      }
    }

    if (req.files?.activitypdfs?.length > 0) {
      if (!Array.isArray(activityToUpdate.activitypdfs)) {
        activityToUpdate.activitypdfs = [];
      }
      for (const file of req.files.activitypdfs) {
        const { publicUrl, originalName } = await savePdfLocally(
          file,
          "activitypdfs"
        );
        activityToUpdate.activitypdfs.push({
          filename: originalName,
          path: publicUrl,
        });
      }
    }

    const updatedActivity = await activityToUpdate.save();

    res.status(200).json(httpStatus.httpSuccessStatus(updatedActivity));
  } catch (error) {
    console.error(error);
    res.status(400).json(httpStatus.httpErrorStatus(error.message));
  }
};

// ==================== بناء الفلتر ====================
const buildActivityFilter = (query, regionFilter = {}) => {
  const filter = { $and: [] };

  // ✅ أضف فلتر المحافظة لو موجود
  if (regionFilter && Object.keys(regionFilter).length > 0) {
    filter.$and.push(regionFilter);
  }

  if (query.name) {
    filter.$and.push({
      activityName: { $regex: query.name, $options: "i" },
    });
  }

  if (query.region && query.region !== "الكل") {
    filter.$and.push({ region: query.region });
  }

  if (query.status && query.status !== "الكل") {
    filter.$and.push({ status: query.status });
  }

  if (query.fiscalYear && query.fiscalYear !== "الكل") {
    filter.$and.push({ fiscalYear: query.fiscalYear });
  }

  if (query.activityCode) {
    filter.$and.push({
      activityCode: query.activityCode.toUpperCase(),
    });
  }

  if (query.fundingType && query.fundingType !== "الكل") {
    filter.$and.push({ fundingType: query.fundingType });
  }

  if (query.projectCategory && query.projectCategory !== "الكل") {
    filter.$and.push({ projectCategory: query.projectCategory });
  }

  if (query.disbursedPercentageMin || query.disbursedPercentageMax) {
    const percentageExpr = {
      $multiply: [
        {
          $divide: [
            "$disbursedAmount",
            {
              $cond: [
                { $eq: ["$contractualValue", 0] },
                1,
                "$contractualValue",
              ],
            },
          ],
        },
        100,
      ],
    };

    const exprConditions = [];

    if (query.disbursedPercentageMin) {
      exprConditions.push({
        $gte: [percentageExpr, Number(query.disbursedPercentageMin)],
      });
    }

    if (query.disbursedPercentageMax) {
      exprConditions.push({
        $lte: [percentageExpr, Number(query.disbursedPercentageMax)],
      });
    }

    filter.$and.push({ $expr: { $and: exprConditions } });
  }

  if (query.progressMin || query.progressMax) {
    const progressCondition = {};

    if (query.progressMin) {
      progressCondition.$gte = Number(query.progressMin);
    }
    if (query.progressMax) {
      progressCondition.$lte = Number(query.progressMax);
    }

    filter.$and.push({ progress: progressCondition });
  }

  // ✅ لو فيه شروط، ارجع $and، لو مفيش ارجع object فاضي أو regionFilter
  if (filter.$and.length > 1) {
    return filter;
  } else if (filter.$and.length === 1) {
    return filter.$and[0]; // ارجع الشرط الوحيد بدون $and
  } else {
    return {}; // مفيش أي شروط
  }
};

// ==================== جلب كل المشاريع ====================
const GetAllActivites = async (req, res) => {
  try {
    console.log("=== GET ALL ACTIVITIES DEBUG ===");
    console.log("req.regionFilter:", JSON.stringify(req.regionFilter));
    console.log("req.userRegion:", req.userRegion);
    console.log(
      "req.currentEmployee:",
      req.currentEmployee
        ? {
            name: req.currentEmployee.name,
            role: req.currentEmployee.role,
            region: req.currentEmployee.region,
          }
        : "undefined"
    );
    console.log("req.query:", JSON.stringify(req.query));

    const sampleActivity = await ActivityModel.findOne({});
    console.log(
      "📌 Sample Activity Fields:",
      sampleActivity
        ? {
            activityCode: sampleActivity.activityCode,
            activityName: sampleActivity.activityName,
            region: sampleActivity.region,
            governorate: sampleActivity.governorate,
            allFields: Object.keys(sampleActivity.toObject()),
          }
        : "No activities found"
    );

    const totalActivities = await ActivityModel.countDocuments({});
    console.log("📊 Total Activities in DB (no filter):", totalActivities);

    const testRegion = await ActivityModel.countDocuments({
      region: "الإسماعيلية",
    });
    const testGovernorate = await ActivityModel.countDocuments({
      governorate: "الإسماعيلية",
    });
    console.log("🔍 Activities with region='الإسماعيلية':", testRegion);
    console.log(
      "🔍 Activities with governorate='الإسماعيلية':",
      testGovernorate
    );

    const filter = buildActivityFilter(req.query, req.regionFilter);

    console.log("Final Filter:", JSON.stringify(filter, null, 2));

    const activities = await ActivityModel.find(filter, { __v: 0, _id: 0 });
    const activityCount = await ActivityModel.countDocuments(filter);

    console.log("Activities Found:", activityCount);
    console.log("================================");

    const responseData = {
      total: activityCount,
      activities: activities,
    };

    res.status(200).json(httpStatus.httpSuccessStatus(responseData));
  } catch (error) {
    console.error("Error in GetAllActivites:", error);
    res.status(500).json(httpStatus.httpErrorStatus(error.message));
  }
};

// ==================== الإحصائيات ====================
const GetActivitiesStatistics = async (req, res) => {
  try {
    const query = req.query;
    const matchFilter = {};

    // Apply filters
    if (query.name) {
      matchFilter.activityName = { $regex: query.name, $options: "i" };
    }
    if (query.governorate && query.governorate !== "الكل") {
      matchFilter.governorate = query.governorate;
    }
    if (query.status && query.status !== "الكل") {
      matchFilter.status = query.status;
    }
    if (query.fiscalYear && query.fiscalYear !== "الكل") {
      matchFilter.fiscalYear = query.fiscalYear;
    }
    if (query.activityCode) {
      matchFilter.activityCode = query.activityCode.toUpperCase();
    }
    if (query.fundingType && query.fundingType !== "الكل") {
      matchFilter.fundingType = query.fundingType;
    }
    if (query.projectCategory && query.projectCategory !== "الكل") {
      matchFilter.projectCategory = query.projectCategory;
    }
    if (query.progressMin || query.progressMax) {
      matchFilter.progress = {};
      if (query.progressMin) {
        matchFilter.progress.$gte = Number(query.progressMin);
      }
      if (query.progressMax) {
        matchFilter.progress.$lte = Number(query.progressMax);
      }
    }

    const statistics = await ActivityModel.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$governorate",
          governorate: { $first: "$governorate" },
          totalActivities: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "مكتمل"] }, 1, 0] },
          },
          begin: {
            $sum: { $cond: [{ $eq: ["$status", "تحت الطرح"] }, 1, 0] },
          },
          withdrawn: {
            $sum: { $cond: [{ $eq: ["$status", "مسحوب"] }, 1, 0] },
          },
          inProgress: {
            $sum: {
              $cond: [{ $eq: ["$status", "قيد التنفيذ"] }, 1, 0],
            },
          },
          suspended: {
            $sum: { $cond: [{ $eq: ["$status", "متوقف"] }, 1, 0] },
          },
          initialDelivery: {
            $sum: { $cond: [{ $eq: ["$status", "تسليم ابتدائي"] }, 1, 0] },
          },
          finalDelivery: {
            $sum: { $cond: [{ $eq: ["$status", "تسليم نهائي"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          governorate: 1,
          totalActivities: 1,
          begin: 1,
          completed: 1,
          withdrawn: 1,
          inProgress: 1,
          suspended: 1,
          initialDelivery: 1,
          finalDelivery: 1,
        },
      },
      { $sort: { governorate: 1 } },
    ]);

    res.status(200).json(httpStatus.httpSuccessStatus(statistics));
  } catch (error) {
    res.status(500).json(httpStatus.httpErrorStatus(error.message));
  }
};

// ==================== إجمالي المنصرف ====================
const getTotalDisbursed = async (req, res) => {
  try {
    const targetFiscalYear =
      req.query.extractFiscalYear || req.query.fiscalYear;

    let queryForFilter = { ...req.query };

    if (queryForFilter.extractFiscalYear)
      delete queryForFilter.extractFiscalYear;
    if (queryForFilter.fiscalYear) delete queryForFilter.fiscalYear;

    const filter = buildActivityFilter(queryForFilter, req.regionFilter);

    let totalDisbursed = 0;

    if (targetFiscalYear) {
      const activities = await ActivityModel.find(
        filter,
        "extract activityCode"
      );

      totalDisbursed = activities.reduce((total, activity) => {
        const yearTotal = activity.extract
          .filter((ex) => ex.extractFiscalYear === targetFiscalYear)
          .reduce((sum, ex) => sum + (ex.extractValue || 0), 0);

        return total + yearTotal;
      }, 0);
    } else {
      const activities = await ActivityModel.find(filter, "disbursedAmount");
      totalDisbursed = activities.reduce(
        (sum, activity) => sum + (activity.disbursedAmount || 0),
        0
      );
    }

    res.json(httpStatus.httpSuccessStatus({ totalDisbursed }));
  } catch (error) {
    res.status(500).json(httpStatus.httpErrorStatus(error.message));
  }
};

// ==================== إجمالي المخصص المالي ====================
const getTotalContractualValue = async (req, res) => {
  try {
    const filter = buildActivityFilter(req.query, req.regionFilter);

    const activities = await ActivityModel.find(filter, "contractualValue");

    const totalContractualValue = activities.reduce(
      (sum, activity) => sum + (activity.contractualValue || 0),
      0
    );

    res.json(httpStatus.httpSuccessStatus({ totalContractualValue }));
  } catch (error) {
    res.status(500).json(httpStatus.httpErrorStatus(error.message));
  }
};

// ==================== حذف PDF ====================
const DeletePdfFromActivity = async (req, res) => {
  try {
    const { activityCode, pdfPath } = req.body;
    const { bucketName } = req.params;

    const fieldMap = {
      activitypdfs: "activitypdfs",
      contractualDocuments: "contractualDocuments",
    };

    const fieldName = fieldMap[bucketName];
    if (!fieldName) {
      return res
        .status(400)
        .json(httpStatus.httpFaliureStatus("Invalid bucket name"));
    }

    const query = {
      activityCode: activityCode.toUpperCase(),
      ...req.regionFilter,
    };

    const activity = await ActivityModel.findOne(query);

    if (!activity) {
      return res
        .status(404)
        .json(
          httpStatus.httpFaliureStatus(
            "Project not found or you don't have permission"
          )
        );
    }

    const fileName = decodeURIComponent(pdfPath.split("/").pop());
    const filePath = path.join(process.cwd(), "uploads", bucketName, fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    activity[fieldName] = activity[fieldName].filter(
      (pdf) => pdf.path !== pdfPath
    );
    await activity.save();

    res
      .status(200)
      .json(httpStatus.httpSuccessStatus("PDF deleted successfully..."));
  } catch (err) {
    res.status(500).json(httpStatus.httpErrorStatus(err.message));
  }
};

// ==================== حذف صورة ====================
const DeleteImageFromActivity = async (req, res) => {
  try {
    const { activityCode, imagePath } = req.body;

    const query = {
      activityCode: activityCode.toUpperCase(),
      ...req.regionFilter,
    };

    const activity = await ActivityModel.findOne(query);

    if (!activity) {
      return res
        .status(404)
        .json(
          httpStatus.httpFaliureStatus(
            "Project not found or you don't have permission"
          )
        );
    }

    const fileName = decodeURIComponent(imagePath.split("/").pop());
    const filePath = path.join(
      process.cwd(),
      "uploads",
      "activityimages",
      fileName
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    activity.images = activity.images.filter((img) => img !== imagePath);
    await activity.save();

    res.status(200).json(httpStatus.httpSuccessStatus("Image deleted"));
  } catch (err) {
    res.status(500).json(httpStatus.httpErrorStatus(err.message));
  }
};

const ExportExcel = async (req, res) => {
  try {
    const query = {};

    if (req.query.name)
      query.activityName = { $regex: req.query.name, $options: "i" };
    if (req.query.governorate) query.governorate = req.query.governorate;
    if (req.query.activityCode) query.activityCode = req.query.activityCode;
    if (req.query.status) query.status = req.query.status;
    if (req.query.fundingType) query.fundingType = req.query.fundingType;
    if (req.query.projectCategory)
      query.projectCategory = req.query.projectCategory;
    if (req.query.fiscalYear) query.fiscalYear = req.query.fiscalYear;

    const activities = await ActivityModel.find(query);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("تقرير المشاريع");
    worksheet.views = [{ rightToLeft: true }];

    const now = new Date();
    const currentYear =
      now.getMonth() + 1 >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    const nextYear = currentYear + 1;
    const fiscalStart = new Date(currentYear, 6, 1);
    const fiscalEnd = new Date(nextYear, 5, 30, 23, 59, 59);

    const headerRow1 = [
      "رقم المسلسل",
      "اسم المشروع",
      "الشركة المنفذة",
      "القيمة التعاقديه",
      "القيمة المعدله",
      `المنصرف خلال العام المالي ${nextYear}/${currentYear}`,
      "إجمالي المنصرف",
      "نسبة الصرف",
      "نسبة التنفيذ الحالية",
      "الموقع الجغرافي",
      "تاريخ البدء",
      "تاريخ النهو",
      "الموقف التنفيذي",
    ];

    worksheet.addRow(headerRow1);

    // ==== إضافة البيانات ====
    let serial = 1;
    activities.forEach((activity) => {
      const contractualValue = activity.contractualValue || 0;

      // إجمالي المنصرف
      const totalDisbursed =
        activity.extract?.reduce(
          (sum, ext) => sum + (ext.extractValue || 0),
          0
        ) || 0;

      const currentYearDisbursed =
        activity.extract
          ?.filter((ext) => {
            const d = new Date(ext.extractDate);
            return d >= fiscalStart && d <= fiscalEnd;
          })
          .reduce((sum, ext) => sum + (ext.extractValue || 0), 0) || 0;

      worksheet.addRow([
        serial++,
        activity.activityName || "",
        activity.executingCompany || "",
        activity.contractualValue || 0,
        activity.estimatedValue || 0,

        currentYearDisbursed,
        totalDisbursed,
        contractualValue > 0
          ? ((totalDisbursed / contractualValue) * 100).toFixed(2) + "%"
          : "0%",
        activity.progress || "0%",
        activity.projectLocationLink
          ? {
              text: "اضغط لعرض الموقع",
              hyperlink: activity.projectLocationLink,
            }
          : "",
        activity.receptionDate ? new Date(activity.receptionDate) : "",
        activity.completionDate ? new Date(activity.completionDate) : "",
        activity.executivePosition || "",
      ]);
    });

    const columnsWidths = [10, 50, 25, 20, 15, 20, 20, 15, 15, 30, 20, 20, 40];
    columnsWidths.forEach((w, i) => {
      worksheet.getColumn(i + 1).width = w;
      worksheet.getColumn(i + 1).alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
    });

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };

        if (rowNumber === 1) {
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "1F4E78" },
          };
        } else if (colNumber === 10 && cell.hyperlink) {
          cell.font = {
            color: { argb: "FF0000FF" },
            underline: true,
          };
        }
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename*=UTF-8''" +
        encodeURIComponent("تقرير_المشروعات.xlsx")
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("❌ Error in ExportExcel:", error);
    res.status(500).json({ message: "حدث خطأ أثناء تصدير البيانات" });
  }
};

const DeleteDecisionById = async (req, res) => {
  try {
    const { activityCode, decisionId } = req.params;

    if (
      !decisionId ||
      !require("mongoose").Types.ObjectId.isValid(decisionId)
    ) {
      return res
        .status(400)
        .json(httpStatus.httpFaliureStatus("Invalid decision ID format"));
    }

    const updatedActivity = await ActivityModel.findOneAndUpdate(
      { activityCode: activityCode.toUpperCase() },
      { $pull: { decision: { _id: decisionId } } },
      { new: true, runValidators: true }
    );

    if (!updatedActivity) {
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Activity not found"));
    }

    const decisionExists = updatedActivity.decision.some(
      (decision) => decision._id.toString() === decisionId
    );

    if (decisionExists) {
      return res
        .status(404)
        .json(
          httpStatus.httpFaliureStatus("Decision not found in this activity")
        );
    }

    res.status(200).json(
      httpStatus.httpSuccessStatus({
        message: "Decision deleted successfully",
        activity: updatedActivity,
      })
    );
  } catch (error) {
    console.error("خطأ في حذف البند:", error);
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء الحذف", error: error.message });
  }
};

module.exports = {
  AddNewActivity,
  GetAllActivites,
  GetActivityById,
  DeleteActivity,
  UpdateActivity,
  DeleteImageFromActivity,
  DeletePdfFromActivity,
  ExportExcel,
  getTotalDisbursed,
  GetActivitiesStatistics,
  getTotalContractualValue,
};
