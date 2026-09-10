import Department from '../model/department.model.js';
import { supportedCategories } from './complaintCategories.js';

const initialDepartments = [
   {
      fullname: 'Public Works',
      code: 'PUBLIC_WORKS',
      categories: [supportedCategories[0]]
   },
   {
      fullname: 'Sanitation',
      code: 'SANITATION',
      categories: [supportedCategories[1]]
   },
   {
      fullname: 'Water Supply',
      code: 'WATER_SUPPLY',
      categories: [supportedCategories[2]]
   },
   {
      fullname: 'Electrical',
      code: 'ELECTRICAL',
      categories: [supportedCategories[3]]
   },
   {
      fullname: 'Drainage',
      code: 'DRAINAGE',
      categories: [supportedCategories[4]]
   }
];

export const seedDepartments = async () => {
   await Promise.all(
      initialDepartments.map((department) => Department.updateOne(
         { code: department.code },
         { $set: { ...department } },
         { upsert: true }
      ))
   );
};