import express from "express";
import bodyParser from "body-parser";
import env from "dotenv";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import cors from "cors";
import RedisStore from "connect-redis";
import { createClient } from "redis";
import { Client } from "pg";
import bcrypt from "bcrypt";
import Mailjet from "node-mailjet";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

env.config();
const app = express();
const port = process.env.PORT || 3001;

const mailjet = new Mailjet({
  apiKey: process.env.MAIL,
  apiSecret: process.env.MAIL_PRIVATE,
});
// Redis client setup
const redisClient = createClient({
  url: process.env.REDIS,
});
redisClient.on("error", (err: any) => console.log("Redis Client Error", err));

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
          'SELECT * FROM "user" WHERE "email" = $1',
          [email]
        );
        const user = res.rows[0];
        if (!user) {
          console.log("No user found with email:", email);
          return done(null, false, { message: "Incorrect email." });
        }
        console.log("User found:", user);
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
          console.log("Incorrect password for user:", email);
          return done(null, false, { message: "Incorrect password." });
        }
        console.log("User authenticated successfully:", email);
        return done(null, user);
      } catch (err) {
        console.log("Error during authentication:", err);
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
    const res = await pgClient.query('SELECT * FROM "user" WHERE "id" = $1', [
      id,
    ]);
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

// Login route
app.post("/login", (req, res, next) => {
  console.log("Directed to POST Route -> /login");
  passport.authenticate("local", (err: any, user: any, info: any) => {
    if (err) return next(err);
    if (!user) return res.status(200).json({ code: 1, message: info.message });
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.status(200).json({ code: 0, message: "Login successful" });
    });
  })(req, res, next);
});

// Logout route
app.post("/logout", (req, res) => {
  console.log("Directed to POST Route -> /logout");
  req.logout((err) => {
    if (err) {
      return res.status(200).json({ code: 1, message: "Error logging out" });
    }
    req.session.destroy((err) => {
      if (err) {
        return res
          .status(200)
          .json({ code: 1, message: "Error destroying session" });
      }
      console.log("Signout successful");
      res.status(200).json({ code: 0, message: "Logout successful" });
    });
  });
});

// Validate email route
app.get("/validateEmail", async (req, res) => {
  console.log("Directed to GET Route -> /validateEmail");
  const email: string = req.query.email as string;
  try {
    const result = await pgClient.query(
      'SELECT * FROM "user" WHERE "email" = $1',
      [email]
    );
    if (result.rows.length > 0) {
      res.status(200).json({ code: 0, message: "Email exists" });
    } else {
      res.status(200).json({ code: 1, message: "Email does not exist" });
    }
  } catch (err) {
    console.log("Error validating email on /validateEmail route", err);
    res.status(500).json({ code: 1, message: "Error validating email" });
  }
});

