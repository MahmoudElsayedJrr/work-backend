const GovernorateModel = require("../Models/governorat_model");
const httpStatus = require("../utils/http_status");

const getAllGovernorates = async (req, res) => {
  try {
    const governorates = await GovernorateModel.find({})
      .select("name")
      .sort("name");

    res.status(200).json(httpStatus.httpSuccessStatus(governorates));
  } catch (error) {
    console.error("Error in getAllGovernorates:", error);

    res.status(500).json(httpStatus.httpErrorStatus(error.message));
  }
};

const addGovernorate = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res
        .status(400)
        .json(httpStatus.httpFaliureStatus("اسم المحافظة مطلوب."));
    }

    const nameTrimmed = name.trim();

    const existingGovernorate = await GovernorateModel.findOne({
      name: nameTrimmed,
    });
    if (existingGovernorate) {
      return res
        .status(409)
        .json(
          httpStatus.httpFaliureStatus(
            `المحافظة "${nameTrimmed}" موجودة بالفعل.`
          )
        );
    }

    const newGovernorate = new GovernorateModel({ name: nameTrimmed });
    await newGovernorate.save();

    res.status(201).json(
      httpStatus.httpSuccessStatus({
        id: newGovernorate.id,
        name: newGovernorate.name,
      })
    );
  } catch (error) {
    console.error("Error in addGovernorate:", error);

    res.status(500).json(httpStatus.httpErrorStatus(error.message));
  }
};

const updateGovernorate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res
        .status(400)
        .json(httpStatus.httpFaliureStatus("الاسم الجديد للمحافظة مطلوب."));
    }

    const nameTrimmed = name.trim();

    const updatedGovernorate = await GovernorateModel.findByIdAndUpdate(
      id,
      { name: nameTrimmed },
      { new: true, runValidators: true }
    );

    if (!updatedGovernorate) {
      return res
        .status(404)
        .json(
          httpStatus.httpFaliureStatus("لم يتم العثور على المحافظة للتعديل.")
        );
    }

    res.status(200).json(
      httpStatus.httpSuccessStatus({
        id: updatedGovernorate.id,
        name: updatedGovernorate.name,
      })
    );
  } catch (error) {
    console.error("Error in updateGovernorate:", error);

    res.status(500).json(httpStatus.httpErrorStatus(error.message));
  }
};

const deleteGovernorate = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedGovernorate = await GovernorateModel.findByIdAndDelete(id);

    if (!deletedGovernorate) {
      return res
        .status(404)
        .json(
          httpStatus.httpFaliureStatus("لم يتم العثور على المحافظة للحذف.")
        );
    }
    res
      .status(200)
      .json(
        httpStatus.httpSuccessStatus({ message: "تم حذف المحافظة بنجاح." })
      );
  } catch (error) {
    console.error("Error in deleteGovernorate:", error);
    res.status(500).json(httpStatus.httpErrorStatus(error.message));
  }
};

module.exports = {
  getAllGovernorates,
  addGovernorate,
  updateGovernorate,
  deleteGovernorate,
};
