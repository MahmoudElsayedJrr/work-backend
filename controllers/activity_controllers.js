const ActivityModel = require("../Models/activity_model");
const httpStatus = require("../utils/http_status");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");

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
    const newActivityData = {
      ...req.body,
      activityCode: req.body.activityCode.toUpperCase(),
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
}; */

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
    const activity = await ActivityModel.findOneAndDelete({
      activityCode: activityCode.toUpperCase(),
    });

    if (!activity)
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Activity not found"));

    res
      .status(200)
      .json(httpStatus.httpSuccessStatus("Activity deleted successfully"));
  } catch (error) {
    res.status(400).json(httpStatus.httpErrorStatus(error.message));
  }
};

const updatableFieldsByRole = {
  admin: [
    "activityCode",
    "activityName",
    "executingCompany",
    "consultant",
    "governorate",
    "fundingType",
    "projectCategory",
    "estimatedValue",
    "contractualValue",
    "disbursedAmount",
    "assignmentDate",
    "completionDate",
    "receptionDate",
    "executionStatus",
    "progress",
    "status",
    "images",
    "activityDescription",
    "activityPdf",
    "projectLocationLink",
    "publishDate",
    "technicalDecisionDate",
    "financialDecisionDate",
    "assignmentOrderDate",
    "siteHandoverDate",
    "contractualDocuments",
  ],
  manager: [
    "activityName",
    "executingCompany",
    "consultant",
    "assignmentDate",
    "completionDate",
    "receptionDate",
    "executionStatus",
    "progress",
    "images",
    "activityDescription",
    "activityPdf",
    "projectLocationLink",
    "publishDate",
    "technicalDecisionDate",
    "financialDecisionDate",
    "assignmentOrderDate",
    "siteHandoverDate",
    "contractualDocuments",
  ],
  financial: [
    "estimatedValue",
    "contractualValue",
    "disbursedAmount",
    "undisbursedAmount",
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
  console.log("FILES RECEIVED:", JSON.stringify(req.files, null, 2));
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

    if (req.body.contractualDocuments === "") {
      req.body.contractualDocuments = [];
    }

    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        activityToUpdate[key] = req.body[key];
      } else {
        console.log(`Field ${key} not allowed for role ${employeeRole}`);
      }
    });

    // حفظ الصور
    if (req.files?.images?.length > 0) {
      const newImagePaths = req.files.images.map(
        (file) => `uploads/activities/${file.filename}`
      );
      activityToUpdate.images.push(...newImagePaths);
    }

    if (req.files?.contractualDocuments?.length > 0) {
      const newContractualDocuments = req.files.contractualDocuments.map(
        (file) => {
          const safeName = Buffer.from(file.originalname, "latin1").toString(
            "utf8"
          );

          return {
            filename: safeName,
            path: `uploads/contractualDocuments/${file.filename}`,
          };
        }
      );

      if (!Array.isArray(activityToUpdate.contractualDocuments)) {
        activityToUpdate.contractualDocuments = [];
      }

      activityToUpdate.contractualDocuments.push(...newContractualDocuments);
    }

    // حفظ ملف PDF
    if (req.files?.activityPdf?.length > 0) {
      const newPdfFiles = req.files.activityPdf.map((file) => {
        const safeName = Buffer.from(file.originalname, "latin1").toString(
          "utf8"
        );

        return {
          filename: safeName,
          path: `uploads/pdfs/${file.filename}`,
        };
      });

      if (!Array.isArray(activityToUpdate.activityPdf)) {
        activityToUpdate.activityPdf = [];
      }

      activityToUpdate.activityPdf.push(...newPdfFiles);
    }

    const updatedActivity = await activityToUpdate.save();

    res.status(200).json(httpStatus.httpSuccessStatus(updatedActivity));
  } catch (error) {
    res.status(400).json(httpStatus.httpErrorStatus(error.message));
  }
};

const uploadActivityImages = async (req, res) => {
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

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json(httpStatus.httpFaliureStatus("No file uploaded"));
    }

    const imagePaths = req.files.map((file) => {
      return path
        .join("uploads", "activities", file.filename)
        .replace(/\\/g, "/");
    });
    activity.images.push(...imagePaths);
    await activity.save();

    res.status(200).json(httpStatus.httpSuccessStatus(activity));
  } catch (error) {
    res.status(500).json(httpStatus.httpErrorStatus(error.message));
  }
};

const getActivityImages = async (req, res) => {
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
    res.status(200).json(
      httpStatus.httpSuccessStatus({
        images: activity.images,
      })
    );

    res.json({ images: imageUrls });
    s;
  } catch (error) {
    res.status(500).json(httpStatus.httpErrorStatus(error.message));
  }
};

const GetAllActivites = async (req, res) => {
  try {
    const query = req.query;
    const filter = {};
    if (query.name) {
      filter.activityName = { $regex: query.name, $options: "i" };
    }
    if (query.governorate && query.governorate !== "الكل") {
      filter.governorate = query.governorate;
    }
    if (query.status && query.status !== "الكل") {
      filter.status = query.status;
    }

    if (query.activityCode) {
      filter.activityCode = query.activityCode.toUpperCase();
    }

    if (query.fundingType && query.fundingType !== "الكل") {
      filter.fundingType = query.fundingType;
    }

    //console.log("Filtering with:", filter);

    const activities = await ActivityModel.find(filter, { __v: 0, _id: 0 });
    const activityCount = await ActivityModel.countDocuments(filter);

    /*   if (activities.length > 0) {
      console.log(
        "شكل المسار المحفوظ في قاعدة البيانات:",
        activities[0].images
      );
    } */

    const responseData = {
      total: activityCount,
      activities: activities,
    };

    res.status(200).json(httpStatus.httpSuccessStatus(responseData));
  } catch (error) {
    res.status(500).json(httpStatus.httpErrorStatus(error.message));
  }
};

