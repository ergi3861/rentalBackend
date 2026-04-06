require("dotenv").config();
const express               = require("express");
const cors                  = require("cors");
const carsRoutes            = require("./routes/carsRoutes");
const carSellRequestsRoutes = require("./routes/carSellRequestsRoutes");
const contactRoutes         = require("./routes/contactRoutes");
const reservationRoutes     = require("./routes/reservationRoutes");
const userRoutes            = require("./routes/userRoutes");

const app = express();

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true
}));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => res.send("API is running"));

app.use("/api/auth",          require("./routes/authRoutes"));
app.use("/api/cars",          carsRoutes);
app.use("/api/sell-requests", carSellRequestsRoutes);
app.use("/api/contacts",      contactRoutes);
app.use("/api/reservations",  reservationRoutes);
app.use("/api/user",          userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));