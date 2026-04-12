require("dotenv").config();
const express               = require("express");
const cors                  = require("cors");
const carsRoutes            = require("./routes/carsRoutes");
const carSellRequestsRoutes = require("./routes/carSellRequestsRoutes");
const contactRoutes         = require("./routes/contactRoutes");
const reservationRoutes     = require("./routes/reservationRoutes");
const userRoutes            = require("./routes/userRoutes");
const adminRoutes           = require("./routes/adminRoutes");

const app = express();

app.use(cors({
  origin: [
    'https://rental-96lwv7ud6-ergi3861s-projects.vercel.app',
    'https://rental-seven-xi.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));
// ✅ Krijo folder nëse nuk ekziston
const fs   = require('fs');
const path = require('path');
const sellDir = path.join(__dirname, 'uploads/sell-requests');
if (!fs.existsSync(sellDir)) fs.mkdirSync(sellDir, { recursive: true });

app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => res.send("API is running"));

app.use("/api/auth",          require("./routes/authRoutes"));
app.use("/api/cars",          carsRoutes);
app.use("/api/sell-requests", carSellRequestsRoutes);
app.use("/api/contacts",      contactRoutes);
app.use("/api/reservations",  reservationRoutes);
app.use("/api/user",          userRoutes);
app.use("/api/admin",         adminRoutes);
app.use("/api/search",        require("./routes/searchRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));