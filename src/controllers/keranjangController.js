import jwt from "jsonwebtoken";
import Cart from "../models/keranjangModel.js";
import Catalog from "../models/catalogModel.js";

// Fungsi untuk ambil userId dari cookie
const getUserIdFromCookie = (req) => {
  const token = req.cookies.token;

  if (!token) {
    console.log("User GUEST (tidak ada token)");
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`✅ User terautentikasi: ${decoded.id}`);
    return decoded.id;
  } catch (error) {
    console.error("❌ Token tidak valid:", error.message);
    return null;
  }
};

const KeranjangController = {
  addToCart: async (req, res) => {
    try {
      const { productId, quantity } = req.body;

      // Ambil userId dari cookie (bukan dari session atau body)
      const userId = getUserIdFromCookie(req);

      // Validasi: User HARUS login untuk add to cart
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Silakan login terlebih dahulu untuk menambah ke keranjang",
          requireAuth: true,
        });
      }

      // Validasi product
      const product = await Catalog.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Produk tidak ditemukan",
        });
      }

      // Validasi harga
      if (
        typeof product.productPrice !== "number" ||
        product.productPrice <= 0
      ) {
        console.error("Harga produk tidak valid:", product.productPrice);
        return res.status(500).json({
          success: false,
          message: "Data produk tidak valid",
        });
      }

      // Cari keranjang aktif milik user ini
      let cart = await Cart.findOne({
        userId,
        status: "active",
      });

      // Buat keranjang baru jika belum ada
      if (!cart) {
        cart = new Cart({
          userId,
          items: [],
          status: "active",
        });
      }

      // Cek apakah produk sudah ada di keranjang
      const existingItem = cart.items.find(
        (item) => item.product.toString() === productId
      );

      const qtyToAdd = quantity || 1;

      if (existingItem) {
        existingItem.quantity += qtyToAdd;
      } else {
        cart.items.push({ product: productId, quantity: qtyToAdd });
      }

      // Hitung ulang total harga
      await cart.populate("items.product");
      cart.totalPrice = cart.items.reduce((total, item) => {
        return total + item.product.productPrice * item.quantity;
      }, 0);

      await cart.save();

      res.status(200).json({
        success: true,
        message: "Produk berhasil ditambahkan ke keranjang",
        cart,
      });
    } catch (err) {
      console.error("Error add to cart:", err);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  },

  async getCartByUser(req, res) {
    try {
      const { userId } = req.params;

      const cart = await Cart.findOne({ userId, status: "active" }).populate(
        "items.product"
      );

      if (!cart) {
        return res.json({
          cart: { items: [], totalPrice: 0 },
        });
      }

      res.json({ cart });
    } catch (err) {
      console.log("❌ Error get cart by user:", err);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  },

  getCart: async (req, res) => {
    try {
      const userId = req.user._id;

      const cart = await Cart.findOne({ userId, status: "active" }).populate(
        "items.product"
      );

      if (!cart) {
        return res.status(200).json({
          success: true,
          cart: { items: [], totalPrice: 0 },
        });
      }

      res.status(200).json({
        success: true,
        cart,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Error mengambil keranjang",
      });
    }
  },
  // ✅ Update quantity
 updateCartItem: async (req, res) => {
  try {
    const userId = getUserIdFromCookie(req);
    const { itemId, quantity } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Silakan login terlebih dahulu",
        requireAuth: true,
      });
    }

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: "Item ID harus disertakan",
      });
    }

    const cart = await Cart.findOne({ userId, status: "active" });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Keranjang tidak ditemukan",
      });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item tidak ditemukan di keranjang",
      });
    }

    // Update atau hapus jika quantity <= 0
    if (quantity <= 0) {
      item.remove();
    } else {
      item.quantity = quantity;
    }

    // Hitung ulang total
    await cart.populate("items.product");

    cart.totalPrice = cart.items.reduce((total, item) => {
      return total + (item.product?.productPrice || 0) * item.quantity;
    }, 0);

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Keranjang berhasil diperbarui",
      cart,
    });

  } catch (err) {
    console.error("❌ Error update cart:", err);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
},


  // ✅ Remove item from cart
  removeCartItem: async (req, res) => {
    try {
      // Asumsi: userId sekarang diambil dari req.params karena Anda menggunakan Opsi 2
      // Jika Anda menggunakan Opsi 2, pastikan Anda juga menangani IDOR di sini!
      const { userId, itemId } = req.params; // Menggunakan Opsi 2 dari diskusi sebelumnya

      // 1. Cek Login (Jika Anda belum menggunakan middleware customerAuth)
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Silakan login terlebih dahulu",
          requireAuth: true,
        });
      }

      const cart = await Cart.findOne({ userId, status: "active" });

      if (!cart) {
        return res.status(404).json({
          success: false,
          message: "Keranjang tidak ditemukan",
        });
      }

      // 🛑 PERBAIKAN UTAMA: Menggunakan .pull() alih-alih .remove()
      const itemToRemove = cart.items.id(itemId);

      if (!itemToRemove) {
        return res.status(404).json({
          success: false,
          message: "Item yang diminta tidak ditemukan di keranjang.",
        });
      }

      cart.items.pull(itemToRemove); // Menggunakan metode Mongoose yang benar
      // ----------------------------------------------------------------------

      // Hitung ulang total
      await cart.populate("items.product");
      cart.totalPrice = cart.items.reduce((total, item) => {
        return total + item.product.productPrice * item.quantity;
      }, 0);

      await cart.save();

      res.status(200).json({
        success: true,
        message: "Item berhasil dihapus dari keranjang",
        cart,
      });
    } catch (err) {
      console.error("❌ Error remove cart item:", err);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  },
};

export default KeranjangController;
