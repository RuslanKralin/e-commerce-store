import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import { redis } from "../lib/redis.js";

const generateTokens = (id, role) => {
  const accessToken = jwt.sign({ id, role }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign(
    { id, role },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return { accessToken, refreshToken };
};

// сохраняем refresh token в redis на 7 дней
const saveRefreshToken = async (userId, refreshToken) => {
  await redis.set(`refreshToken:${userId}`, refreshToken, {
    ex: 60 * 60 * 24 * 7,
  });
};

const setCookie = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true, // запрещает доступ к cookie через JavaScript
    secure: process.env.NODE_ENV === "production", // только https
    sameSite: "strict", // для защиты от CSRF атак
    maxAge: 15 * 60 * 1000, // 15 минут
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7 * 1000, // 7 дней
  });
};

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, password });

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    await saveRefreshToken(user._id, refreshToken);

    setCookie(res, accessToken, refreshToken);

    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
      message: "User created successfully",
    });
  } catch (error) {
    console.log("ошибка в register контроллере", error);
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // сравниваем пароли
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }
    // если все ок то генерируем токены
    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    // сохраняем refresh token в redis
    await saveRefreshToken(user._id, refreshToken);
    // устанавливаем cookie
    setCookie(res, accessToken, refreshToken);
    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
      message: "User logged in successfully",
    });
  } catch (error) {
    console.log("ошибка в login контроллере", error);
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      await redis.del(`refreshToken:${decoded.id}`);
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.log("ошибка в logout контроллере", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token не найден" });
    }

    // Верифицируем токен
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Получаем пользователя из БД
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // Проверяем токен в Redis
    const storedRefreshToken = await redis.get(`refreshToken:${decoded.id}`);
    if (storedRefreshToken !== refreshToken) {
      return res.status(401).json({ message: "Неверный refresh token" });
    }

    // Генерируем новые токены
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    const newRefreshToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    // Сохраняем новый refresh токен в Redis
    await redis.set(`refreshToken:${user._id}`, newRefreshToken, {
      ex: 60 * 60 * 24 * 7, // 7 дней
    });

    // Устанавливаем куки
    setCookie(res, accessToken, newRefreshToken);

    // Отправляем ответ
    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        wer: "срака",
      },
      message: "Токены успешно обновлены",
    });
  } catch (error) {
    console.error("Ошибка в refresh контроллере:", error);
    res.status(500).json({
      message: "Ошибка сервера",
      error: error.message,
    });
  }
};
