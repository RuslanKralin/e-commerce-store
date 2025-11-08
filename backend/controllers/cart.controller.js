import Product from "../models/product.model.js";

export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;
    const existingItem = user.cartItems.find((item) => item.id === productId);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      user.cartItems.push({ id: productId, quantity: 1 });
    }
    await user.save();
    res.status(200).json(user.cartItems);
  } catch (error) {
    console.log("ошибка в addToCart контроллере", error);
    res.status(500).json({ message: error.message });
  }
};

export const getCartProducts = async (req, res) => {
  try {
    // Получаем все товары, ID которых есть в корзине пользователя
    const products = await Product.find({ _id: { $in: req.user.cartItems } });

    // Преобразуем массив товаров, добавляя информацию о количестве
    const cartItems = req.user.cartItems.map((product) => {
      // Находим соответствующий товар в корзине пользователя
      const item = req.user.cartItems.find(
        (cartItem) => cartItem.id === product.id
      );

      // Возвращаем объект с данными товара и его количеством
      return {
        ...product.toJson(), // Копируем все свойства товара
        quantity: item.quantity, // Добавляем количество из корзины
      };
    });

    // Отправляем ответ с массивом товаров
    res.status(200).json(cartItems);
  } catch (error) {
    console.log("ошибка в getCartProducts контроллере", error);
    res.status(500).json({ message: error.message });
  }
};

export const removeAllFromCart = async (req, res) => {
  try {
    const user = req.user;
    user.cartItems = [];
    await user.save();
    res.status(200).json(user.cartItems);
  } catch (error) {
    console.log("ошибка в removeAllFromCart контроллере", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const user = req.user;
    const existingItem = user.cartItems.find(
      (item) => item.productId === productId
    );
    if (existingItem) {
      if (quantity === 0) {
        user.cartItems = user.cartItems.filter(
          (item) => item.productId !== productId
        );
        await user.save();
      }
      existingItem.quantity = quantity;
      await user.save();
    }

    res.status(200).json(user.cartItems);
  } catch (error) {
    console.log("ошибка в updateQuantity контроллере", error);
    res.status(500).json({ message: error.message });
  }
};