// Register route
app.post("/register", async (req, res) => {
  console.log("Directed to POST Route -> /register");
  const { firstName, lastName, email, password } = req.body;
  try {
    const existingUser = await pgClient.query(
      'SELECT * FROM "user" WHERE "email" = $1',
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(200).send({ code: 1, message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await pgClient.query(
      'INSERT INTO "user" (first_name, last_name, email, password) VALUES ($1, $2, $3, $4)',
      [firstName, lastName, email, hashedPassword]
    );
    res.status(200).send({ code: 0, message: "User registered successfully" });
  } catch (err) {
    console.log("Error registering user on /register route", err);
    res.status(200).send({ code: 1, message: "Error registering user" });
  }
});

// Reset password route
app.post("/resetPassword", async (req, res) => {
  console.log("Directed to POST Route -> /resetPassword");
  const { email, newPassword } = req.body;
  try {
    const result = await pgClient.query(
      'SELECT * FROM "user" WHERE "email" = $1',
      [email]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(200).json({ code: 1, message: "User doesn't exist" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pgClient.query(
      'UPDATE "user" SET "password" = $1 WHERE "email" = $2',
      [hashedPassword, email]
    );

    res.status(200).json({ code: 0, message: "Password updated successfully" });
  } catch (err) {
    console.log("Error updating password on /resetPassword route", err);
    res.status(500).json({ code: 1, message: "Error updating password" });
  }
});

// Check session route
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

// POST Route for sending OTP
app.post("/sentOTP", async (req, res) => {
  console.log("Directed to POST Route -> /sentOTP");
  const email = req.body.email;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const request = mailjet.post("send").request({
    FromEmail: process.env.SEND_MAIL,
    FromName: process.env.SEND_NAME,
    Subject: "Your Signez OTP is here",
    "Text-part": `Your Signez OTP is ${otp}`,
    "Html-part": `<strong>Your Signez OTP is ${otp} </strong>`,
    Recipients: [{ Email: email }],
  });
  request
    .then((result: any) => {
      console.log("OTP successfully sent");
      res.status(200).send({ code: 0, otp: otp });
    })
    .catch((err: any) => {
      console.log("Error sending OTP email on /sentOTP route");
      res.status(200).send({ code: 1 });
    });
});

// Google OAuth strategy configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT!,
      clientSecret: process.env.SECRET!,
      callbackURL: `${process.env.SERVER}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0].value;
        if (!email) {
          return done(new Error("No email found"));
        }

        const res = await pgClient.query(
          'SELECT * FROM "user" WHERE "email" = $1',
          [email]
        );
        const user = res.rows[0];

        if (!user) {
          // If user does not exist, create a new user
          const firstName = profile.name?.givenName || "";
          const lastName = profile.name?.familyName || "";
          await pgClient.query(
            'INSERT INTO "user" (first_name, last_name, email) VALUES ($1, $2, $3)',
            [firstName, lastName, email]
          );
          const newUserRes = await pgClient.query(
            'SELECT * FROM "user" WHERE "email" = $1',
            [email]
          );
          return done(null, newUserRes.rows[0]);
        } else {
          // If user exists, return the user
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Google sign-up route
app.get(
  "/auth/google/signup",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google sign-in route
app.get(
  "/auth/google/signin",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth callback route
app.get("/auth/google/callback", (req, res, next) => {
  passport.authenticate("google", async (err: any, user: any, info: any) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(200).json({
        code: 1,
        message: info ? info.message : "Authentication failed",
      });
    }

    const email = user.email;
    const existingUserRes = await pgClient.query(
      'SELECT * FROM "user" WHERE "email" = $1',
      [user.email]
    );
    if (existingUserRes.rows.length > 0) {
      // User exists
      if (req.query.signup === "true") {
        return res.redirect(
          `${process.env.CLIENT_URL}/signup/?code=1&message=User%20already%20exists`
        );
      } else {
        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }
          return res.redirect(
            `${process.env.CLIENT_URL}/signin/?code=0&message=Login%20successful&emails=${email}`
          );
        });
      }
    } else {
      // User does not exist
      if (req.query.signup === "true") {
        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }
          return res.redirect(
            `${process.env.CLIENT_URL}/signup/?code=0&message=Sign%20up%20successful&email=${email}`
          );
        });
      } else {
        return res.redirect(
          `${process.env.CLIENT_URL}/signin/?code=1&message=User%20does%20not%20exist`
        );
      }
    }
  })(req, res, next);
});

// Redirect to Google for sign-up
app.get("/auth/google/signup", (req, res, next) => {
  req.query.signup = "true";
  passport.authenticate("google", { scope: ["profile", "email"] })(
    req,
    res,
    next
  );
});

// Redirect to Google for sign-in
app.get("/auth/google/signin", (req, res, next) => {
  console.log("Sign in google route hits");
  req.query.signup = "false";
  passport.authenticate("google", { scope: ["profile", "email"] })(
    req,
    res,
    next
  );
});

// Get alphabet array route
app.get("/getAlphabetArray", async (req, res) => {
  console.log("Directed to GET Route -> /getAlphabetArray");
  const email: string = req.query.email as string;
  try {
    const result = await pgClient.query(
      'SELECT alphabet_array FROM "user" WHERE "email" = $1',
      [email]
    );
    if (result.rows.length > 0) {
      res
        .status(200)
        .json({ code: 0, alphabetArray: result.rows[0].alphabet_array });
    } else {
      res.status(200).json({ code: 1, message: "User not found" });
    }
  } catch (err) {
    console.log(
      "Error retrieving alphabet array on /getAlphabetArray route",
      err
    );
    res
      .status(500)
      .json({ code: 1, message: "Error retrieving alphabet array" });
  }
});

// Update alphabet array route
app.post("/updateAlphabetArray", async (req, res) => {
  console.log("Directed to POST Route -> /updateAlphabetArray");
  const { email, alphabetArray } = req.body;
  try {
    const result = await pgClient.query(
      'UPDATE "user" SET alphabet_array = $1 WHERE "email" = $2',
      [alphabetArray, email]
    );
    if (result.rowCount !== null && result.rowCount > 0) {
      res
        .status(200)
        .json({ code: 0, message: "Alphabet array updated successfully" });
    } else {
      res.status(200).json({ code: 1, message: "User not found" });
    }
  } catch (err) {
    console.log(
      "Error updating alphabet array on /updateAlphabetArray route",
      err
    );
    res.status(500).json({ code: 1, message: "Error updating alphabet array" });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
