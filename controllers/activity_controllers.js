const ActivityModel = require("../Models/activity_model");
const httpStatus = require("../utils/http_status");
const supabase = require("../utils/supabase");
const fs = require("fs");
const ExcelJS = require("exceljs");
const saveImageLocally = require("../utils/uploadImage");
const savePdfLocally = require("../utils/uploadPDF");
const path = require("path");
const mongoose = require("mongoose");

const buildActivityFilter = (query, regionFilter = {}) => {
  const filter = {};

  if (regionFilter?.governorate) {
    filter.governorate = regionFilter.governorate;
  } else if (
    query.governorate &&
    query.governorate !== "الكل" &&
    query.governorate !== ""
  ) {
    filter.governorate = query.governorate;
  }

  if (query.name) {
    filter.activityName = {
      $regex: query.name,
      $options: "i",
    };
  }

  if (query.status && query.status !== "الكل") {
    filter.status = query.status;
  }

  if (query.fundingSource && query.fundingSource !== "الكل") {
    filter.fundingSource = query.fundingSource;
  }

  if (query.fundingType && query.fundingType !== "الكل") {
    filter.fundingType = query.fundingType;
  }

  if (query.projectCategory && query.projectCategory !== "الكل") {
    filter.projectCategory = query.projectCategory;
  }

  if (query.activityCode) {
    filter.activityCode = query.activityCode.toUpperCase();
  }

  if (query.hasContract && query.hasContract !== "الكل") {
    if (query.hasContract === "نعم" || query.hasContract === "true") {
      filter["contract.0"] = { $exists: true };
    } else if (query.hasContract === "لا" || query.hasContract === "false") {
      filter["contract.0"] = { $exists: false };
    }
  }

  if (query.hasExtension && query.hasExtension !== "الكل") {
    if (query.hasExtension === "نعم" || query.hasExtension === "true") {
      filter["extension.0"] = { $exists: true };
    } else if (query.hasExtension === "لا" || query.hasExtension === "false") {
      filter["extension.0"] = { $exists: false };
    }
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

    const conditions = [];

    if (query.disbursedPercentageMin) {
      conditions.push({
        $gte: [percentageExpr, Number(query.disbursedPercentageMin)],
      });
    }

    if (query.disbursedPercentageMax) {
      conditions.push({
        $lte: [percentageExpr, Number(query.disbursedPercentageMax)],
      });
    }

    filter.$expr = { $and: conditions };
  }

  if (query.progressMin || query.progressMax) {
    filter.progress = {};

    if (query.progressMin) {
      filter.progress.$gte = Number(query.progressMin);
    }

    if (query.progressMax) {
      filter.progress.$lte = Number(query.progressMax);
    }
  }

  return filter;
};

