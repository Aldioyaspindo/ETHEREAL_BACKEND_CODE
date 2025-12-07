import mongoose from "mongoose";

const portofolioSchema = new mongoose.Schema(
  {
    keterangan: {
      type: String,
      required: [true, "Keterangan Portofolio Wajib Diisi"],
      trim: true,
    },
    // 1. Field 'gambar' sekarang akan menyimpan URL publik Cloudinary
    gambar: {
      type: String,
      trim: true,
      default: null,
    },
    // 2. 🚀 Tambahkan field untuk Public ID Cloudinary
    gambarPublicId: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Portofolio = mongoose.model("Portofolio", portofolioSchema);

export default Portofolio;