const DeletePdfFromActivity = async (req, res) => {
  try {
    console.log("==== وصلت هنا فعلاً ====");
    const { activityCode, pdfPath } = req.body;
    console.log("Received code:", activityCode);

    const activity = await ActivityModel.findOne({
      activityCode: activityCode.toUpperCase(),
    });
    console.log("Activity result:", activity);
    if (!activity)
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Project not found"));

    activity.activityPdf = activity.activityPdf.filter(
      (pdf) => pdf.path !== pdfPath
    );

    const fullPath = path.join(__dirname, "..", pdfPath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

    await activity.save();

    res.status(200).json(httpStatus.httpSuccessStatus("PDF deleted"));
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

    if (!activity)
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Project not found"));

    console.log("imagePath from body:", imagePath);
    console.log("images in DB:", activity.images);

    activity.images = activity.images.filter((img) => img !== imagePath);

    const fullPath = path.join(__dirname, "..", imagePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

    await activity.save();

    res.status(200).json(httpStatus.httpSuccessStatus("Image deleted"));
  } catch (err) {
    res.status(500).json(httpStatus.httpErrorStatus(err.message));
  }
};

const ExportExcel = async (req, res) => {
  console.log("✅ دخلنا على ExportExcel");
  try {
    const query = {};

    if (req.query.name) {
      query.activityName = { $regex: req.query.name, $options: "i" };
    }
    if (req.query.governorate) {
      query.governorate = req.query.governorate;
    }
    if (req.query.activityCode) {
      query.activityCode = req.query.activityCode;
    }
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.fundingType) {
      query.fundingType = req.query.fundingType;
    }

    const activities = await ActivityModel.find(query);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("مشروعات");
    worksheet.views = [{ rightToLeft: true }];

    // ✅ أولاً: عرّف الأعمدة
    worksheet.columns = [
      {
        header: "كود المشروع",
        key: "activityCode",
        width: 20,
        alignment: { wrapText: true },
      },
      {
        header: "اسم المشروع",
        key: "activityName",
        width: 25,
        alignment: { wrapText: true },
      },
      {
        header: "وصف المشروع",
        key: "activityDescription",
        width: 30,
        alignment: { wrapText: true },
      },
      {
        header: "المحافظة",
        key: "governorate",
        width: 20,
        alignment: { wrapText: true },
      },
      {
        header: "الشركة المنفذة",
        key: "executingCompany",
        width: 25,
        alignment: { wrapText: true },
      },
      {
        header: "الاستشاري",
        key: "consultant",
        width: 25,
        alignment: { wrapText: true },
      },
      {
        header: "القيمة التقديرية",
        key: "estimatedValue",
        width: 20,
        alignment: { wrapText: true },
      },
      {
        header: "القيمة التعاقدية",
        key: "contractualValue",
        width: 20,
        alignment: { wrapText: true },
      },
      {
        header: "المنصرف",
        key: "disbursedAmount",
        width: 20,
        alignment: { wrapText: true },
      },
      // { header: "لم يتم صرفه", key: "undisbursedAmount", width: 20, alignment: { wrapText: true } },
      {
        header: "تاريخ الإسناد",
        key: "assignmentDate",
        width: 20,
        style: { numFmt: "dd/mm/yyyy" },
        alignment: { wrapText: true },
      },
      {
        header: "تاريخ النهو",
        key: "completionDate",
        width: 20,
        style: { numFmt: "dd/mm/yyyy" },
        alignment: { wrapText: true },
      },
      {
        header: "تاريخ الاستلام",
        key: "receptionDate",
        width: 20,
        style: { numFmt: "dd/mm/yyyy" },
        alignment: { wrapText: true },
      },
      {
        header: "حالة المشروع",
        key: "status",
        width: 20,
        alignment: { wrapText: true },
      },
      {
        header: "نسبة الإنجاز",
        key: "progress",
        width: 20,
        alignment: { wrapText: true },
      },
    ];
    activities.forEach((activity) => {
      /*   const undisbursedAmount =
        (activity.contractualValue || 0) - (activity.disbursed || 0); */

      worksheet.addRow({
        ...activity.toObject(),
        // undisbursedAmount,
      });
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF00" }, // أصفر
      };
      // اختيارية: تخلي الخط Bold
      cell.font = { bold: true };
      // اختيارية: محاذاة النص للوسط
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
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
    res
      .status(500)
      .json(httpStatus.httpErrorStatus("حدث خطأ أثناء تصدير البيانات"));
  }
};

module.exports = {
  AddNewActivity,
  GetAllActivites,
  GetActivityById,
  DeleteActivity,
  UpdateActivity,
  uploadActivityImages,
  getActivityImages,
  DeleteImageFromActivity,
  DeletePdfFromActivity,
  ExportExcel,
};
