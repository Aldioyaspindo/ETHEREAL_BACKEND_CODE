import mongoose from "mongoose";

const catalogSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, "Product name wajib diisi."],
      trim: true,
    },

    productPrice: {
      type: Number,
      required: [true, "Harga wajib diisi."],
      min: [0, "Harga tidak boleh negatif."],
    },

    productDescription: {
      type: String,
      required: [true, "Deskripsi wajib diisi."],
      trim: true,
    },

    // 📌 Banyak gambar (dengan primary)
    productImages: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        isPrimary: { type: Boolean, default: false },
      }
    ],

    // 📌 Warna string biasa
    colors: {
      type: [String],
      required: true,
    },

    // 📌 Ukuran string biasa
    sizes: {
      type: [String],
      required: true,
    },

    // 📌 Stok global
    stock: {
      type: Number,
      required: true,
      min: [0, "Stok tidak boleh negatif."],
      default: 0,
    },

    category: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "catalogs",
  }
);

// INDEX
catalogSchema.index({ productName: 1 });
catalogSchema.index({ category: 1 });
catalogSchema.index({ isActive: 1 });

const Catalog = mongoose.model("Catalog", catalogSchema);

export default Catalog;
