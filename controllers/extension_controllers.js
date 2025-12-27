const ActivityModel = require("../Models/activity_model");
const httpStatus = require("../utils/http_status");
const mongoose = require("mongoose");

const UpdateExtension = async (req, res) => {
  try {
    const { activityCode, extensionIndex } = req.params;
    const { extensionDate } = req.body;
    const employeeRole = req.currentEmployee?.role;

    if (!employeeRole) {
      return res
        .status(401)
        .json(
          httpStatus.httpFaliureStatus(
            "Authentication failed: User role not found."
          )
        );
    }

    if (!extensionDate) {
      return res
        .status(400)
        .json(httpStatus.httpFaliureStatus("يرجى إدخال تاريخ مد المدة"));
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
            "النشاط غير موجود أو لا تملك صلاحية الوصول إليه"
          )
        );
    }

    const index = parseInt(extensionIndex);

    if (
      !activity.extension ||
      index < 0 ||
      index >= activity.extension.length
    ) {
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("مد المدة غير موجود"));
    }

    const newExtensionDate = new Date(extensionDate);

    const currentExtension = activity.extension[index];
    if (newExtensionDate <= new Date(currentExtension.fromDate)) {
      return res
        .status(400)
        .json(
          httpStatus.httpFaliureStatus(
            "تاريخ المد يجب أن يكون بعد تاريخ البداية"
          )
        );
    }

    activity.extension[index].extensionDate = newExtensionDate;

    if (index + 1 < activity.extension.length) {
      activity.extension[index + 1].fromDate = newExtensionDate;
    }

    if (index === activity.extension.length - 1) {
      activity.completionDate = newExtensionDate;
    }

    await activity.save();

    res.status(200).json(httpStatus.httpSuccessStatus(activity));
  } catch (error) {
    console.error("Error in UpdateExtension:", error);
    res.status(400).json(httpStatus.httpErrorStatus(error.message));
  }
};

// ============ حذف مد مدة معين ============
const DeleteExtension = async (req, res) => {
  try {
    const { activityCode, extensionIndex } = req.params;
    const employeeRole = req.currentEmployee?.role;

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

    const activity = await ActivityModel.findOne(query);

    if (!activity) {
      return res
        .status(404)
        .json(
          httpStatus.httpFaliureStatus(
            "النشاط غير موجود أو لا تملك صلاحية الوصول إليه"
          )
        );
    }

    const index = parseInt(extensionIndex);

    if (
      !activity.extension ||
      index < 0 ||
      index >= activity.extension.length
    ) {
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("مد المدة غير موجود"));
    }

    const deletedExtension = activity.extension[index];

    activity.extension.splice(index, 1);

    activity.extension.forEach((ext, i) => {
      ext.extensionNumber = i + 1;

      if (i === index && i > 0) {
        // لو حذفنا مد في النص، المد اللي بعده ياخد fromDate من اللي قبله
        ext.fromDate = activity.extension[i - 1].extensionDate;
      } else if (i === 0 && activity.extension.length > 0) {
        // لو حذفنا أول مد، المد الجديد الأول ياخد fromDate الأصلي
        // هنا ممكن نحتاج نخزن originalCompletionDate
      }
    });

    if (activity.extension.length > 0) {
      const lastExtension = activity.extension[activity.extension.length - 1];
      activity.completionDate = lastExtension.extensionDate;
    } else {
      activity.completionDate =
        activity.originalCompletionDate || deletedExtension.fromDate;
    }

    await activity.save();

    res.status(200).json(httpStatus.httpSuccessStatus(activity));
  } catch (error) {
    console.error("Error in DeleteExtension:", error);
    res.status(400).json(httpStatus.httpErrorStatus(error.message));
  }
};

module.exports = {
  UpdateExtension,
  DeleteExtension,
};
