// keranjangRoute.js
import express from "express";
import KeranjangController from "../controllers/keranjangController.js";
import { customerAuth } from "../middleware/customerAuth.js";

const keranjangrouter = express.Router();

// POST: Add to cart
keranjangrouter.post("/add", customerAuth, KeranjangController.addToCart);

// GET: Get cart
keranjangrouter.get("/", customerAuth, KeranjangController.getCart);

// PUT: Update cart item quantity
keranjangrouter.put("/update", customerAuth, KeranjangController.updateCartItem);


// DELETE: Remove specific item
keranjangrouter.delete("/item/:userId/:itemId", customerAuth, KeranjangController.removeCartItem);

// keranjangrouter.get("/user/:userId", KeranjangController.getCartByUser);

export default keranjangrouter;