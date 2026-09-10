import mongoose from "mongoose";



const locationSchema = new mongoose.Schema(
   {
      type: {
         type: String,
         enum: ["Point"],
         required: true,
         default: "Point",
      },
      coordinates: {
         type: [Number],
         required: true,
         validate: {
            validator: (coordinates) =>
               coordinates.length === 2 &&
               coordinates[0] >= -180 &&
               coordinates[0] <= 180 &&
               coordinates[1] >= -90 &&
               coordinates[1] <= 90,
            message: "Coordinates must be [longitude, latitude] within valid ranges",
         },
      },
   },
   { _id: false }
);


export default locationSchema;