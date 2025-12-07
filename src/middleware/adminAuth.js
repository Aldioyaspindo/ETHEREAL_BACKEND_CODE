// src/middleware/adminAuth.js
import jwt from "jsonwebtoken";
import UserAdmin from "../models/userAdminModel.js";

export const adminAuth = async (req, res, next) => {
  try {
    let token = null;

    // ✅ 1. Coba ambil dari cookie (prioritas utama)
    if (req.cookies?.adminToken) {
      token = req.cookies.adminToken;
      console.log("🍪 Admin token found in cookie");
    }
    
    // ✅ 2. Fallback: Ambil dari Authorization header
    else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.replace("Bearer ", "");
      console.log("📋 Admin token found in Authorization header");
    }

    // 3. Jika tidak ada token sama sekali
    if (!token) {
      console.log("❌ No admin token found");
      return res.status(401).json({ 
        success: false,
        message: "Admin token tidak ditemukan. Silakan login." 
      });
    }

    // 4. Verifikasi Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token verified for admin:", decoded.id);

    // 5. Cari User di Database
    const admin = await UserAdmin.findById(decoded.id).select("-password");
    
    if (!admin) {
      console.log("❌ Admin not found in database");
      return res.status(403).json({ 
        success: false,
        message: "Hanya admin yang boleh akses" 
      });
    }

    // 6. Periksa Role
    if (admin.role !== "admin") {
      console.log("❌ Invalid role:", admin.role);
      return res.status(403).json({ 
        success: false,
        message: "Akses Ditolak: Role bukan admin." 
      });
    }

    // 7. Attach admin ke request
    req.user = admin;
    console.log("✅ Admin auth successful for:", admin.username);
    next();

  } catch (error) {
    console.error("❌ Admin auth error:", error.message);
    
    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Silakan login kembali.",
      });
    }
    
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token tidak valid. Silakan login kembali.",
      });
    }

    return res.status(401).json({ 
      success: false,
      message: "Token invalid atau expired." 
    });
  }
};