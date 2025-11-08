import Product from "../models/product.model.js";
import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    console.log("ошибка в getAllProducts контроллере", error);
    res.status(500).json({ message: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { image } = req.body;
    let cloudinaryResponse = null;

    if (image) {
      cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: "products",
      });
    }
    const product = await Product.create({
      ...req.body,
      image: cloudinaryResponse?.secure_url || "",
    });

    res.status(201).json(product);
  } catch (error) {
    console.log("ошибка в createProduct контроллере", error);
    res.status(500).json({ message: error.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    let products = await redis.get("featuredProducts");
    if (!products) {
      products = await Product.find({ isFeatured: true }).lean();
      await redis.set("featuredProducts", JSON.stringify(products));
    }
    res.status(200).json(products);
  } catch (error) {
    console.log("ошибка в getFeaturedProducts контроллере", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.image) {
      const public_id = product.image.split("/").pop().split(".")[0]; // Получаем public_id из URL
      try {
        await cloudinary.uploader.destroy(`products/${public_id}`);
        console.log("Image deleted from Cloudinary");
      } catch (error) {
        console.log("ошибка в deleteProduct контроллере", error);
      }
    }
    await Product.findByIdAndDelete(req.params.id);
    if (product.isFeatured) {
      await redis.del("featuredProducts");
    }
    res.status(200).json(product);
  } catch (error) {
    console.log("ошибка в deleteProduct контроллере", error);
    res.status(500).json({ message: error.message });
  }
};

export const getRecommendProduct = async (req, res) => {
  try {
    // Используем метод aggregate для сложных запросов к MongoDB
    const products = await Product.aggregate([
      {
        // $sample - оператор, который случайным образом выбирает документы
        // size: 3 - количество случайных документов для выбора
        $sample: {
          size: 3,
        },
      },
      {
        // $project - определяет, какие поля вернуть в результате
        // 1 - включить поле, 0 - исключить
        $project: {
          _id: 1, // Включаем ID товара
          name: 1, // Название товара
          price: 1, // Цена
          description: 1, // Описание товара
          image: 1, // URL изображения
        },
      },
    ]);

    // Отправляем массив из 3 случайных товаров
    res.status(200).json(products);
  } catch (error) {
    console.log("ошибка в recommendProduct контроллере", error);
    res.status(500).json({ message: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    const products = await Product.find({ category });
    res.status(200).json(products);
  } catch (error) {
    console.log("ошибка в getProductsByCategory контроллере", error);
    res.status(500).json({ message: error.message });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      product.isFeatured = !product.isFeatured;
      const updatedProduct = await product.save();
      await updateFeaturedProducts();
      res.status(200).json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.log("ошибка в toggleFeaturedProduct контроллере", error);
    res.status(500).json({ message: error.message });
  }
};

const updateFeaturedProducts = async () => {
  try {
    // метод lean возвращает объекты в виде обычных объектов JavaScript, а не документов MongoDB и это позволяет нам использовать метод JSON.stringify() и это оптимизирует производительность запросов к базе данных
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set("featuredProducts", JSON.stringify(featuredProducts));
  } catch (error) {
    console.log("ошибка в updateFeaturedProducts контроллере", error);
  }
};
