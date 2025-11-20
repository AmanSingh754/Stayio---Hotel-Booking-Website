if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
console.log("ENV LOADED:", process.env.NODE_ENV);

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");

const session = require('express-session');
const passport = require("passport");
const User = require("./models/user.js");
const LocalStrategy = require("passport-local").Strategy;

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const flash = require("connect-flash"); 

// ---------------- MONGODB CONNECTION -----------------

// Use MongoDB Atlas on production (Vercel), local DB on development
const MONGO_URL = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/wanderlust";

mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("Connected to MongoDB:", MONGO_URL))
  .catch(err => console.log("MongoDB Connection Error:", err));


// ---------------- EXPRESS & VIEW ENGINE -----------------

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));


// ---------------- SESSION & FLASH -----------------

const sessionOptions = {  
  secret: "mysupersecretcode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    maxAge: 1000 * 60 * 60 * 24 * 7
  },  
};

app.use(session(sessionOptions));
app.use(flash());


// ---------------- PASSPORT AUTH -----------------

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// ---------------- FLASH MIDDLEWARE -----------------

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});


// ---------------- ROUTES -----------------

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);


// ---------------- ERROR HANDLING -----------------

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("error.ejs", { message });
});


// ---------------- SERVER START -----------------

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
