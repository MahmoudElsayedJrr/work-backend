const ActivityModel = require("../Models/activity_model");
const httpStatus = require("../utils/http_status");
const supabase = require("../utils/supabase");
const fs = require("fs");
const ExcelJS = require("exceljs");
const uploadImage = require("../utils/uploadImage");
const uploadPdf = require("../utils/uploadPDF");

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

    // أولاً: ابحث عن المشروع قبل حذفه
    const activity = await ActivityModel.findOne({
      activityCode: activityCode.toUpperCase(),
    });

    if (!activity) {
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Activity not found"));
    }

    // حذف الصور من Supabase
    if (activity.images && activity.images.length > 0) {
      const imageFiles = activity.images.map((imagePath) => {
        const fileName = decodeURIComponent(imagePath.split("/").pop());
        return fileName;
      });

      if (imageFiles.length > 0) {
        const { error: imageError } = await supabase.storage
          .from("activityimages")
          .remove(imageFiles);

        if (imageError) {
          console.error("Error deleting images:", imageError);
        }
      }
    }

    // حذف ملفات PDF من activitypdfs
    if (activity.activitypdfs && activity.activitypdfs.length > 0) {
      const pdfFiles = activity.activitypdfs.map((pdf) => {
        const fileName = decodeURIComponent(pdf.path.split("/").pop());
        return fileName;
      });

      if (pdfFiles.length > 0) {
        const { error: pdfError } = await supabase.storage
          .from("activitypdfs")
          .remove(pdfFiles);

        if (pdfError) {
          console.error("Error deleting activitypdfs:", pdfError);
        }
      }
    }

    // حذف ملفات PDF من contractualDocuments
    if (
      activity.contractualDocuments &&
      activity.contractualDocuments.length > 0
    ) {
      const contractFiles = activity.contractualDocuments.map((doc) => {
        const fileName = decodeURIComponent(doc.path.split("/").pop());
        return fileName;
      });

      if (contractFiles.length > 0) {
        const { error: contractError } = await supabase.storage
          .from("activitycontractualdocuments")
          .remove(contractFiles);

        if (contractError) {
          console.error("Error deleting contractualDocuments:", contractError);
        }
      }
    }

    await ActivityModel.findOneAndDelete({
      activityCode: activityCode.toUpperCase(),
    });

    res
      .status(200)
      .json(
        httpStatus.httpSuccessStatus(
          "Activity and all its files deleted successfully"
        )
      );
  } catch (error) {
    console.error("Error in DeleteActivity:", error);
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
    "petroleumCompany",
    "bitumenQuantity",
    "mc",
    "rc",
    "remainingQuantitiesTons",
    "notes",
    "decisionName",
    "decisionType",
    "decisionPrice",
    "decisionQuantity",
    "decisionUnit",
    "extensionDate",
    "suspensionDate",
    "resumptionDate",
    "extension",
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
  projectManager: [
    "petroleumCompany",
    "bitumenQuantity",
    "mc",
    "rc",
    "remainingQuantitiesTons",
    "notes",
    "decisionName",
    "decisionType",
    "decisionPrice",
    "decisionQuantity",
    "decisionUnit",
    "extensionDate",
    "suspensionDate",
    "resumptionDate",
    "extension",
  ],
  financial: ["estimatedValue", "contractualValue", "disbursedAmount"],
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
        const buffer = file.buffer;
        const originalName = file.originalname;

        const { path, publicUrl } = await uploadImage(buffer, originalName);

        activityToUpdate.images.push(publicUrl);
      }
    }

    if (req.files?.contractualDocuments?.length > 0) {
      if (!Array.isArray(activityToUpdate.contractualDocuments)) {
        activityToUpdate.contractualDocuments = [];
      }

      for (const file of req.files.contractualDocuments) {
        const buffer = file.buffer;

        const originalName = file.originalname;
        const fixedName = Buffer.from(originalName, "latin1").toString("utf8");
        console.log("original name:", originalName);
        console.log("fixed name:", fixedName);

        const { path, publicUrl } = await uploadPdf(
          buffer,
          fixedName,
          "activitycontractualdocuments"
        );

        activityToUpdate.contractualDocuments.push({
          filename: fixedName,
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
        const buffer = file.buffer;

        const originalName = file.originalname;
        const fixedName = Buffer.from(originalName, "latin1").toString("utf8");
        console.log("original name:", originalName);
        console.log("fixed name:", fixedName);

        const { path, publicUrl } = await uploadPdf(
          buffer,
          fixedName,
          "activitypdfs"
        );

        activityToUpdate.activitypdfs.push({
          filename: fixedName,
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
    const { activityCode, pdfPath } = req.body;
    const { bucketName } = req.params;

    console.log("bucketName =>", bucketName);

    const fieldMap = {
      activitypdfs: "activitypdfs",
      activitycontractualdocuments: "contractualDocuments",
    };

    console.log("Available buckets =>", Object.keys(fieldMap));

    const fieldName = fieldMap[bucketName];
    if (!fieldName) {
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

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([fileName]);

    if (error) {
      return res
        .status(500)
        .json(
          httpStatus.httpErrorStatus(
            `Failed to delete from Supabase: ${error.message}`
          )
        );
    }
    console.log(fieldName);
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

    if (!activity)
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Project not found"));

    const fileName = decodeURIComponent(imagePath.split("/").pop());
    const { error } = await supabase.storage.from("images").remove([fileName]);

    if (error) {
      return res
        .status(500)
        .json(httpStatus.httpErrorStatus("Failed to delete from Supabase"));
    }

    activity.images = activity.images.filter((img) => img !== imagePath);
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
        header: "نوع التمويل",
        key: "fundingType",
        width: 20,
        alignment: { wrapText: true },
      },

      {
        header: "فئة المشروع",
        key: "projectCategory",
        width: 20,
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
        fgColor: { argb: "FFFFFF00" },
      };

      cell.font = { bold: true };

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
};
