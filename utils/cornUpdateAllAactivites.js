const cron = require("node-cron");
const ActivityModel = require("../Models/activity_model");

const updateProjectsStatus = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      const today = new Date();
      const twoMonthsFromNow = new Date();
      twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);

      const extensionResult = await ActivityModel.updateMany(
        {
          status: "قيد التنفيذ",
          completionDate: {
            $gt: today,
            $lte: twoMonthsFromNow,
          },
        },
        {
          $set: { status: "يحتاج مد مده" },
        },
      );
      console.log(
        `✅ تم تحديث ${extensionResult.modifiedCount} مشروع يحتاج مد مدة`,
      );

      const delayedResult = await ActivityModel.updateMany(
        {
          status: "يحتاج مد مده",
          completionDate: { $lt: today },
        },
        {
          $set: { status: "متأخر" },
        },
      );
      console.log(`✅ تم تحديث ${delayedResult.modifiedCount} مشروع متأخر`);
    } catch (error) {
      console.error("خطأ في تحديث المشاريع:", error);
    }
  });
};

module.exports = updateProjectsStatus;
