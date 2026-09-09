import jwt from "jsonwebtoken"
import { config } from "../config/config.js"
import userModel from "../model/user.model.js"


export const authenticate = async (req, res, next) => {
   try {
      const authHeader = req.headers.authorization;
      const token = req.cookies?.token || authHeader?.split(" ")[1];

      if (!token) {
         return res.status(401).json({ message: "Unauthorized" });
      }

      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await userModel.findById(decoded.id);

      if (!user) {
         return res.status(401).json({ message: "Unauthorized" });
      }

      if (!user.isActive) {
         return res.status(401).json({ message: "Unauthorized" });
      }

      req.user = user;
      next();
   } catch (err) {
      console.log(err);
      return res.status(401).json({ message: "Unauthorized" });
   }
};