import mongoose from "mongoose";
import dotenv from "dotenv";
import departmentModel from "../models/department.model.js";

dotenv.config();

const departments = [
  {
    name: "Electricity",
    code: "ELEC001",
    contactEmail: "electricity@civicflow.gov.in",
  },
  {
    name: "Water Supply",
    code: "WATER001",
    contactEmail: "water@civicflow.gov.in",
  },
  {
    name: "Road Maintenance",
    code: "ROAD001",
    contactEmail: "roads@civicflow.gov.in",
  },
  {
    name: "Sanitation",
    code: "SANIT001",
    contactEmail: "sanitation@civicflow.gov.in",
  },
  {
    name: "Police",
    code: "POLICE001",
    contactEmail: "police@civicflow.gov.in",
  },
  {
    name: "Gas Supply",
    code: "GAS001",
    contactEmail: "gas@civicflow.gov.in",
  },
];

async function seedDepartments() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB");

    for (const department of departments) {
      const exists = await departmentModel.findOne({
        code: department.code,
      });

      if (!exists) {
        await departmentModel.create(department);
        console.log(`Added ${department.name}`);
      } else {
        console.log(`${department.name} already exists`);
      }
    }

    console.log("Department seeding completed");

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedDepartments();