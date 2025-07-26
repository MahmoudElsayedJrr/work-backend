const uploadImage = require("../utils/uploadImage");
const uploadPdf = require("../utils/uploadPDF");
const httpStatus = require("../utils/http_status");

//const upload = multer();

const uploadImageCall = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json(httpStatus.httpFaliureStatus("No Image Uploaded."));
    }
    const result = await uploadImage(req.file.buffer, req.file.originalname);
    console.log(result);
    res.json(httpStatus.httpSuccessStatus({ ...result }));
  } catch (err) {
    res.status(500).json(httpStatus.httpErrorStatus(err.message));
  }
};

const uploadPdfCall = async (req, res) => {
  try {
    const { bucketName } = req.params;
    console.log(`bucketName = ${bucketName}`);
    if (!req.file) {
      return res
        .status(400)
        .json(httpStatus.httpFaliureStatus("No PDF File Uploaded."));
    }

    const result = await uploadPdf(
      req.file.buffer,
      req.file.originalname,
      bucketName
    );
    res.json(httpStatus.httpSuccessStatus({ ...result }));
  } catch (err) {
    res.status(500).json(httpStatus.httpErrorStatus(err.message));
  }
};

module.exports = {
  uploadImageCall,
  uploadPdfCall,
};
