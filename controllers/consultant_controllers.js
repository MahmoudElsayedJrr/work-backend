const Consultant = require("../Models/consultant_model");
const {
  httpSuccessStatus,
  httpFaliureStatus,
  httpErrorStatus,
} = require("../utils/http_status");

const getAllConsultants = async (req, res) => {
  try {
    const { search, isActive, sort = "-createdAt" } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const consultants = await Consultant.find(query).sort(sort);

    res.status(200).json({
      ...httpSuccessStatus(consultants),
      results: consultants.length,
    });
  } catch (error) {
    res.status(500).json(httpErrorStatus("حدث خطأ أثناء جلب الاستشاريين"));
  }
};

const getConsultant = async (req, res) => {
  try {
    const consultant = await Consultant.findById(req.params.id);

    if (!consultant) {
      return res.status(404).json(httpFaliureStatus("الاستشاري غير موجود"));
    }

    res.status(200).json(httpSuccessStatus(consultant));
  } catch (error) {
    res.status(500).json(httpErrorStatus("حدث خطأ أثناء جلب الاستشاري"));
  }
};

const createConsultant = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json(httpFaliureStatus("اسم الاستشاري مطلوب"));
    }

    const existingConsultant = await Consultant.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });

    if (existingConsultant) {
      return res
        .status(400)
        .json(httpFaliureStatus("هذا الاستشاري موجود بالفعل"));
    }

    const consultant = await Consultant.create({ name: name.trim() });

    res.status(201).json({
      ...httpSuccessStatus(consultant),
      message: "تم إضافة الاستشاري بنجاح",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json(httpFaliureStatus("هذا الاستشاري موجود بالفعل"));
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json(httpFaliureStatus(messages.join(", ")));
    }

    res.status(500).json(httpErrorStatus("حدث خطأ أثناء إضافة الاستشاري"));
  }
};

const updateConsultant = async (req, res) => {
  try {
    const { name, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json(httpFaliureStatus("اسم الاستشاري مطلوب"));
    }

    const existingConsultant = await Consultant.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      _id: { $ne: req.params.id },
    });

    if (existingConsultant) {
      return res
        .status(400)
        .json(httpFaliureStatus("هذا الاسم مستخدم بالفعل لاستشاري آخر"));
    }

    const updateData = { name: name.trim() };
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const consultant = await Consultant.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!consultant) {
      return res.status(404).json(httpFaliureStatus("الاستشاري غير موجود"));
    }

    res.status(200).json({
      ...httpSuccessStatus(consultant),
      message: "تم تعديل الاستشاري بنجاح",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json(httpFaliureStatus("هذا الاسم مستخدم بالفعل"));
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json(httpFaliureStatus(messages.join(", ")));
    }

    res.status(500).json(httpErrorStatus("حدث خطأ أثناء تعديل الاستشاري"));
  }
};

const deleteConsultant = async (req, res) => {
  try {
    const consultant = await Consultant.findByIdAndDelete(req.params.id);

    if (!consultant) {
      return res.status(404).json(httpFaliureStatus("الاستشاري غير موجود"));
    }

    res.status(200).json({
      ...httpSuccessStatus(null),
      message: "تم حذف الاستشاري بنجاح",
    });
  } catch (error) {
    res.status(500).json(httpErrorStatus("حدث خطأ أثناء حذف الاستشاري"));
  }
};

const toggleConsultantStatus = async (req, res) => {
  try {
    const consultant = await Consultant.findById(req.params.id);

    if (!consultant) {
      return res.status(404).json(httpFaliureStatus("الاستشاري غير موجود"));
    }

    consultant.isActive = !consultant.isActive;
    await consultant.save();

    res.status(200).json({
      ...httpSuccessStatus(consultant),
      message: consultant.isActive
        ? "تم تفعيل الاستشاري"
        : "تم إلغاء تفعيل الاستشاري",
    });
  } catch (error) {
    res.status(500).json(httpErrorStatus("حدث خطأ أثناء تغيير حالة الاستشاري"));
  }
};

module.exports = {
  getAllConsultants,
  getConsultant,
  createConsultant,
  updateConsultant,
  deleteConsultant,
  toggleConsultantStatus,
};
