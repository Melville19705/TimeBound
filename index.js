import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

mongoose
  .connect(
    "mongodb+srv://hardikjsboy512:MbUeYgnTILFR5owd@timebound.nhlbvph.mongodb.net/?retryWrites=true&w=majority",
    {
      dbName: "backend",
      useNewUrlParser: true, // Correcting the typo here
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
  mobile: Number,
});

const Message = mongoose.model("Message", detailSchema);

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
});

const User = mongoose.model("User", userSchema);

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(path.resolve(), "views"));
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Nodemailer Start
async function main(to, subject, userName, formData) {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "timeboundbooks8@gmail.com",
      pass: "grdsjikefqdaiyad",
    },
  });

  // Send welcome email to the user
  let userMailInfo = await transporter.sendMail({
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

  // Send email to timeboundbooks8@gmail.com with user input data
  let adminMailInfo = await transporter.sendMail({
    from: '"TimeBound" <timeboundbooks8@gmail.com>',
    to: "timeboundbooks8@gmail.com",
    subject: "User Input Data",
    html: `
      <html>
        <head>
          <!-- Your styles here -->
        </head>
        <body>
          <h1>User Input Data</h1>
          <p>First Name: ${formData.firstname}</p>
          <p>Last Name: ${formData.lastname}</p>
          <p>Email: ${formData.email}</p>
          <p>Book: ${formData.book}</p>
          <p>Time: ${formData.time}</p>
          <p>Mobile: ${formData.mobile}</p>
        </body>
      </html>
    `,
  });

  console.log("Welcome email sent to user:", userMailInfo.messageId);
  console.log(
    "Admin email with user input data sent:",
    adminMailInfo.messageId
  );

  // Additional logic to handle the user's input data
  console.log("User Data:", formData);
}
async function sendVerificationEmail(
  to,
  subject,
  userName,
  verificationLink,
  htmlContent
) {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "timeboundbooks8@gmail.com",
      pass: "grdsjikefqdaiyad",
    },
  });

  try {
    let userMailInfo = await transporter.sendMail({
      from: '"TimeBound" <timeboundbooks8@gmail.com>',
      to: to,
      subject: subject,
      html: htmlContent,
    });

    console.log("Verification email sent to user:", userMailInfo.messageId);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error; // Propagate the error to the caller
  }
}

// END

app.get("/", async (req, res) => {
  const { token } = req.cookies;

  if (token) {
    const decoded = jwt.verify(token, "hahahaha");
    req.user = await User.findById(decoded._id);
    return res.render("logout.ejs", { name: req.user.name });
  } else {
    return res.render("book.ejs");
  }
});

app.get("/success", (req, res) => {
  res.render("success.ejs");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let user = await User.findOne({ email });
  let redirectPath = "/"; // Default redirection path

  if (!user) {
    return res.redirect("/register");
  }
  if (!user.isVerified) {
    return res.render("login.ejs", {
      email,
      message: "Email not verified. Check your email for instructions.",
    });
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

  res.redirect(redirectPath);
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  let user = await User.findOne({ email });
  const verificationToken = jwt.sign({ email }, "hahahaha", {
    expiresIn: "1d",
  });
  if (user) {
    return res.redirect("/login");
  }

  user = await User.create({
    name,
    email,
    password,
    verificationToken,
  });

  const token = jwt.sign({ _id: user._id }, "hahahaha");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
    sameSite: process.env.NODE_ENV === "Development" ? "lax" : "none",
    secure: process.env.NODE_ENV === "Development" ? "false" : "true",
  });
  // Send verification email
  const verificationLink = `http://localhost:1000/verify?token=${verificationToken}`;
  const verificationSubject = "Verify your email with TimeBound";
  const verificationHTML = `
    <html>
      <head>
        <style>
          /* Your email styles here */
        </style>
      </head>
      <body>
        <h1>Welcome to TimeBound</h1>
        <p>Dear ${name},</p>
        <p>Thank you for registering with TimeBound. To complete your registration, please verify your email by clicking the link below:</p>
        <p><a href="${verificationLink}">${verificationLink}</a></p>
        <p>If you did not request this verification, please ignore this email.</p>
        <p class="highlight">Sincerely,<br>TimeBound Team</p>
      </body>
    </html>
  `;

  try {
    await sendVerificationEmail(
      email,
      verificationSubject,
      name,
      verificationLink,
      verificationHTML
    );
    console.log("Verification email sent successfully");
  } catch (error) {
    console.error("Error sending verification email:", error);
    // Handle the error as needed
  }

  res.render("register.ejs", {
    message: "Check your email for verification instructions.",
  });
  // res.redirect("/login");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/verify", async (req, res) => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, "hahahaha");
    const user = await User.findOne({ email: decoded.email });

    if (user) {
      user.isVerified = true;
      user.verificationToken = null; // Optional: Clear the verification token after successful verification
      await user.save();

      // Redirect to the login page upon successful verification
      res.redirect("/login");
    } else {
      res.render("verify.ejs", { message: "Invalid verification token." });
    }
  } catch (error) {
    console.error(error);
    res.render("verify.ejs", {
      message: "Error verifying email. Please try again.",
    });
  }
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
// app.post("/", (req, res) => {
// const urlParams = new URLSearchParams(req.query);
// const message = urlParams.get("message");

// // Render the EJS template and pass data
// res.render("book", {
//   message: "Check your primary or spam gmail directory!",
// });
// });

app.post("/", async (req, res) => {
  const { token } = req.cookies;

  // Check if the user is not logged in
  if (!token) {
    // Redirect to the login page
    return res.redirect("/login");
  }

  // User is logged in, proceed with form submission
  const { email, subject, html, fname, lname, book, time, mobile } = req.body;
  const formData = {
    firstname: fname,
    lastname: lname,
    email,
    book,
    time,
    mobile,
  };

  try {
    const result = await Message.create({
      firstname: fname,
      lastname: lname,
      email,
      book,
      time,
      mobile: parseInt(mobile, 10),
    });

    console.log("Data inserted successfully:", result);

    await main(email, "Welcome to TimeBound", fname, formData);

    res.render("book", {
      message: "Check your primary or spam Gmail directory!",
    });
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/logout", async (req, res) => {
  const { email, subject, html, fname, lname, book, time, mobile } = req.body;
  const formData = {
    firstname: fname,
    lastname: lname,
    email,
    book,
    time,
    mobile,
  };

  try {
    const result = await Message.create({
      firstname: fname,
      lastname: lname,
      email,
      book,
      time,
      mobile: parseInt(mobile, 10),
    });

    console.log("Data inserted successfully:", result);

    await main(email, "Welcome to TimeBound", fname, formData);

    res.render("logout", {
      message: "Check your primary or spam Gmail directory!",
    });
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).send("Internal Server Error");
  }
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
