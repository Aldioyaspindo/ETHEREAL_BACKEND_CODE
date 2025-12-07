// controllers/catalogController.js
import Catalog from "../models/catalogModel.js";
import cloudinary from "../config/cloudinaryConfig.js";

const catalogController = {

  // CREATE
  async createCatalog(req, res) {
    try {
      const {
        productName,
        productPrice,
        productDescription,
        category,
        colors,
        sizes,
        stock,
      } = req.body;

      // Validasi data wajib
      if (!productName || !productPrice) {
        return res.status(400).json({
          success: false,
          message: "Nama produk dan harga wajib diisi",
        });
      }

      // Parse colors & sizes
      let parsedColors = [];
      let parsedSizes = [];

      if (colors) {
        try {
          parsedColors = Array.isArray(colors) ? colors : JSON.parse(colors);
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: "Format colors tidak valid",
          });
        }
      }

      if (sizes) {
        try {
          parsedSizes = Array.isArray(sizes) ? sizes : JSON.parse(sizes);
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: "Format sizes tidak valid",
          });
        }
      }

      if (parsedColors.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Minimal 1 warna harus ditambahkan",
        });
      }

      if (parsedSizes.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Minimal 1 ukuran harus ditambahkan",
        });
      }

      // Handle multiple images
      const productImages = [];
      if (req.files && req.files.length > 0) {
        req.files.forEach((file, index) => {
          productImages.push({
            url: file.path,
            publicId: file.filename,
            isPrimary: index === 0,
          });
        });
      }

      if (productImages.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Minimal 1 gambar produk harus diupload",
        });
      }

      const newCatalog = new Catalog({
        productName,
        productPrice,
        productDescription,
        category,
        productImages,
        colors: parsedColors,
        sizes: parsedSizes,
        stock: stock || 0,
        isActive: true,
      });

      await newCatalog.save();

      res.status(201).json({
        success: true,
        message: "Catalog berhasil ditambahkan",
        data: newCatalog,
      });

    } catch (error) {
      console.error("❌ Create Catalog Error:", error);

      // Hapus gambar jika gagal
      if (req.files?.length) {
        for (const file of req.files) {
          await cloudinary.v2.uploader.destroy(file.filename).catch(() => {});
        }
      }

      res.status(500).json({
        success: false,
        message: error.message || "Gagal menambahkan catalog",
      });
    }
  },

  // GET ALL
  async getAllCatalog(req, res) {
    try {
      const { category, isActive } = req.query;

      const filter = {};
      if (category) filter.category = category;
      if (isActive !== undefined) filter.isActive = isActive === "true";

      const catalogs = await Catalog.find(filter).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        message: "Berhasil mengambil semua catalog",
        count: catalogs.length,
        data: catalogs,
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // GET BY ID
  async getCatalogById(req, res) {
    try {
      const catalog = await Catalog.findById(req.params.id);

      if (!catalog) {
        return res.status(404).json({
          success: false,
          message: "Catalog tidak ditemukan",
        });
      }

      res.status(200).json({
        success: true,
        data: catalog,
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // UPDATE
  async updateCatalog(req, res) {
    try {
      const catalog = await Catalog.findById(req.params.id);
      if (!catalog) {
        return res.status(404).json({
          success: false,
          message: "Catalog tidak ditemukan",
        });
      }

      const updateData = { ...req.body };

      // Parse colors & sizes
      if (req.body.colors) {
        updateData.colors = JSON.parse(req.body.colors);
      }
      if (req.body.sizes) {
        updateData.sizes = JSON.parse(req.body.sizes);
      }

      // Upload gambar baru
      if (req.files?.length) {
        const newImages = req.files.map((file, index) => ({
          url: file.path,
          publicId: file.filename,
          isPrimary: index === 0,
        }));

        let existingImages = [];
        if (req.body.existingImages) {
          existingImages = JSON.parse(req.body.existingImages);
        }

        updateData.productImages = [...existingImages, ...newImages];
      }

      // Hapus gambar yang dipilih
      if (req.body.deletedImages) {
        const deleteList = JSON.parse(req.body.deletedImages);
        for (const publicId of deleteList) {
          await cloudinary.v2.uploader.destroy(publicId).catch(() => {});
        }
      }

      const updated = await Catalog.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: "Catalog berhasil diupdate",
        data: updated,
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // DELETE
  async deleteCatalog(req, res) {
    try {
      const catalog = await Catalog.findById(req.params.id);
      if (!catalog) {
        return res.status(404).json({
          success: false,
          message: "Catalog tidak ditemukan",
        });
      }

      // Hapus gambar dari Cloudinary
      for (const img of catalog.productImages) {
        await cloudinary.v2.uploader.destroy(img.publicId).catch(() => {});
      }

      await Catalog.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: "Catalog berhasil dihapus",
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // BONUS: GET COLORS
  async getProductColors(req, res) {
    try {
      const catalog = await Catalog.findById(req.params.id);
      if (!catalog) {
        return res.status(404).json({ success: false, message: "Catalog tidak ditemukan" });
      }

      res.status(200).json({
        success: true,
        data: catalog.colors,
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // BONUS: stock hanya global, tidak per warna/size
  async checkStock(req, res) {
    try {
      const catalog = await Catalog.findById(req.params.id);
      if (!catalog) {
        return res.status(404).json({ success: false, message: "Catalog tidak ditemukan" });
      }

      res.status(200).json({
        success: true,
        data: {
          stock: catalog.stock,
          available: catalog.stock > 0,
        },
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

};

export default catalogController;
