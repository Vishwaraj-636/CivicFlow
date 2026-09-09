import Department from "../model/department.model.js";

export const createDepartment = async (req, res) => {
   const { fullname, code, description, isActive, categories } = req.body;

   if (!fullname?.trim() || !code?.trim()) {
      return res.status(400).json({
         error: "fullname and code are required"
      });
   }

   const normalizedFullname = fullname.trim();
   const normalizedCode = code.trim();
   const normalizedCategories = Array.isArray(categories)
      ? categories
         .filter((category) => typeof category === "string")
         .map((category) => category.trim())
         .filter(Boolean)
      : [];

   try {
      const existingDepartment = await Department.findOne({
         code: normalizedCode
      });

      if (existingDepartment) {
         return res.status(409).json({
            error: "A department with this code already exists"
         });
      }

      const newDepartment = await Department.create({
         fullname: normalizedFullname,
         code: normalizedCode,
         description,
         isActive,
         categories: normalizedCategories
      });
      return res.status(201).json(newDepartment);
   } catch (error) {
      console.error("Error creating department:", error);
      if (error.name === "ValidationError") {
         return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Internal server error" });
   }
}

export const getDepartments = async (req, res) => {
   try {
      const departments = await Department.find();
      res.status(200).json(departments);
   } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ error: "Internal server error" });
   }
}

export const getDepartmentById = async (req, res) => {
   const { id } = req.params;

   try {
      const department = await Department.findById(id);
      if (!department) {
         return res.status(404).json({ error: "Department not found" });
      }
      res.status(200).json(department);
   } catch (error) {
      console.error("Error fetching department by ID:", error);
      if (error.name === "CastError") {
         return res.status(400).json({ error: "Invalid department ID" });
      }
      res.status(500).json({ error: "Internal server error" });
   }
}

export const updateDepartment = async (req, res) => {
   const { id } = req.params;
   const { fullname, code, description, isActive, categories } = req.body;

   if (!Object.keys(req.body).some((field) => [
      'fullname', 'code', 'description', 'isActive', 'categories'
   ].includes(field))) {
      return res.status(400).json({ error: "At least one department field is required" });
   }

   try {
      if (code !== undefined) {
         const existingDepartment = await Department.findOne({
            _id: { $ne: id },
            code: code.trim()
         });

         if (existingDepartment) {
            return res.status(409).json({
               error: "A department with this code already exists"
            });
         }
      }

      const updates = {};
      if (fullname !== undefined) updates.fullname = fullname.trim();
      if (code !== undefined) updates.code = code.trim();
      if (description !== undefined) updates.description = description;
      if (isActive !== undefined) updates.isActive = isActive;
      if (categories !== undefined) updates.categories = categories.map((category) => category.trim()).filter(Boolean);

      const updatedDepartment = await Department.findByIdAndUpdate(
         id,
         { $set: updates },
         { new: true, runValidators: true }
      );

      if (!updatedDepartment) {
         return res.status(404).json({ error: "Department not found" });
      }

      return res.status(200).json(updatedDepartment);
   } catch (error) {
      console.error("Error updating department:", error);
      if (error.name === "CastError") {
         return res.status(400).json({ error: "Invalid department ID" });
      }
      return res.status(500).json({ error: "Internal server error" });
   }
}

export const deleteDepartment = async (req, res) => {
   const { id } = req.params;

   try {
      const deletedDepartment = await Department.findByIdAndDelete(id);
      if (!deletedDepartment) {
         return res.status(404).json({ error: "Department not found" });
      }
      return res.status(200).json({ message: "Department deleted successfully" });
   } catch (error) {
      console.error("Error deleting department:", error);
      if (error.name === "CastError") {
         return res.status(400).json({ error: "Invalid department ID" });
      }
      return res.status(500).json({ error: "Internal server error" });
   }
}

