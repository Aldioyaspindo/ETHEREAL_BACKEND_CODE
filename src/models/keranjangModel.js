import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Catalog",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  { versionKey: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserCustomer",
      required: true, // WAJIB (hanya user login yang punya cart)
    },
    // HAPUS sessionId (tidak dipakai lagi)
    items: [cartItemSchema],
    totalPrice: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "checked_out"],
      default: "active",
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "carts",
  }
);

// ✅ Index untuk performa query
cartSchema.index({ userId: 1, status: 1 });

export default mongoose.model("Cart", cartSchema);
