const cron = require("node-cron");
const ActivityModel = require("../Models/activity_model");
const isProjectDelayed = require("./isProjectDelayed");



const updateProjectsStatus = () => {
  cron.schedule("* * * * *", async () => {
    try {


      const ongoingProjects = await ActivityModel.find({
        status: "قيد التنفيذ",
        receptionDate: { $exists: true, $ne: null },
        completionDate: { $exists: true, $ne: null },
        progress: { $exists: true, $lt: 100 }
      });

      let delayedCount = 0;
      for (const project of ongoingProjects) {
        if (isProjectDelayed(project.progress, project.receptionDate, project.completionDate)) {
          await ActivityModel.updateOne(
            { _id: project._id },
            { $set: { status: "متعثرة" } }
          );
          delayedCount++;
          console.log(`⚠️ تم تحويل المشروع "${project.activityName|| project._id}" من "جاري التنفيذ" إلى "متعثر"`);
        }
      }
      console.log(`✅ تم تحديث ${delayedCount} مشروع متعثر`);




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
          status: { $in: ["يحتاج مد مده", "متعثرة"] },
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
