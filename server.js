require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { Resend } = require("resend");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;
const resend = new Resend(process.env.RESEND_API_KEY);

mongoose
  .connect("mongodb://kinzabilal9t_db_user:hJHU3VFLHa6HGLXq@ac-2ko06du-shard-00-00.rtavwdd.mongodb.net:27017,ac-2ko06du-shard-00-01.rtavwdd.mongodb.net:27017,ac-2ko06du-shard-00-02.rtavwdd.mongodb.net:27017/graino?ssl=true&replicaSet=atlas-89sq2v-shard-0&authSource=admin&appName=Cluster0")
  .then(() => console.log("✅ MongoDB Connected to grano_db"))
  .catch((err) => console.error("❌ DB Error:", err));

// 1. export ki jagah module.exports use karo
// const connectDB = async () => {
//   if (isConnected) return;

//   try {
//     const db = await mongoose.connect(process.env.MONGO_URI, {
//       serverSelectionTimeoutMS: 5000,
//       socketTimeoutMS: 45000,
//     });
//     isConnected = db.connections[0].readyState === 1;
//     console.log("✅ MongoDB Connected");
//   } catch (err) {
//     console.error("❌ DB Error:", err);
//     throw err;
//   }
// };

// // 2. App start hone se pehle connectDB() call karo
// app.listen(PORT, async () => {
//   await connectDB(); // ← Yeh add karo
//   console.log(`🚀 Server running on port ${PORT}`);
// });

// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("✅ MongoDB Connected"))
//   .catch((err) => console.error("❌ DB Error:", err));

//   console.log("MONGO_URI:", process.env.MONGO_URI);

const orderSchema = new mongoose.Schema(
  {
    orderId: String,

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    country: String,
    city: String,
    streetAddress: String,
    products: Array,
    subtotal: Number,
    deliveryCharges: Number,
    totalPrice: Number,
    paymentMethod: String,
    status: {
      type: String,
      default: "Pending",
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const generateOrderId = () => {
  return (
    "ORD-" +
    Date.now().toString().slice(-6) +
    "-" +
    Math.floor(1000 + Math.random() * 9000)
  );
};

app.post("/api/orders", async (req, res) => {
  try {
    const { userId, firstName, lastName, email, phone, products, subtotal, deliveryCharges, totalPrice, paymentMethod, country, city, streetAddress } = req.body;
    const generatedId = generateOrderId();
    const newOrder = new Order({
      orderId: generatedId,
      userId,
      firstName,
      lastName,
      email,
      phone,
      country,
      city,
      streetAddress,
      products,
      subtotal,
      deliveryCharges,
      totalPrice,
      paymentMethod,
    });

    const savedOrder = await newOrder.save();

    try {
      // const response = await resend.emails.send({
      //   from: "Graino <onboarding@resend.dev>",
      //   to: [email],
      //   subject: `Order Confirmed | ${generatedId}`,
      //   html: `<h2>Order Confirmed 🎉</h2>
      //          <p>Hi ${firstName}, your order ${generatedId} is confirmed.</p>`
      // });

const response = await resend.emails.send({
  from: "onboarding@resend.dev",
  to: ["kinzabilal.9t@gmail.com"], // test ke liye
  subject: `Order Confirmed | ${generatedId}`,
  html: `
    <h2>Order Confirmed 🎉</h2>

    <p>Hi ${firstName},</p>

    <p>Your order has been placed successfully.</p>

    <h3>Order ID: ${generatedId}</h3>

    <p>Total Amount: ${totalPrice}</p>

    <p>Payment Method: ${paymentMethod}</p>

    <p>Thank you for shopping with us.</p>
  `,
});

      console.log("✅ EMAIL RESPONSE:", response);

    } catch (emailErr) {
      console.log("❌ FULL EMAIL ERROR:", emailErr);
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId: generatedId, // Frontend ko wahi ID wapis bhejein
      data: savedOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =======================
// TRACK ORDER
// =======================
app.get("/api/orders/track/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const order = await Order.findOne({
      $and: [
        {
          $or: [
            { orderId: orderId },
            {
              _id: mongoose.isValidObjectId(orderId) ? orderId : null,
            },
          ],
        },
        { userId: userId },
      ],
    });

    if (!order) {
      return res
        .status(404)
        .json({ message: "Order not found or access denied." });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// =======================
// GET ALL ORDERS
// =======================
// ... (Baqi purana code same rakhein)

// =======================
// UPDATE ORDER STATUS
// =======================
// app.put("/api/orders/:id", async (req, res) => {
//   console.log("PUT ROUTE HIT");
//   console.log(req.params.id);

//   try {
//     const { status } = req.body;

//     const updatedOrder = await Order.findByIdAndUpdate(
//       req.params.id,
//       { status },
//       { new: true }
//     );

//     res.json(updatedOrder);
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: err.message });
//   }
// });
app.put("/api/orders/:id", async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// =======================
// GET ALL ORDERS (For Admin)
// =======================
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ... (Baqi Start Server code)

// =======================
// DELETE ORDER
// =======================
app.delete("/api/orders/:id", async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ... (Baqi GET aur START SERVER code wahi rahega)

// =======================
// START SERVER
// =======================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});