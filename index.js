import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import cors from "cors";
import nodemailer from "nodemailer";

const users = [];
mongoose
  .connect(
    "mongodb+srv://hardikco35:g3PAjSYrHMUTz5mO@cluster0.upel5gd.mongodb.net/?retryWrites=true&w=majority",
    {
      dbName: "backend",
    }
  )
  .then(() => console.log("Database Connected"))
  .catch((e) => console.log(e));

const detailSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  email: String,
  book: String,
  time: String,
  mobile:String,
});

const Detail = mongoose.model("Detail", detailSchema);

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

// Nodemailer Start
async function main(to, subject, html, userName) {
  // Async function enables allows handling of promises with await

  // First, define send settings by creating a new transporter:
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", // SMTP server address (usually mail.your-domain.com)
    port: 465, // Port for SMTP (usually 465)
    secure: true, // Usually true if connecting to port 465
    auth: {
      user: "hardikpandey512@gmail.com", // Your email address
      pass: "oxcxxztrerlvwiqk", // Password (for Gmail, your app password)
      // ⚠️ For better security, use environment variables set on the server for these values when deploying
    },
  });

  // Define and send message inside transporter.sendEmail() and await info about send from promise:
  let info = await transporter.sendMail({
    from: '"TimeBound" <timeboundbooks8@gmail.com>',
    to: to,
    subject: subject,
    html: `
    <html>
      <head>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            background-color:#212121;
          }

          ol {
            padding: 0;
            margin: 0;
            list-style-type: decimal;
          }

          li {
            margin-bottom: 10px;
          }
          h1 {
            color: #4285f4;
          }
          p {
            font-size: 16px;
            color: #333;
          }
          .highlight {
            color: #4285f4;
          }
        </style>
      </head>
      <body>
        <h1>Welcome to TimeBound</h1>
        <p>Dear ${userName},</p>
        <p>Thank you for renting a book from our platform. We appreciate your choice and hope you enjoy your reading experience with TimeBound.</p>
        <p>We'll get in touch with you within 24 hours. If you have any questions or concerns, feel free to contact us.<br>Check our website: <a href="https://timebound.onrender.com">TimeBound</a></p>
        <ol>
        <li>Book should be handled with care if book found damaged fine will be applied </li>
        <li>Marking on book with pen and pencil is prohibited </li>
        <li>Delivery will be free of cost within our radar if not it will charge you only Rs10</li>
        <li>If delivery is cancelled at the doorstep there is a fine of Rs100</li>
        </ol>
        <p class="highlight">Happy Reading!</p>
        <p class="highlight">Sincerely,<br>TimeBound Team</p>
      </body>
    </html>
    `,
  });

  console.log(info.messageId); // Random ID generated after successful send (optional)
}
// END

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

app.post("/", (req, res) => {
  const urlParams = new URLSearchParams(req.query);
  const message = urlParams.get("message");

  // Render the EJS template and pass data
  res.render("book", {
    message: "Check your primary or spam gmail directory!",
  });
});

app.post("/", async (req, res) => {
  const { email, subject, html, fname, lname, book, time, mobile} = req.body;

  await Detail.create({
    firstname: fname,
    lastname: lname,
    email,
    book,
    time,
    mobile,
  });

  // Provide correct parameters to the main function
  main(email, "Welcome to TimeBound", html, fname).catch((err) =>
    console.log(err)
  );

  res.redirect("/");
});

app.post("/logout", async (req, res) => {
  const { email, subject, html, fname, lname, book, time, mobile} = req.body;

  await Detail.create({
    firstname: fname,
    lastname: lname,
    email,
    book,
    time,
    mobile,
  });

  // Provide correct parameters to the main function
  main(email, "Welcome to TimeBound", html, fname).catch((err) =>
    console.log(err)
  );

  res.render("logout.ejs");
});

app.get("/privacy-policy", (req, res) => {
  res.render("privacy-policy");
});

app.get("/terms-conditions", (req, res) => {
  res.render("terms-conditions");
});

app.listen("1000", () => {
  console.log("Server is working.");
});
