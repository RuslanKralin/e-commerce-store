import { stripe } from "../lib/srtipe.js";
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";

// Создание сессии оплаты Stripe
export const createCheckoutSession = async (req, res) => {
  try {
    // Получаем массив товаров и код купона из тела запроса
    const { products, couponCode } = req.body;

    // Проверяем, что передан корректный массив товаров
    if (!Array.isArray(products) || products.length === 0) {
      return res
        .status(400)
        .json({ error: "Некорректный или пустой массив товаров" });
    }

    let totalAmount = 0;

    // Подготавливаем товары для Stripe
    const lineItems = products.map((product) => {
      // Конвертируем цену в центы (требование Stripe)
      const amount = Math.round(product.price * 100);
      // Считаем общую сумму заказа
      totalAmount += amount * product.quantity;

      // Возвращаем отформатированный товар для Stripe
      return {
        price_data: {
          currency: "usd", // Валюта оплаты
          product_data: {
            name: product.name, // Название товара
            images: [product.image], // Изображение товара
          },
          unit_amount: amount, // Цена за единицу в центах
        },
        quantity: product.quantity || 1, // Количество товара
      };
    });

    // Проверяем купон, если он был передан
    let coupon = null;
    if (couponCode) {
      // Ищем активный купон для пользователя
      coupon = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
      });
      // Если купон найден, применяем скидку
      if (coupon) {
        totalAmount -= Math.round(
          (totalAmount * coupon.discountPercentage) / 100
        );
      }
    }

    // Создаем сессию оплаты в Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], // Тип оплаты - карта
      line_items: lineItems, // Список товаров
      mode: "payment", // Режим одноразового платежа
      // URL для перенаправления после успешной оплаты
      success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      // URL для перенаправления при отмене
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      // Применяем скидочный купон, если есть
      discounts: coupon
        ? [
            {
              coupon: await createStripeCoupon(coupon.discountPercentage),
            },
          ]
        : [],
      // Дополнительные метаданные о заказе
      metadata: {
        userId: req.user._id.toString(), // ID пользователя
        couponCode: couponCode || "", // Код купона (если есть)
        // Информация о товарах в формате JSON
        products: JSON.stringify(
          products.map((p) => ({
            id: p._id,
            quantity: p.quantity,
            price: p.price,
          }))
        ),
      },
    });

    // Если сумма заказа больше 200 долларов (20000 центов), создаем новый купон
    if (totalAmount >= 20000) {
      await createNewCoupon(req.user._id);
    }

    // Возвращаем ID сессии и общую сумму
    res.status(200).json({
      id: session.id,
      totalAmount: totalAmount / 100, // Конвертируем обратно в доллары
    });
  } catch (error) {
    console.error("Ошибка при обработке оплаты:", error);
    res.status(500).json({
      message: "Ошибка при обработке оплаты",
      error: error.message,
    });
  }
};

// Обработка успешной оплаты
export const checkoutSuccess = async (req, res) => {
  try {
    // Получаем ID сессии из тела запроса
    const { sessionId } = req.body;
    // Получаем данные о сессии из Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Проверяем, что платеж успешно прошел
    if (session.payment_status === "paid") {
      // Если использовался купон, помечаем его как неактивный
      if (session.metadata.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            code: session.metadata.couponCode,
            userId: session.metadata.userId,
          },
          {
            isActive: false, // Деактивируем купон
          }
        );
      }

      // Создаем новый заказ в базе данных
      const products = JSON.parse(session.metadata.products);
      const newOrder = new Order({
        user: session.metadata.userId, // ID пользователя
        products: products.map((product) => ({
          product: product.id, // ID товара
          quantity: product.quantity, // Количество
          price: product.price, // Цена
        })),
        totalAmount: session.amount_total / 100, // Общая сумма в долларах
        stripeSessionId: sessionId, // ID сессии Stripe
      });

      // Сохраняем заказ в базе данных
      await newOrder.save();

      // Отправляем успешный ответ
      res.status(200).json({
        success: true,
        message:
          "Оплата прошла успешно, заказ создан, купон деактивирован (если использовался).",
        orderId: newOrder._id, // ID созданного заказа
      });
    }
  } catch (error) {
    console.error("Ошибка при обработке успешной оплаты:", error);
    res.status(500).json({
      message: "Ошибка при обработке успешной оплаты",
      error: error.message,
    });
  }
};

// Создание купона в Stripe
async function createStripeCoupon(discountPercentage) {
  const coupon = await stripe.coupons.create({
    percent_off: discountPercentage, // Процент скидки
    duration: "once", // Срок действия - одноразовый
  });

  return coupon.id; // Возвращаем ID созданного купона
}

// Создание нового купона для пользователя
async function createNewCoupon(userId) {
  // Удаляем старый купон пользователя, если он есть
  await Coupon.findOneAndDelete({ userId });

  // Генерируем случайный код купона
  const newCoupon = new Coupon({
    code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    discountPercentage: 10, // 10% скидка
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Действует 30 дней
    userId: userId, // ID пользователя
  });

  // Сохраняем купон в базе данных
  await newCoupon.save();

  return newCoupon;
}
