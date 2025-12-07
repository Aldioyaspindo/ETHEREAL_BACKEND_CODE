// routes/catalogRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import catalogController from "../controllers/catalogController.js";
import cloudinary from "../config/cloudinaryConfig.js";
import CloudinaryStoragePkg from "multer-storage-cloudinary";

const CloudinaryStorage = CloudinaryStoragePkg.CloudinaryStorage || CloudinaryStoragePkg;
const catalogRoutes = express.Router();

// ========================================
// KONFIGURASI MULTER DENGAN CLOUDINARY
// ========================================

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    console.log("📤 Multer processing file:", file.originalname);
    return {
      folder: "katalog_produk",
      allowed_formats: ["jpeg", "jpg", "png", "gif", "webp"],
      public_id: `katalog-${Date.now()}-${path.parse(file.originalname).name}`,
      tags: ["katalog"],
      resource_type: "auto",
    };
  },
});

// ustom error handling untuk Cloudinary upload
storage._handleFile = function (req, file, cb) {
  console.log("Starting Cloudinary upload for:", file.originalname);

  const uploadStream = cloudinary.v2.uploader.upload_stream(
    {
      folder: "katalog_produk",
      allowed_formats: ["jpeg", "jpg", "png", "gif", "webp"],
      public_id: `katalog-${Date.now()}-${path.parse(file.originalname).name}`,
      resource_type: "auto",
    },
    (error, result) => {
      if (error) {
        console.error("Cloudinary upload error:", error);
        return cb(error);
      }
      console.log("Cloudinary upload success:", result.secure_url);
      cb(null, {
        path: result.secure_url,
        filename: result.public_id,
      });
    }
  );

  file.stream.pipe(uploadStream);
};

// UBAH: Support multiple files (max 10 images)
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10, // Max 10 files
  },
  fileFilter: (req, file, cb) => {
    console.log("🔍 Multer fileFilter check:", file.originalname);
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      console.log("✅ File type valid");
      cb(null, true);
    } else {
      console.log("❌ File type invalid");
      cb(new Error("Hanya file gambar yang diperbolehkan"));
    }
  },
});

// =======================================
// Optional update
// =======================================
// ===============================
// OPTIONAL UPLOAD FOR UPDATE
// ===============================
const optionalUpload = (req, res, next) => {
  console.log("🔥 optionalUpload terpanggil!");

  const multerUpload = upload.array("images", 10);

  multerUpload(req, res, function (err) {
    console.log("📸 req.files dari multer:", req.files);
    console.log("📝 req.body setelah multer:", req.body);

    if (err instanceof multer.MulterError && err.code === "LIMIT_UNEXPECTED_FILE") {
      console.log("⚠️ Tidak ada file pada update — lanjut");
      return next();
    }

    if (err) {
      console.error("❌ Multer error:", err);
      return next(err);
    }

    next();
  });
};

// ========================================
// ROUTES
// ========================================

// GET all catalogs (with optional filters)
catalogRoutes.get("/", catalogController.getAllCatalog);

// GET catalog by ID`
catalogRoutes.get("/:id", catalogController.getCatalogById);

// ✅ CREATE: Support multiple images upload
// UBAH dari upload.single() ke upload.array()
catalogRoutes.post(
  "/",
  upload.array("images", 10), // ⬅️ PENTING: "images" dan array()
  catalogController.createCatalog
);

// ✅ UPDATE: Support multiple images upload
catalogRoutes.patch(
  "/:id",
  optionalUpload, // ⬅️ PENTING: "images" dan array()
  catalogController.updateCatalog
);

// DELETE catalog
catalogRoutes.delete("/:id", catalogController.deleteCatalog);

// ========================================
// BONUS ROUTES
// ========================================

// Get available colors for a product
catalogRoutes.get("/:id/colors", catalogController.getProductColors);

// Check stock availability
catalogRoutes.get("/:id/stock", catalogController.checkStock);

// ========================================
// ERROR HANDLER
// ========================================
catalogRoutes.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error("Multer Error:", err);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: "Ukuran file terlalu besar. Maksimal 5MB per file.",
      });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: "Terlalu banyak file. Maksimal 10 gambar.",
      });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: "Field name tidak sesuai. Gunakan 'images' untuk upload.",
      });
    }
    
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  } else if (err) {
    console.error("❌ General Error:", err);
    return res.status(400).json({
      success: false,
      message: err.message || "Terjadi kesalahan pada server",
    });
  }
  next();
});

export default catalogRoutes;