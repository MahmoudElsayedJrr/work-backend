const mongoose = require("mongoose");
const Activity = require("../Models/activity_model");

async function fixCompletedProjects() {
  try {
    const MONGODB_URI = "mongodb://localhost:27017/your-database-name";
    await mongoose.connect(MONGODB_URI);

    console.log("🔗 تم الاتصال بقاعدة البيانات");

    // ✅ ابحث عن المشاريع اللي نسبتها 100% لكن مش "مكتمل"
    const projectsToUpdate = await Activity.find({
      progress: { $gte: 100 },
      status: { $nin: ["مكتمل", "مسحوب", "متوقف"] },
    });

    console.log(
      `📊 تم العثور على ${projectsToUpdate.length} مشروع يحتاج تحديث`
    );

    if (projectsToUpdate.length > 0) {
      // ✅ حدّث الحالة
      const result = await Activity.updateMany(
        {
          progress: { $gte: 100 },
          status: { $nin: ["مكتمل", "مسحوب", "متوقف"] },
        },
        {
          $set: { status: "مكتمل" },
        }
      );

      console.log(`✅ تم تحديث ${result.modifiedCount} مشروع بنجاح`);

      // ✅ اعرض تفاصيل المشاريع المحدثة
      projectsToUpdate.forEach((project) => {
        console.log(
          `   - ${project.activityCode}: "${project.activityName}" (النسبة: ${project.progress}%)`
        );
      });
    } else {
      console.log("✅ جميع المشاريع محدثة بالفعل!");
    }

    await mongoose.disconnect();
    console.log("🔌 تم قطع الاتصال بقاعدة البيانات");
  } catch (error) {
    console.error("❌ حدث خطأ:", error);
    process.exit(1);
  }
}

fixCompletedProjects();
