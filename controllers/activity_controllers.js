const ActivityModel = require("../Models/activity_model");
const httpStatus = require("../utils/http_status");
const supabase = require("../utils/supabase");
const fs = require("fs");
const ExcelJS = require("exceljs");
const saveImageLocally = require("../utils/uploadImage");
const savePdfLocally = require("../utils/uploadPDF");
const path = require("path");

const AddNewActivity = async (req, res) => {
  console.log("Received request body:", req.body);
  try {
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

/* const GetAllActivites = async (req, res) => {
  try {
    const activities = await ActivityModel.find({}, { __v: 0, _id: 0 });
    const activityCount = await ActivityModel.countDocuments({});
    const responseData = {
      total: activityCount,
      activities: activities,
    };
    res.status(200).json(httpStatus.httpSuccessStatus(responseData));
  } catch (error) {
    res.status(500).json(httpStatus.httpErrorStatus(error));
  }
}; ;*/

const GetActivityById = async (req, res) => {
  try {
    const { activityCode } = req.params;
    const activity = await ActivityModel.findOne({
      activityCode: activityCode.toUpperCase(),
    });

    if (!activity)
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Activity not found"));

    // res.json(employee);
    res.status(200).json(httpStatus.httpSuccessStatus(activity));
  } catch (error) {
    res.status(400).json(httpStatus.httpErrorStatus(error.message));
  }
};

const DeleteActivity = async (req, res) => {
  try {
    const { activityCode } = req.params;

    const activity = await ActivityModel.findOne({
      activityCode: activityCode.toUpperCase(),
    });

    if (!activity) {
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Activity not found"));
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
        } else {
          console.warn("File not found on disk:", filePath);
        }
      });
    };

    deleteFiles(activity.images);
    deleteFiles(activity.activitypdfs);
    deleteFiles(activity.contractualDocuments);
    deleteFiles(activity.extractpdfs);

    await ActivityModel.findOneAndDelete({
      activityCode: activityCode.toUpperCase(),
    });

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

const updatableFieldsByRole = {
  admin: [
    "activityName",
    "executingCompany",
    "fundingType",
    "projectCategory",
    "consultant",
    "governorate",
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
    // التخطيط والمتابعة فقط
    "activityName",
    "executingCompany",
    "governorate",
    "projectCategory",
    "fundingType",
    "consultant",
    "activityDescription",
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

/* const UpdateActivity = async (req, res) => {
  try {
    const { activityCode } = req.params;
    const UpdateActivity = await ActivityModel.findOneAndUpdate(
      { activityCode: activityCode.toUpperCase() },
      { $set: req.body },
      { new: true }
    );
    if (!UpdateActivity)
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Activity not found"));

    res.status(200).json(httpStatus.httpSuccessStatus(UpdateActivity));
  } catch (error) {
    res.status(400).json(httpStatus.httpErrorStatus(error.message));
  }
}; */

const UpdateActivity = async (req, res) => {
  try {
    const { activityCode } = req.params;
    const employeeRole = req.currentEmployee.role;

    const activityToUpdate = await ActivityModel.findOne({
      activityCode: activityCode.toUpperCase(),
    });

    if (!activityToUpdate) {
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Activity not found"));
    }

    const allowedFields = updatableFieldsByRole[employeeRole];

    Object.keys(req.body).forEach((key) => {
      if (
        allowedFields.includes(key) &&
        key !== "contractualDocuments" &&
        key !== "activitypdfs"
      ) {
        activityToUpdate[key] = req.body[key];
      } else if (key !== "contractualDocuments" && key !== "activitypdfs") {
        console.log(`Field ${key} not allowed for role ${employeeRole}`);
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
      console.log(`المنصرف القديم = ${activityToUpdate.disbursedAmount}`);
      console.log(`المنصرف الجديد المدخل = ${req.body.disbursedAmount}`);

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
        const { publicUrl, originalName } = await saveImageLocally(file);
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

    console.log("activitypdfs files:", req.files?.activitypdfs);
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
    console.log("PDFs Saved:", activityToUpdate.activitypdfs);
    const updatedActivity = await activityToUpdate.save();

    res.status(200).json(httpStatus.httpSuccessStatus(updatedActivity));
  } catch (error) {
    console.error(error);
    res.status(400).json(httpStatus.httpErrorStatus(error.message));
  }
};

const buildActivityFilter = (query) => {
  const filter = { $and: [] };

  if (query.name) {
    filter.$and.push({
      activityName: { $regex: query.name, $options: "i" },
    });
  }

  if (query.governorate && query.governorate !== "الكل") {
    filter.$and.push({ governorate: query.governorate });
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

  // نسبة الصرف
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

  // progress
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

  return filter.$and.length > 0 ? filter : {};
};

const GetAllActivites = async (req, res) => {
  try {
    const filter = buildActivityFilter(req.query);

    console.log("Filtering with:", filter);

    const activities = await ActivityModel.find(filter, { __v: 0, _id: 0 });
    const activityCount = await ActivityModel.countDocuments(filter);
    /*  activities.forEach((a) => {
      const percentage =
        (a.disbursedAmount /
          (a.contractualValue === 0 ? 1 : a.contractualValue)) *
        100;

      console.log(`📌 ${a.activityName} => ${percentage.toFixed(2)}%`);
    });
 */
    const responseData = {
      total: activityCount,
      activities: activities,
    };

    res.status(200).json(httpStatus.httpSuccessStatus(responseData));
  } catch (error) {
    res.status(500).json(httpStatus.httpErrorStatus(error.message));
  }
};

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

    /*     if (query.disbursedAmountMin || query.disbursedAmountMax) {
      matchFilter.disbursedAmount = {};
      if (query.progressMin) {
        matchFilter.disbursedAmount.$gte = Number(query.disbursedAmountMin);
      }
      if (query.disbursedAmountMax) {
        matchFilter.disbursedAmount.$lte = Number(query.disbursedAmountMax);
      }
    } */

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

const getTotalDisbursed = async (req, res) => {
  try {
    const targetFiscalYear =
      req.query.extractFiscalYear || req.query.fiscalYear;

    let queryForFilter = { ...req.query };

    if (queryForFilter.extractFiscalYear)
      delete queryForFilter.extractFiscalYear;
    if (queryForFilter.fiscalYear) delete queryForFilter.fiscalYear;

    const filter = buildActivityFilter(queryForFilter);

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

    console.log("Final Total:", totalDisbursed);
    res.json(httpStatus.httpSuccessStatus({ totalDisbursed }));
  } catch (error) {
    console.error("Error getting total disbursed:", error);
    res.status(500).json(httpStatus.httpErrorStatus(error.message));
  }
};

const getTotalContractualValue = async (req, res) => {
  try {
    const filter = buildActivityFilter(req.query);

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
      console.log("Bucket name received:", bucketName);
      return res
        .status(400)
        .json(httpStatus.httpFaliureStatus("Invalid bucket name"));
    }

    const activity = await ActivityModel.findOne({
      activityCode: activityCode.toUpperCase(),
    });

    if (!activity) {
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Project not found"));
    }

    const fileName = decodeURIComponent(pdfPath.split("/").pop());
    const filePath = path.join(process.cwd(), "uploads", bucketName, fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    } else {
      console.log("File not found at path:", filePath);
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("File not found in uploads"));
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

const DeleteImageFromActivity = async (req, res) => {
  try {
    const { activityCode, imagePath } = req.body;

    const activity = await ActivityModel.findOne({
      activityCode: activityCode.toUpperCase(),
    });

    if (!activity) {
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Project not found"));
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
    } else {
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("File not found in uploads"));
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
      "تاريخ البدء",
      "تاريخ النهو",
      "الملاحظات",
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
        activity.receptionDate ? new Date(activity.receptionDate) : "",
        activity.completionDate ? new Date(activity.completionDate) : "",
        activity.executivePosition || "",
      ]);
    });

    const columnsWidths = [10, 50, 25, 20, 15, 20, 20, 15, 15, 20, 20, 40];
    columnsWidths.forEach((w, i) => {
      worksheet.getColumn(i + 1).width = w;
      worksheet.getColumn(i + 1).alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
    });

    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
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

        if (row.number === 1) {
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "1F4E78" },
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
