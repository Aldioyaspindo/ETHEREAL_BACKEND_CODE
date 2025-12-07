import express from "express";
import multer from "multer";
import articleController from "../controllers/articleController.js";

const articleRoutes = express.Router();

// 🔹 Konfigurasi multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // folder penyimpanan file
  },
  filename: (req, file, cb) => {
    // nama file unik biar tidak bentrok
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Routes
articleRoutes.post("/", articleController.createArticle);
articleRoutes.get("/", articleController.getAllArticles);
articleRoutes.get("/:id", articleController.getArticleById);
articleRoutes.put("/:id", articleController.updateArticle);
articleRoutes.delete("/:id", articleController.deleteArticle);

export default articleRoutes;
