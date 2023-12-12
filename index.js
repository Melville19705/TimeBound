import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import cors from "cors";

const users = [];

mongoose
  .connect("mongodb+srv://hardikpandey512:nodejsboy@cluster0.svrtsi8.mongodb.net/?retryWrites=true", {
    dbName: "backend",
  })
  .then(() => console.log("Database Connected"))
  .catch((e) => console.log(e));

const messageSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  email: String,
  book: String,
  time: String,
});

const Message = mongoose.model("Message", messageSchema);

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});
const User = mongoose.model("User", userSchema);

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(path.resolve(), "views"));
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Middleware to handle errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

app.get("/", async (req, res, next) => {
  const { token } = req.cookies;

  try {
    if (token) {
      const decoded = jwt.verify(token, "hahahaha");
      req.user = await User.findById(decoded._id);
      return res.render("logout.ejs", { name: req.user.name });
    } else {
      // Removed the duplicate res.render line
      return res.render("book.ejs");
    }
  } catch (error) {
    next(error); // Pass the error to the error-handling middleware
  }
});

app.get("/success", (req, res) => {
  res.render("success.ejs");
});

app.post("/login", async (req, res, next) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.redirect("/register");
    }
    const isMatch = user.password === password;
    if (!isMatch) {
      return res.render("login.ejs", { email, message: "Incorrect Password" });
    }

    const token = jwt.sign({ _id: user._id }, "hahahaha");
    res.cookie("token", token, {
      httpOnly: true,
      expires: new Date(Date.now() + 60 * 1000),
      sameSite: process.env.NODE_ENV === "Development" ? "lax" : "none",
      secure: process.env.NODE_ENV === "Development" ? "false" : "true",
    });
    return res.redirect("/");
  } catch (error) {
    next(error); // Pass the error to the error-handling middleware
  }
});

app.post("/", async (req, res, next) => {
  try {
    await Message.create({
      firstname: req.body.fname,
      lastname: req.body.lname,
      email: req.body.email,
      book: req.body.book,
      time: req.body.time,
    });
    return res.redirect("/");
  } catch (error) {
    next(error); // Pass the error to the error-handling middleware
  }
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  let user = await User.findOne({ email });

  if (user) {
    return res.redirect("/login");
  }

  try {
    user = await User.create({
      name,
      email,
      password,
    });
    const token = jwt.sign({ _id: user._id }, "hahahaha");
    res.cookie("token", token, {
      httpOnly: true,
      expires: new Date(Date.now() + 60 * 1000),
      sameSite: process.env.NODE_ENV === "Development" ? "lax" : "none",
      secure: process.env.NODE_ENV === "Development" ? "false" : "true",
    });
    return res.redirect("/");
  } catch (error) {
    next(error); // Pass the error to the error-handling middleware
  }
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
    sameSite: process.env.NODE_ENV === "Development" ? "lax" : "none",
    secure: process.env.NODE_ENV === "Development" ? "false" : "true",
  });
  return res.redirect("/");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/explore", (req, res) => {
  res.render("explore");
});

app.listen(1000, () => {
  console.log("Server is working.");
});

