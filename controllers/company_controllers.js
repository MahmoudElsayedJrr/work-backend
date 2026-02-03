const Company = require("../Models/company_model");
const {
  httpSuccessStatus,
  httpFaliureStatus,
  httpErrorStatus,
} = require("../utils/http_status");

const getAllCompanies = async (req, res) => {
  try {
    const { search, isActive, sort = "-createdAt" } = req.query;

    let query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const companies = await Company.find(query).sort(sort);

    res.status(200).json({
      ...httpSuccessStatus(companies),
      results: companies.length,
    });
  } catch (error) {
    res.status(500).json(httpErrorStatus("حدث خطأ أثناء جلب الشركات"));
  }
};

const getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json(httpFaliureStatus("الشركة غير موجودة"));
    }

    res.status(200).json(httpSuccessStatus(company));
  } catch (error) {
    res.status(500).json(httpErrorStatus("حدث خطأ أثناء جلب الشركة"));
  }
};

const createCompany = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json(httpFaliureStatus("اسم الشركة مطلوب"));
    }

    const existingCompany = await Company.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });

    if (existingCompany) {
      return res
        .status(400)
        .json(httpFaliureStatus("هذه الشركة موجودة بالفعل"));
    }

    const company = await Company.create({ name: name.trim() });

    res.status(201).json({
      ...httpSuccessStatus(company),
      message: "تم إضافة الشركة بنجاح",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json(httpFaliureStatus("هذه الشركة موجودة بالفعل"));
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json(httpFaliureStatus(messages.join(", ")));
    }

    res.status(500).json(httpErrorStatus("حدث خطأ أثناء إضافة الشركة"));
  }
};

const updateCompany = async (req, res) => {
  try {
    const { name, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json(httpFaliureStatus("اسم الشركة مطلوب"));
    }

    const existingCompany = await Company.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      _id: { $ne: req.params.id },
    });

    if (existingCompany) {
      return res
        .status(400)
        .json(httpFaliureStatus("هذا الاسم مستخدم بالفعل لشركة أخرى"));
    }

    const updateData = { name: name.trim() };
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const company = await Company.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!company) {
      return res.status(404).json(httpFaliureStatus("الشركة غير موجودة"));
    }

    res.status(200).json({
      ...httpSuccessStatus(company),
      message: "تم تعديل الشركة بنجاح",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json(httpFaliureStatus("هذا الاسم مستخدم بالفعل"));
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json(httpFaliureStatus(messages.join(", ")));
    }

    res.status(500).json(httpErrorStatus("حدث خطأ أثناء تعديل الشركة"));
  }
};

const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);

    if (!company) {
      return res.status(404).json(httpFaliureStatus("الشركة غير موجودة"));
    }

    res.status(200).json({
      ...httpSuccessStatus(null),
      message: "تم حذف الشركة بنجاح",
    });
  } catch (error) {
    res.status(500).json(httpErrorStatus("حدث خطأ أثناء حذف الشركة"));
  }
};

const toggleCompanyStatus = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json(httpFaliureStatus("الشركة غير موجودة"));
    }

    company.isActive = !company.isActive;
    await company.save();

    res.status(200).json({
      ...httpSuccessStatus(company),
      message: company.isActive ? "تم تفعيل الشركة" : "تم إلغاء تفعيل الشركة",
    });
  } catch (error) {
    res.status(500).json(httpErrorStatus("حدث خطأ أثناء تغيير حالة الشركة"));
  }
};

module.exports = {
  getAllCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  toggleCompanyStatus,
};
