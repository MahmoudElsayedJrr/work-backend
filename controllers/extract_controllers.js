const ActivityModel = require("../Models/activity_model");
const httpStatus = require("../utils/http_status");
const supabase = require("../utils/supabase");
const fs = require("fs");
const ExcelJS = require("exceljs");
const uploadImage = require("../utils/uploadImage");
const uploadPdf = require("../utils/uploadPDF");

const addExtract = async (req, res) => {
  try {
    const { activityCode } = req.params;
    const { extractValue, extractDate } = req.body;

    const activity = await ActivityModel.findOne({
      activityCode: activityCode.toUpperCase(),
    });
    if (!activity) {
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Activity Not Found"));
    }

    const extractPDFs = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const fixedName = Buffer.from(file.originalname, "latin1").toString(
            "utf8"
          );
          const uploadedFile = await uploadPdf(
            file.buffer,
            fixedName,
            "extractpdfs"
          );
          extractPDFs.push({ path: uploadedFile.publicUrl });
        } catch (uploadError) {
          console.error("Error uploading file:", uploadError);
          return res
            .status(500)
            .json(httpStatus.httpErrorStatus("حدث خطأ في رفع الملف"));
        }
      }
    }

    const extractData = {
      extractValue: parseFloat(extractValue),
      extractDate: extractDate ? new Date(extractDate) : new Date(),
      extractPDFs: extractPDFs,
    };

    activity.extract.push(extractData);
    await activity.save();

    res
      .status(201)
      .json(
        httpStatus.httpSuccessStatus(
          activity.extract[activity.extract.length - 1]
        )
      );
  } catch (error) {
    console.error("Error adding extract:", error);
    res.status(500).json(httpStatus.httpErrorStatus(error.message));
  }
};

module.exports = {
  addExtract,
};
