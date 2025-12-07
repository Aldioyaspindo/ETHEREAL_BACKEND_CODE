// portofolioRoute.js
import express from "express";
import multer from "multer";
import path from "path";
import portofolioController from "../controllers/portofolioController.js";

//BARU: Import Cloudinary Storage dan Config
import CloudinaryStoragePkg from 'multer-storage-cloudinary';
const CloudinaryStorage = CloudinaryStoragePkg.CloudinaryStorage || CloudinaryStoragePkg;
import cloudinary from "../config/cloudinaryConfig.js";

const PortofolioRouter = express.Router();

// Konfigurasi storage dengan error handling
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    console.log("📤 Multer processing file:", file.originalname);
    return {
      folder: "portofolio_project",
      allowed_formats: ["jpeg", "jpg", "png", "gif", "webp"],
      public_id: `portofolio-${Date.now()}-${path.parse(file.originalname).name}`,
      tags: ["portofolio"],
      resource_type: "auto", // ✅ Tambahkan ini
    };
  },
});

// ✅ Tambahkan error handling
storage._handleFile = function (req, file, cb) {
  console.log("🚀 Starting Cloudinary upload for:", file.originalname);
  
  const uploadStream = cloudinary.v2.uploader.upload_stream(
    {
      folder: "portofolio_project",
      allowed_formats: ["jpeg", "jpg", "png", "gif", "webp"],
      public_id: `portofolio-${Date.now()}-${path.parse(file.originalname).name}`,
      resource_type: "auto",
    },
    (error, result) => {
      if (error) {
        console.error("❌ Cloudinary upload error:", error);
        return cb(error);
      }
      console.log("✅ Cloudinary upload success:", result.secure_url);
      cb(null, {
        path: result.secure_url,
        filename: result.public_id,
      });
    }
  );

  file.stream.pipe(uploadStream);
};

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
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

// ✅ Wrapper untuk error handling
const uploadMiddleware = (req, res, next) => {
  console.log("📥 Upload middleware started");
  
  upload.single("gambar")(req, res, (err) => {
    if (err) {
      console.error("❌ Multer error:", err);
      return res.status(400).json({
        success: false,
        message: err.message || "Error saat upload file"
      });
    }
    console.log("✅ Upload middleware completed");
    next();
  });
};

// Field name untuk file di frontend HARUS 'gambar'
PortofolioRouter.post(
  "/",
  upload.single("gambar"),
  portofolioController.createPortofolio
);
PortofolioRouter.get("/", portofolioController.getAllPortofolio);
PortofolioRouter.get("/:id", portofolioController.getPortofolioById);
PortofolioRouter.patch(
  "/:id",
  upload.single("gambar"),
  portofolioController.updatePortofolio
);
PortofolioRouter.delete("/:id", portofolioController.deletePortofolio);

export default PortofolioRouter;
