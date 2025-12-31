const ActivityModel = require("../Models/activity_model");
const httpStatus = require("../utils/http_status");
const mongoose = require("mongoose");

const AddContractForActivity = async (req, res) => {
  try {
    const { activityCode } = req.params;
    const contractData = req.body;

    const activity = await ActivityModel.findOne({
      activityCode: activityCode.toUpperCase(),
    });

    if (!activity)
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Activity not found"));

    if (!Array.isArray(activity.contract)) {
      activity.contract = [];
    }

    let newContractNumber = 1;
    if (activity.contract.length > 0) {
      const maxNumber = Math.max(
        ...activity.contract.map((c) => c.contractNumber || 0)
      );
      newContractNumber = maxNumber + 1;
    }

    contractData.contractNumber = newContractNumber;

    activity.contract.push(contractData);
    await activity.save();

    res.status(200).json(httpStatus.httpSuccessStatus(activity.contract));
  } catch (error) {
    //console.error("خطأ في إضافة البند:", error);
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء الإضافة", error: error.message });
  }
};

const UpdateContractForActivity = async (req, res) => {
  try {
    const { activityCode, contractNumber } = req.params;
    const updateData = req.body;

    const activity = await ActivityModel.findOne({
      activityCode: activityCode.toUpperCase(),
    });

    if (!activity)
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Activity not found"));

    const contractIndex = activity.contract.findIndex(
      (c) => c.contractNumber === parseInt(contractNumber)
    );

    if (contractIndex === -1)
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Contract not found"));

    activity.contract[contractIndex] = {
      ...activity.contract[contractIndex].toObject(),
      ...updateData,
      contractNumber: activity.contract[contractIndex].contractNumber,
    };

    await activity.save();

    res.status(200).json(httpStatus.httpSuccessStatus(activity.contract));
  } catch (error) {
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء التعديل", error: error.message });
  }
};

const DeleteContractForActivity = async (req, res) => {
  try {
    const { activityCode, contractNumber } = req.params;

    const activity = await ActivityModel.findOne({
      activityCode: activityCode.toUpperCase(),
    });

    if (!activity)
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Activity not found"));

    const contractIndex = activity.contract.findIndex(
      (c) => c.contractNumber === parseInt(contractNumber)
    );

    if (contractIndex === -1)
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Contract not found"));

    activity.contract.splice(contractIndex, 1);
    await activity.save();

    res.status(200).json(httpStatus.httpSuccessStatus(activity.contract));
  } catch (error) {
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء الحذف", error: error.message });
  }
};

module.exports = {
  AddContractForActivity,
  UpdateContractForActivity,
  DeleteContractForActivity,
};
