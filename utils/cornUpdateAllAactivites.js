const cron = require("node-cron");
const ActivityModel = require("../Models/activity_model");

const updateDelayedProjects = () => {
  cron.schedule("0 1 * * *", async () => {
    try {
      const result = await ActivityModel.updateMany(
        {
          status: "قيد التنفيذ",
          completionDate: { $lt: new Date() },
        },
        {
          $set: { status: "متأخر" },
        }
      );

      console.log(`✅ تم تحديث ${result.modifiedCount} مشروع متأخر`);
    } catch (error) {
      console.error("خطأ في تحديث المشاريع:", error);
    }
  });
};

module.exports = updateDelayedProjects;
