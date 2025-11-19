const ActivityModel = require("../Models/activity_model");
const httpStatus = require("../utils/http_status");
const fs = require("fs").promises;
const path = require("path");
const ExcelJS = require("exceljs");
const savePdfLocally = require("../utils/uploadPDF");
const { getFiscalYear } = require("../utils/fiscalYear");

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
          const { publicUrl, originalName } = await savePdfLocally(
            file,
            "extractpdfs"
          );
          extractPDFs.push({
            filename: originalName,
            path: publicUrl,
          });
        } catch (uploadError) {
          console.error("Error saving file:", uploadError);
          return res
            .status(500)
            .json(httpStatus.httpErrorStatus("Can not save file"));
        }
      }
    }

    const currentFiscalYear = getFiscalYear(extractDate);

    const extractData = {
      extractValue: parseFloat(extractValue),
      extractDate: extractDate ? new Date(extractDate) : new Date(),
      extractFiscalYear: currentFiscalYear,
      extractPDFs: extractPDFs,
    };

    activity.extract.push(extractData);
    activity.disbursedAmount += extractData.extractValue;
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

const updateExtract = async (req, res) => {
  try {
    const { activityCode, extractId } = req.params;
    const { extractValue, extractDate } = req.body;

    const activity = await ActivityModel.findOne({
      activityCode: activityCode.toUpperCase(),
    });
    if (!activity) {
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Activity Not Found"));
    }

    const extractIndex = activity.extract.findIndex(
      (ex) => ex._id.toString() === extractId
    );
    if (extractIndex === -1) {
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Extract Not Found"));
    }

    const oldExtract = activity.extract[extractIndex];
    const oldValue = oldExtract.extractValue;

    if (extractValue !== undefined) {
      activity.extract[extractIndex].extractValue = parseFloat(extractValue);

      activity.disbursedAmount =
        activity.disbursedAmount - oldValue + parseFloat(extractValue);
    }
    if (extractDate) {
      activity.extract[extractIndex].extractDate = new Date(extractDate);
    }

    // Handle new PDF files
    if (req.files && req.files.length > 0) {
      const newPDFs = [];
      for (const file of req.files) {
        try {
          const { publicUrl, originalName } = await savePdfLocally(
            file,
            "extractpdfs"
          );
          newPDFs.push({
            filename: originalName,
            path: publicUrl,
          });
        } catch (uploadError) {
          console.error("Error saving file:", uploadError);
          return res
            .status(500)
            .json(httpStatus.httpErrorStatus("Can not save file"));
        }
      }
      // Add new PDFs to existing ones
      activity.extract[extractIndex].extractPDFs.push(...newPDFs);
    }

    await activity.save();

    res
      .status(200)
      .json(httpStatus.httpSuccessStatus(activity.extract[extractIndex]));
  } catch (error) {
    console.error("Error updating extract:", error);
    res.status(500).json(httpStatus.httpErrorStatus(error.message));
  }
};

const deleteExtract = async (req, res) => {
  try {
    const { activityCode, extractId } = req.params;

    const activity = await ActivityModel.findOne({
      activityCode,
    });
    if (!activity) {
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Activity Not Found"));
    }

    const extractIndex = activity.extract.findIndex(
      (ex) => ex._id.toString() === extractId
    );
    if (extractIndex === -1) {
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Extract Not Found"));
    }

    const deletedExtract = activity.extract[extractIndex];

    if (deletedExtract.extractPDFs && deletedExtract.extractPDFs.length > 0) {
      const UPLOADS_DIR = path.join(__dirname, "../uploads");

      //console.log(`__dirname (Controller Location): ${__dirname}`); /
      // console.log(`UPLOADS_DIR (Calculated Root): ${UPLOADS_DIR}`);

      for (const pdf of deletedExtract.extractPDFs) {
        try {
          const relativePath = pdf.path.replace(/^\/uploads\//, "");
          const filePath = path.join(UPLOADS_DIR, relativePath);

          // console.log(`File Path from DB: ${pdf.path}`);
          // console.log(`Attempting to delete: ${filePath}`);

          await fs.access(filePath);
          await fs.unlink(filePath);
          console.log(`File deleted successfully: ${filePath}`);
        } catch (fileError) {
          if (fileError.code === "ENOENT") {
            console.warn(`File not found, skipping deletion: ${filePath}`);
          } else {
            console.error("Error processing file deletion:", fileError);
          }
        }
      }
    }

    activity.disbursedAmount -= deletedExtract.extractValue;

    activity.extract.splice(extractIndex, 1);

    await activity.save();

    res.status(200).json(
      httpStatus.httpSuccessStatus({
        message: "Extract deleted successfully",
        deletedExtract: deletedExtract,
      })
    );
  } catch (error) {
    console.error("Error deleting extract:", error);
    res.status(500).json(httpStatus.httpErrorStatus(error.message));
  }
};

module.exports = {
  addExtract,
  updateExtract,
  deleteExtract,
};
