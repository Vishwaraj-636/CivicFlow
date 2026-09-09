import Department from '../model/department.model.js';

const initialDepartments = [
   {
      fullname: 'Public Works',
      code: 'PUBLIC_WORKS',
      categories: ['Pothole', 'Road Damage']
   },
   {
      fullname: 'Sanitation',
      code: 'SANITATION',
      categories: ['Garbage']
   },
   {
      fullname: 'Water Supply',
      code: 'WATER_SUPPLY',
      categories: ['Water Leakage']
   },
   {
      fullname: 'Electrical',
      code: 'ELECTRICAL',
      categories: ['Streetlight']
   },
   {
      fullname: 'Drainage',
      code: 'DRAINAGE',
      categories: ['Drainage']
   }
];

export const seedDepartments = async () => {
   await Promise.all(
      initialDepartments.map((department) => Department.updateOne(
         { code: department.code },
         { $setOnInsert: department },
         { upsert: true }
      ))
   );
};