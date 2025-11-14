const ActivityModel = require("../Models/activity_model");
const httpStatus = require("../utils/http_status");
const supabase = require("../utils/supabase");
const fs = require("fs");
const ExcelJS = require("exceljs");
const savePdfLocally = require("../utils/uploadPDF");

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

    const extractData = {
      extractValue: parseFloat(extractValue),
      extractDate: extractDate ? new Date(extractDate) : new Date(),
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

    const deletedExtract = activity.extract[extractIndex];

    // Delete PDF files from storage (optional)
    if (deletedExtract.extractPDFs && deletedExtract.extractPDFs.length > 0) {
      for (const pdf of deletedExtract.extractPDFs) {
        try {
          // Extract filename from path
          const fileName = pdf.path.split("/").pop();
          const { error } = await supabase.storage
            .from("extractpdfs")
            .remove([fileName]);

          if (error) {
            console.error("Error deleting file from storage:", error);
          }
        } catch (fileError) {
          console.error("Error processing file deletion:", fileError);
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

const deleteExtractPDF = async (req, res) => {
  try {
    const { activityCode, extractId, pdfId } = req.params;

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

    const extract = activity.extract[extractIndex];
    const pdfIndex = extract.extractPDFs.findIndex(
      (pdf) => pdf._id.toString() === pdfId
    );
    if (pdfIndex === -1) {
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("PDF Not Found"));
    }

    const deletedPDF = extract.extractPDFs[pdfIndex];

    // Delete file from storage
    try {
      const fileName = deletedPDF.path.split("/").pop();
      const { error } = await supabase.storage
        .from("extractpdfs")
        .remove([fileName]);

      if (error) {
        console.error("Error deleting file from storage:", error);
      }
    } catch (fileError) {
      console.error("Error processing file deletion:", fileError);
    }

    // Remove PDF from array
    extract.extractPDFs.splice(pdfIndex, 1);

    await activity.save();

    res.status(200).json(
      httpStatus.httpSuccessStatus({
        message: "PDF deleted successfully",
        deletedPDF: deletedPDF,
      })
    );
  } catch (error) {
    console.error("Error deleting PDF:", error);
    res.status(500).json(httpStatus.httpErrorStatus(error.message));
  }
};

module.exports = {
  addExtract,
  updateExtract,
  deleteExtract,
  deleteExtractPDF,
};
