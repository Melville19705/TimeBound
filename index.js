import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import cors from "cors";
const users = [];
mongoose
  .connect(
    "mongodb+srv://hardikpandey512:nodejsboy@cluster0.svrtsi8.mongodb.net/?retryWrites=true",
    {
      dbName: "backend",
    }
  )
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

app.get("/", async (req, res) => {
  const { token } = req.cookies;

  if (token) {
    const decoded = jwt.verify(token, "hahahaha");
    req.user = await User.findById(decoded._id);
    res.render("logout.ejs", { name: req.user.name });
  } else {
    res.render("book.ejs");
  }
  res.render("book.ejs");
});

app.get("/success", (req, res) => {
  res.render("success.ejs");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
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
  res.redirect("/");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  let user = await User.findOne({ email });
  if (user) {
    return res.redirect("/login");
  }
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
  res.redirect("/");
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
  res.redirect("/");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/explore", (req, res) => {
  res.render("explore");
});
app.post("/", async (req, res) => {
  await Message.create({
    firstname: req.body.fname,
    lastname: req.body.lname,
    email: req.body.email,
    book: req.body.book,
    time: req.body.time,
  });
  res.redirect("/");
});

app.listen("1000", () => {
  console.log("Server is working.");
});
