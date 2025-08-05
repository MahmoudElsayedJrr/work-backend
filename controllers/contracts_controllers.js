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

/* const DeleteDecisionById = async (req, res) => {
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

    // Find the activity and remove the specific decision
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

    // Check if the decision was actually removed
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

const updateDecision = async (req, res) => {
  try {
    const { activityCode, decisionId } = req.params;
    const updateData = req.body;

    // Validate decisionId format
    if (!decisionId || !mongoose.Types.ObjectId.isValid(decisionId)) {
      return res
        .status(400)
        .json(httpStatus.httpFaliureStatus("Invalid decision ID format"));
    }

    // Validate required fields
    const {
      decisionName,
      decisionType,
      decisionQuantity,
      decisionPrice,
      decisionUnit,
    } = updateData;

    // Convert to numbers and validate
    const quantity = parseFloat(decisionQuantity) || 0;
    const price = parseFloat(decisionPrice) || 0;
    const total = quantity * price;

    // Prepare the update object
    const updateObject = {
      "decision.$.decisionName": decisionName,
      "decision.$.decisionType": decisionType,
      "decision.$.decisionQuantity": quantity,
      "decision.$.decisionUnit": decisionUnit,
      "decision.$.decisionPrice": price,
      "decision.$.decisionTotal": total,
    };

    // Update the specific decision using array filters
    const updatedActivity = await ActivityModel.findOneAndUpdate(
      {
        activityCode: activityCode.toUpperCase(),
        "decision._id": decisionId,
      },
      { $set: updateObject },
      { new: true, runValidators: true }
    );

    if (!updatedActivity) {
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Activity or decision not found"));
    }

    // Find the updated decision to return it
    const updatedDecision = updatedActivity.decision.find(
      (decision) => decision._id.toString() === decisionId
    );

    if (!updatedDecision) {
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Decision not found after update"));
    }

    res.status(200).json(
      httpStatus.httpSuccessStatus({
        message: "Decision updated successfully",
        decision: updatedDecision,
        activity: updatedActivity,
      })
    );
  } catch (error) {
    console.error("خطأ في تحديث البند:", error);
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء التحديث", error: error.message });
  }
}; */

module.exports = {
  AddContractForActivity,
};