// ==================== إضافة مشروع جديد ====================
const AddNewActivity = async (req, res) => {
  try {
    if (req.userRegion && req.userRegion !== "super") {
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
              `غير مسموح لك بإضافة مشاريع إلا في محافظتك: ${req.userRegion}`
            )
          );
      }
    } else if (!req.body.governorate) {
      return res
        .status(400)
        .json(httpStatus.httpFaliureStatus("يجب تحديد المحافظة"));
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
      governorate: req.body.governorate.trim(),
      originalCompletionDate: req.body.completionDate,
      contractualDocuments: [],
      activitypdfs: [],
      images: [],
      roaddetails: processedRoadDetails,
    };

    // 4. الحفظ
    const newActivity = new ActivityModel(newActivityData);
    await newActivity.save();

    res.status(201).json(httpStatus.httpSuccessStatus(newActivity));
  } catch (error) {
    console.error("Error in AddNewActivity:", error);
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
    console.error("Error in GetActivityById:", error);
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
        const fileName = decodeURIComponent(relativePath.split("/").pop());

        let folderName = "";
        if (relativePath.includes("activityimages")) {
          folderName = "activityimages";
        } else if (relativePath.includes("contractualDocuments")) {
          folderName = "contractualDocuments";
        } else if (relativePath.includes("activitypdfs")) {
          folderName = "activitypdfs";
        } else if (relativePath.includes("extractpdfs")) {
          folderName = "extractpdfs";
        }

        if (folderName) {
          const filePath = path.join(
            process.cwd(),
            "uploads",
            folderName,
            fileName
          );
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
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

// ==================== صلاحيات الحقول للتعديل ====================
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

// ==================== تعديل مشروع ====================
const UpdateActivity = async (req, res) => {
  try {
    const { activityCode } = req.params;
    const employeeRole = req.currentEmployee?.role;
    const userRegion = req.userRegion;

    if (!employeeRole) {
      return res
        .status(401)
        .json(
          httpStatus.httpFaliureStatus(
            "Authentication failed: User role not found."
          )
        );
    }

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

    if (
      req.body.governorate &&
      userRegion !== "الكل" &&
      userRegion !== "" &&
      userRegion !== null
    ) {
      if (req.body.governorate.trim() !== activityToUpdate.governorate.trim()) {
        return res
          .status(403)
          .json(
            httpStatus.httpFaliureStatus(
              `غير مسموح لك بتغيير المحافظة إلا في محافظتك: ${userRegion}`
            )
          );
      }

      delete req.body.governorate;
    } else if (req.body.governorate && userRegion === "super") {
      activityToUpdate.governorate = req.body.governorate.trim();
      delete req.body.governorate;
    }

    const allowedFields = updatableFieldsByRole[employeeRole] || [];

    Object.keys(req.body).forEach((key) => {
      if (
        allowedFields.includes(key) &&
        key !== "contractualDocuments" &&
        key !== "activitypdfs" &&
        key !== "extractpdfs"
      ) {
        if (
          key === "roaddetails" ||
          key === "extensionDate" ||
          key === "disbursedAmount"
        )
          return;

        activityToUpdate[key] = req.body[key];
      }
    });

    if (req.body.extensionDate && allowedFields.includes("extensionDate")) {
      if (!Array.isArray(activityToUpdate.extension)) {
        activityToUpdate.extension = [];
      }

      const nextExtensionNumber = activityToUpdate.extension.length;
      activityToUpdate.extension.push({
        extensionNumber: nextExtensionNumber,
        extensionDate: req.body.extensionDate,
      });
      const extensionDate = new Date(req.body.extensionDate);
      activityToUpdate.completionDate = extensionDate;

      if (activityToUpdate.status === "متأخر" && extensionDate > Date.now()) {
        activityToUpdate.status = "قيد التنفيذ";
      }
    }

    if (
      req.body.disbursedAmount !== undefined &&
      allowedFields.includes("disbursedAmount")
    ) {
      activityToUpdate.disbursedAmount = parseFloat(req.body.disbursedAmount);
    }

    if (req.body.roaddetails && allowedFields.includes("roaddetails")) {
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
      if (!Array.isArray(activityToUpdate.images)) activityToUpdate.images = [];
      for (const file of req.files.images) {
        const { publicUrl } = await saveImageLocally(file);
        activityToUpdate.images.push(publicUrl);
      }
    }

    if (
      req.files?.contractualDocuments?.length > 0 &&
      allowedFields.includes("contractualDocuments")
    ) {
      if (!Array.isArray(activityToUpdate.contractualDocuments))
        activityToUpdate.contractualDocuments = [];
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
      if (!Array.isArray(activityToUpdate.activitypdfs))
        activityToUpdate.activitypdfs = [];
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
    console.error("Error in UpdateActivity:", error);
    res.status(400).json(httpStatus.httpErrorStatus(error.message));
  }
};

// ==================== جلب كل المشاريع ====================
const GetAllActivites = async (req, res) => {
  try {
    const filter = buildActivityFilter(req.query, req.regionFilter);

    const activities = await ActivityModel.find(filter, { __v: 0, _id: 0 });
    const activityCount = await ActivityModel.countDocuments(filter);

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
    const matchFilter = buildActivityFilter(req.query, req.regionFilter);

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
          late: {
            $sum: { $cond: [{ $eq: ["$status", "متأخر"] }, 1, 0] },
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
          late: 1,
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
    console.error("Error in GetActivitiesStatistics:", error);
    res.status(500).json(httpStatus.httpErrorStatus(error.message));
  }
};

// ==================== إجمالي المنصرف ====================
const getTotalDisbursed = async (req, res) => {
  try {
    const targetFiscalYear =
      req.query.extractFiscalYear || req.query.fiscalYear;

    let queryForFilter = { ...req.query };
    delete queryForFilter.extractFiscalYear;
    delete queryForFilter.fiscalYear;

    const filter = buildActivityFilter(queryForFilter, req.regionFilter);

    const activities = await ActivityModel.find(filter, "extract activityCode");

    const totalDisbursed = activities.reduce((total, activity) => {
      const extracts = Array.isArray(activity.extract) ? activity.extract : [];

      const extractsToSum = targetFiscalYear
        ? extracts.filter((ex) => ex.extractFiscalYear === targetFiscalYear)
        : extracts;

      const projectTotal = extractsToSum.reduce(
        (sum, ex) => sum + (ex.extractValue || 0),
        0
      );

      return total + projectTotal;
    }, 0);

    res.json(httpStatus.httpSuccessStatus({ totalDisbursed }));
  } catch (error) {
    res.status(500).json(httpStatus.httpErrorStatus(error.message));
  }
};
// ==================== إجمالي المخصص المالي ====================
const getTotalContractualValue = async (req, res) => {
  try {
    // استخراج السنة المالية
    const targetFiscalYear =
      req.query.extractFiscalYear || req.query.fiscalYear;

    // نسخ الـ query وحذف المعاملات
    let queryForFilter = { ...req.query };
    delete queryForFilter.extractFiscalYear;
    delete queryForFilter.fiscalYear;

    // بناء الفلتر الأساسي
    const filter = buildActivityFilter(queryForFilter, req.regionFilter);

    // ✅ إضافة فلتر السنة المالية بعد بناء الفلتر
    if (targetFiscalYear) {
      filter.fiscalYear = targetFiscalYear;
    }

    console.log("الـ Filter النهائي هو:", filter);

    // جلب المشاريع
    const activities = await ActivityModel.find(
      filter,
      "contractualValue activityCode fiscalYear"
    );

    // حساب الإجمالي
    const totalContractualValue = activities.reduce(
      (sum, activity) => sum + (activity.contractualValue || 0),
      0
    );

    res.json(httpStatus.httpSuccessStatus({ totalContractualValue }));
  } catch (error) {
    console.error("Error in getTotalContractualValue:", error);
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
      extractpdfs: "extractpdfs",
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
    console.error("Error in DeletePdfFromActivity:", err);
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
    console.error("Error in DeleteImageFromActivity:", err);
    res.status(500).json(httpStatus.httpErrorStatus(err.message));
  }
};

// ==================== تصدير إكسيل (لم يتم تطبيق فلترة المنطقة في الـ query) ====================
const ExportExcel = async (req, res) => {
  try {
    const filter = buildActivityFilter(req.query, req.regionFilter);

    const activities = await ActivityModel.find(filter);

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
      "المحافظة",
      "القيمة التعاقديه",
      "القيمة المعدله",
      `المنصرف خلال العام المالي ${currentYear}/${nextYear}`,
      "إجمالي المنصرف",
      "نسبة الصرف",
      "نسبة التنفيذ الحالية",
      "الموقع الجغرافي",
      "تاريخ البدء",
      "تاريخ النهو",
      "الموقف التنفيذي",
    ];

    worksheet.addRow(headerRow1);

    let serial = 1;
    activities.forEach((activity) => {
      const contractualValue = activity.contractualValue || 0;

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
        activity.governorate || "",
        activity.estimatedValue || 0,
        activity.contractualValue || 0,

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

    // تنسيق الأعمدة
    const columnsWidths = [
      10, 50, 25, 20, 20, 15, 25, 20, 15, 15, 30, 20, 20, 40,
    ];
    columnsWidths.forEach((w, i) => {
      worksheet.getColumn(i + 1).width = w;
      worksheet.getColumn(i + 1).alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
    });

    // تنسيق الخلايا
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
        } else if (colNumber === 11 && cell.hyperlink) {
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

// ==================== حذف قرار (Decision) ====================
const DeleteDecisionById = async (req, res) => {
  try {
    const { activityCode, decisionId } = req.params;

    if (!decisionId || !mongoose.Types.ObjectId.isValid(decisionId)) {
      return res
        .status(400)
        .json(httpStatus.httpFaliureStatus("Invalid decision ID format"));
    }

    // ✅ بناء الـ query: يتضمن فلتر المنطقة (req.regionFilter)
    const query = {
      activityCode: activityCode.toUpperCase(),
      ...req.regionFilter,
    };

    const updatedActivity = await ActivityModel.findOneAndUpdate(
      query,
      { $pull: { decision: { _id: decisionId } } },
      { new: true, runValidators: true }
    );

    if (!updatedActivity) {
      return res
        .status(404)
        .json(
          httpStatus.httpFaliureStatus("Activity not found or not accessible")
        );
    }

    // يجب التحقق من عدم وجود القرار بعد التحديث للعثور على الخطأ بشكل صحيح
    const decisionExistsAfterPull = updatedActivity.decision.some(
      (decision) => decision._id.toString() === decisionId
    );

    if (decisionExistsAfterPull) {
      // هذا الشرط لن يتحقق إذا كان $pull قد نجح
      return res
        .status(500)
        .json(httpStatus.httpFaliureStatus("Failed to remove decision."));
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
  DeleteDecisionById,
};
