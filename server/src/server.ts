import express from "express";
import bodyParser from "body-parser";
import env from "dotenv";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import cors from "cors";
import sgMail from "@sendgrid/mail";
import RedisStore from "connect-redis";
import { createClient } from "redis";
import { Client } from "pg";
import bcrypt from "bcrypt";

env.config();
const app = express();
const port = process.env.PORT || 3000;
sgMail.setApiKey(process.env.SG || "");

// Redis client setup
const redisClient = createClient({
  url: process.env.REDIS,
});
redisClient.on("error", (err) => console.log("Redis Client Error", err));

(async () => {
  await redisClient.connect();
  console.log("Connected to Redis");
})();

// Initialize Redis store
const redisStore = new RedisStore({
  client: redisClient,
});

app.set("trust proxy", 1); // Trust the first proxy

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuring cors
app.use(
  cors({
    origin: process.env.ORIGIN,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

// PostgreSQL client setup
const pgClient = new Client({
  connectionString: process.env.PG,
  ssl: {
    rejectUnauthorized: false,
  },
});

(async () => {
  await pgClient.connect();
  console.log("Connected to PostgreSQL");
})();

// Passport local strategy for authentication
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const res = await pgClient.query(
          "SELECT * FROM users WHERE email = $1",
          [email]
        );
        const user = res.rows[0];
        if (!user) {
          return done(null, false, { message: "Incorrect email." });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  // Explicitly cast the user object to have an id property
  done(null, (user as any).id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const res = await pgClient.query("SELECT * FROM users WHERE id = $1", [id]);
    const user = res.rows[0];
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Session setup
declare module "express-session" {
  interface SessionData {
    cookieConsent?: boolean;
  }
}

app.use(
  session({
    store: redisStore,
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: "none",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Middleware to check if user is authenticated
function isAuthenticated(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send({ code: 1, message: "Unauthorized" });
}

// Register route
app.post("/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    const existingUser = await pgClient.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).send({ code: 1, message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await pgClient.query(
      "INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4)",
      [firstName, lastName, email, hashedPassword]
    );
    res.status(201).send({ code: 0, message: "User registered successfully" });
  } catch (err) {
    res.status(500).send({ code: 1, message: "Error registering user" });
  }
});

// Login route
app.post("/login", passport.authenticate("local"), (req, res) => {
  res.send({ code: 0, message: "Login successful" });
});

// Logout route
app.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).send({ code: 1, message: "Error logging out" });
    }
    req.session.destroy((err) => {
      if (err) {
        return res
          .status(500)
          .send({ code: 1, message: "Error destroying session" });
      }
      res.clearCookie("connect.sid", { path: "/" }); // Clear the session cookie
      res.send({ code: 0, message: "Logout successful" });
    });
  });
});

// Validate email route
app.post("/validateEmail", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await pgClient.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (user.rows.length > 0) {
      return res.send({ code: 0, message: "Email exists" });
    }
    res.send({ code: 1, message: "Email does not exist" });
  } catch (err) {
    res.status(500).send({ code: 1, message: "Error validating email" });
  }
});

// Unauthenticated check route
app.get("/unauthenticated", (req, res) => {
  if (!req.isAuthenticated()) {
    return res
      .status(200)
      .send({ code: 0, message: "User is not authenticated" });
  }
  res.status(200).send({ code: 1, message: "User is authenticated" });
});

// Get alphabet value route
app.get("/getAlphabetValue", isAuthenticated, async (req, res) => {
  const { userId, alphabet } = req.query;
  if (!/^[a-z]$/.test(alphabet as string)) {
    return res
      .status(400)
      .send({ code: 1, message: "Invalid alphabet character" });
  }

  try {
    const user = await pgClient.query(
      `SELECT ${alphabet} FROM users WHERE id = $1`,
      [userId]
    );
    if (user.rows.length === 0) {
      return res.status(404).send({ code: 1, message: "User not found" });
    }
    res.send({ code: 0, value: user.rows[0][alphabet as string] });
  } catch (err) {
    res
      .status(500)
      .send({ code: 1, message: "Error retrieving alphabet value" });
  }
});

// Update alphabet value route
app.post("/updateAlphabetValue", isAuthenticated, async (req, res) => {
  const { userId, alphabet, value } = req.body;
  if (!/^[a-z]$/.test(alphabet) || !Number.isInteger(value)) {
    return res.status(400).send({ code: 1, message: "Invalid input" });
  }

  try {
    const user = await pgClient.query(
      `UPDATE users SET ${alphabet} = $1 WHERE id = $2`,
      [value, userId]
    );
    if (user.rowCount === 0) {
      return res.status(404).send({ code: 1, message: "User not found" });
    }
    res.send({ code: 0, message: "Alphabet value updated successfully" });
  } catch (err) {
    res.status(500).send({ code: 1, message: "Error updating alphabet value" });
  }
});

// Route to update cookie consent
app.post("/updateCookieConsent", (req, res) => {
  console.log("Directed to POST Route -> /updateCookieConsent");
  const { consent } = req.body;

  // Store consent in session
  req.session.cookieConsent = consent;

  res.status(200).json({ code: 0, message: "Cookie consent updated" });
});

// Route to check cookie consent
app.get("/getCookieConsent", (req, res) => {
  const consent = req.session.cookieConsent;
  res.status(200).json({ code: 0, consent });
});

// Route to check session
app.get("/check-session", (req, res) => {
  console.log("Directed to get route to check session");
  if (req.isAuthenticated()) {
    console.log("User is authenticated");
    const user = req.user as { email: string };
    const email = user.email;
    res.status(200).json({ isAuthenticated: true, email });
  } else {
    console.log("User is not authenticated");
    res.status(200).json({ isAuthenticated: false });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
