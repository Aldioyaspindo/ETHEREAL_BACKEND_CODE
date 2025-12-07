import express from "express";
import UserCustomerController from "../controllers/userCustomerController.js";
import { customerAuth } from "../middleware/customerAuth.js";
import { isCustomer } from "../middleware/isCustomer.js";

const userCustomerRoute = express.Router();

userCustomerRoute.post("/register", UserCustomerController.registerCustomer);
userCustomerRoute.post("/login", UserCustomerController.loginCustomer);

// 🔥 Tambahkan route untuk mendapatkan user login
userCustomerRoute.get("/me", customerAuth, isCustomer, (req, res) => {
  res.json({
    success: true,
    user: req.user,  // req.user berasal dari authMiddleware
  });
});

export default userCustomerRoute;
