import Feedback from "../models/feedbackModel.js";

const feedbackController = {
  createFeedback: async (req, res) => {
    try {
      const { komentar, rating } = req.body;
      const feedback = await Feedback.create({
        komentar,
        rating,
      });

      res.status(200).json({
        success: true,
        message: "berhasil memberikan feedback",
        data: feedback,
      });
    } catch (error) {
      console.error("error create", error.message);
      res.status(500).json({
        success: false,
        message: " gagal memberikan feedback ",
        error: error.message,
      });
    }
  },

  getAllFeedback: async (req, res) => {
    try {
      const feedback = await Feedback.find();

      res.status(200).json({
        success: true,
        message: "berhasil mengambil data feedback",
        data: feedback,
      });
    } catch (error) {
      console.error("error get all", error.message);
      res.status(404).json({
        succes: false,
        message: "gagal mengambil data feedback",
        error: error.message,
      });
    }
  },

  getFeedbackById: async (req, res) => {
    try {
      const { id } = req.params;
      const feedback = await Feedback.findById(id);

      res.status(200).json({
        succes: true,
        message: "berhasil mengambil data feedback bedasarkan ID",
        data: feedback,
      });
    } catch (error) {
      console.error("error get by id", error.message);
      res.status(404).json({
        succes: false,
        message: "gagal mengambil data bedasarkan ID",
        error: error.message,
      });
    }
  },

  updateFeedback: async (req, res) => {
    try {
      const { id } = req.params;
      const { komentar, rating } = req.body;

      const feedback = await Feedback.findByIdAndUpdate(
        id, // ID dokumen
        { komentar, rating }, // Data yang akan di-update
        { new: true } // Mengembalikan data terbaru setelah update
      );

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: "Feedback tidak ditemukan",
        });
      }

      res.status(200).json({
        success: true,
        message: "Berhasil update feedback",
        data: feedback,
      });
    } catch (error) {
      console.error("error update", error.message);
      res.status(500).json({
        success: false,
        message: "Gagal mengupdate feedback",
        error: error.message,
      });
    }
  },

  deleteFeedback: async (req, res) => {
    try {
      const { id } = req.params;
      const feedback = await Feedback.findByIdAndDelete(id);

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: "Feedback tidak ditemukan",
        });
      }

      res.status(200).json({
        success: true,
        message: "Berhasil menghapus feedback",
        data: feedback,
      });
    } catch (error) {
      console.error("error delete", error.message);
      res.status(500).json({
        success: false,
        message: "Gagal menghapus data",
        error: error.message,
      });
    }
  },
};

export default feedbackController;
