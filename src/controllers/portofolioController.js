import Portofolio from "../models/portofolioModel.js";
import cloudinary from "../config/cloudinaryConfig.js";

const portofolioController = {
  createPortofolio: async (req, res) => {
    try {

      const { keterangan } = req.body;

      // Validasi keterangan
      if (!keterangan || keterangan.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Keterangan tidak boleh kosong",
        });
      }

      // Validasi file
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Gambar tidak boleh kosong",
        });
      }

      // ✅ PERBAIKAN: Ambil URL dan Public ID dengan benar
      const imageUrl = req.file.path; // URL publik Cloudinary
      const imagePublicId = req.file.filename; // Public ID Cloudinary

      // Simpan ke database
      const newPortofolio = await Portofolio.create({
        keterangan: keterangan.trim(),
        gambar: imageUrl,
        gambarPublicId: imagePublicId,
      });

      console.log("Portofolio berhasil dibuat:", newPortofolio);

      return res.status(201).json({
        success: true,
        message: "Portofolio berhasil ditambahkan",
        data: newPortofolio,
      });
    } catch (error) {
      console.error("Create Error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Gagal menambahkan portofolio",
      });
    }
  },

  getPortofolioById: async (req, res) => {
    try {
      const { id } = req.params;
      const portofolio = await Portofolio.findById(id);

      if (!portofolio) {
        return res.status(404).json({
          success: false,
          message: "Portofolio tidak ditemukan",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Berhasil mengambil portofolio by id",
        data: portofolio,
      });
    } catch (error) {
      console.error("error find by id", error.message);
      return res.status(500).json({
        success: false,
        message: "Gagal mengambil data portofolio by id",
        error: error.message,
      });
    }
  },

  getAllPortofolio: async (req, res) => {
    try {
      const portofolio = await Portofolio.find().sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        message: "Berhasil Mengambil Semua Data Portofolio",
        data: portofolio,
      });
    } catch (error) {
      console.error("error get all", error.message);
      return res.status(500).json({
        success: false,
        message: "Gagal Mengambil Semua Data Portofolio",
        error: error.message,
      });
    }
  },

  updatePortofolio: async (req, res) => {
    try {
      const { id } = req.params;
      const { keterangan } = req.body;

      // Validasi keterangan
      if (!keterangan || keterangan.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Keterangan tidak boleh kosong",
        });
      }

      // Cari data lama
      const oldPortofolio = await Portofolio.findById(id);
      if (!oldPortofolio) {
        return res.status(404).json({
          success: false,
          message: "Portofolio tidak ditemukan",
        });
      }

      const updateData = { keterangan: keterangan.trim() };

      // Hanya update gambar jika ada file baru
      if (req.file) {
        // 1. Hapus file lama dari Cloudinary
        if (oldPortofolio.gambarPublicId) {
          try {
            // PERBAIKAN: Gunakan v2.uploader.destroy
            await cloudinary.v2.uploader.destroy(oldPortofolio.gambarPublicId);
            console.log("🗑️ File lama dihapus dari Cloudinary:", oldPortofolio.gambarPublicId);
          } catch (deleteError) {
            console.error("⚠️ Gagal hapus file lama:", deleteError.message);
            // Lanjutkan meskipun gagal hapus file lama
          }
        }

        // 2. Set data gambar baru
        updateData.gambar = req.file.path;
        updateData.gambarPublicId = req.file.filename;
      }

      const updated = await Portofolio.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      console.log("✅ Update berhasil:", updated);

      return res.json({
        success: true,
        message: "Portofolio berhasil diupdate",
        data: updated,
      });
    } catch (error) {
      console.error("❌ Update Error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Gagal update portofolio",
      });
    }
  },

  deletePortofolio: async (req, res) => {
    try {
      const { id } = req.params;
      const portofolio = await Portofolio.findById(id);

      if (!portofolio) {
        return res.status(404).json({
          success: false,
          message: "Portofolio tidak ditemukan",
        });
      }

      // 1. Hapus gambar dari Cloudinary jika ada Public ID
      if (portofolio.gambarPublicId) {
        try {
          // ✅ PERBAIKAN: Gunakan v2.uploader.destroy
          await cloudinary.v2.uploader.destroy(portofolio.gambarPublicId);
          console.log("🗑️ File gambar dihapus dari Cloudinary:", portofolio.gambarPublicId);
        } catch (deleteError) {
          console.error("⚠️ Gagal hapus file dari Cloudinary:", deleteError.message);
          // Lanjutkan untuk hapus dari database
        }
      }

      // 2. Hapus dari database
      await Portofolio.findByIdAndDelete(id);

      console.log("✅ Delete berhasil");

      return res.status(200).json({
        success: true,
        message: "Berhasil Menghapus Data Portofolio",
        data: portofolio,
      });
    } catch (error) {
      console.error("❌ Delete error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Gagal Menghapus Data Portofolio",
        error: error.message,
      });
    }
  },
};

export default portofolioController;