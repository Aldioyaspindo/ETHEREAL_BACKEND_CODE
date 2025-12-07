import jwt from "jsonwebtoken";
import UserCustomer from "../models/userCustomerModel.js";

export const customerAuth = async (req, res, next) => {
  try {
    let token = null;

    // ✅ 1. Coba ambil dari cookie (prioritas utama)
    if (req.cookies?.token) {
      token = req.cookies.token;
      console.log("🍪 Token found in cookie");
    }
    
    // ✅ 2. Fallback: Ambil dari Authorization header
    else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.replace("Bearer ", "");
      console.log("📋 Token found in Authorization header");
    }

    // 3. Jika tidak ada token sama sekali
    if (!token) {
      console.log("No token found");
      return res.status(401).json({
        success: false,
        requireAuth: true,
        message: "Akses Ditolak. Anda harus login untuk mengakses resource ini.",
      });
    }

    // 4. Verifikasi Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token verified for user:", decoded.username);

    // 5. Cari User di Database
    const customer = await UserCustomer.findById(decoded.id).select("-password");
    
    if (!customer) {
      console.log("User not found in database");
      return res.status(401).json({ 
        success: false,
        message: "Sesi tidak valid: Pengguna tidak ditemukan." 
      });
    }

    // 6. Periksa Role
    if (decoded.role !== "customer") {
      console.log("Invalid role:", decoded.role);
      return res.status(403).json({ 
        success: false,
        message: "Akses Ditolak: Role bukan customer." 
      });
    }

    // 7. Attach user ke request
    req.user = customer;
    console.log("Auth successful for:", customer.username);
    next();

  } catch (error) {
    console.error("Auth error:", error.message);
    
    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        requireAuth: true,
        message: "Token expired. Silakan login kembali.",
      });
    }
    
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        requireAuth: true,
        message: "Token tidak valid. Silakan login kembali.",
      });
    }

    return res.status(401).json({
      success: false,
      requireAuth: true,
      message: "Akses Ditolak. Autentikasi gagal.",
      error: error.message,
    });
  }
};