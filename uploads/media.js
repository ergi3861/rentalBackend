const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const db = require("../config/db");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key:    process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "rental",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files allowed"), false);
    }
    cb(null, true);
  }
});

const registerMany = async (files, carId) => {
  if (!files || files.length === 0) return [];
  const sql = "INSERT INTO media (image_path, car_id) VALUES ?";
  const values = files.map(f => [f.path, carId]); // f.path = Cloudinary URL
  const [result] = await db.query(sql, [values]);
  return result;
};

const register = async (imagePath, carId) => {
  const sql = "INSERT INTO media (image_path, car_id) VALUES (?, ?)";
  const [result] = await db.query(sql, [imagePath, carId]);
  return result;
};

const getById = async (id) => {
  const [rows] = await db.query("SELECT * FROM media WHERE id = ?", [id]);
  return rows;
};

const getByCarId = async (carId) => {
  const [rows] = await db.query("SELECT * FROM media WHERE car_id = ? ORDER BY id ASC", [carId]);
  return rows;
};

const deleteByCarId = async (carId) => {
  const [result] = await db.query("DELETE FROM media WHERE car_id = ?", [carId]);
  return result;
};

module.exports = { upload, register, registerMany, getById, getByCarId, deleteByCarId };