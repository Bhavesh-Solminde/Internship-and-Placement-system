make md make this 12000 char only  (eg. "abc"=> 3 char)"# 🤖 Project Instructions: [PROJECT NAME]
> General-purpose MERN Stack Boilerplate — npm + JavaScript + Feature-Module Architecture

You are an expert full-stack developer working on **[PROJECT NAME]**.
You are powered by a High-Reasoning Model. Do not be lazy. Be architectural.

---

## 0. 🧠 Reasoning & Planning (MANDATORY)

1. **Chain of Thought:**
   - **STOP & THINK:** Before writing a single line of code, analyze the dependency tree.
   - **Plan First:** If a task touches more than 1 file, outline your plan in 3 bullet points before executing.
   - **No "Lazy" Fixes:** Do not just patch the symptom. Fix the root cause.

2. **Context Strategy:**
   - **READ FULL FILES:** Always read the entire file before editing to ensure you see all imports, middleware, and exported functions.
   - **Cross-Reference:** Before modifying any function or component, search the entire project to find every place it is used in `client/` or `server/`.
   - **No Assumptions:** If a variable, function, or route is unclear, read the source file — never guess.

3. **Strict File Editing:**
   - **Precision:** Provide 10–15 lines of surrounding context around every change so the insertion point is unambiguous.
   - **No Placeholders:** Do not write `// ...existing code...` and skip the body. Write the complete, working implementation.
   - **Verification:** After every edit, mentally verify that all imports resolve, all routes are registered in `server.js`, and no existing functionality is broken.

---

## 1. 📂 Project Architecture

### Full Folder Tree

```
[project-root]/
│
├── client/                          # React 18 frontend (Vite)
│   ├── public/
│   └── src/
│       ├── components/
│       │   └── ui/                  # Atoms: Button, Input, Card, Badge, Modal
│       ├── pages/                   # Route-level page components
│       ├── context/                 # AuthContext, etc.
│       ├── hooks/                   # useAuth, useFetch, useDebounce
│       ├── utils/                   # cn(), formatDate(), scoreInterpreter()
│       ├── lib/                     # axiosInstance.js, constants.js
│       ├── data/                    # Static / hardcoded datasets
│       ├── assets/
│       ├── App.jsx
│       └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                          # Express backend
│   ├── src/
│   │   ├── config/                  # db.js, env.js, cors.js
│   │   ├── middleware/              # Shared middleware (NOT feature-specific)
│   │   │   ├── authMiddleware.js    # JWT verification → req.user
│   │   │   ├── errorHandler.js      # Global error handler (registered last)
│   │   │   └── notFound.js          # 404 handler
│   │   ├── utils/                   # Shared utilities
│   │   │   ├── asyncHandler.js
│   │   │   ├── ApiError.js
│   │   │   └── ApiResponse.js
│   │   │
│   │   └── modules/                 # ← FEATURE-WISE MODULES (core of backend)
│   │       ├── auth/
│   │       │   ├── auth.model.js
│   │       │   ├── auth.controller.js
│   │       │   ├── auth.routes.js
│   │       │   └── auth.validation.js
│   │       │
│   │       ├── user/
│   │       │   ├── user.model.js
│   │       │   ├── user.controller.js
│   │       │   └── user.routes.js
│   │       │
│   │       ├── [feature-A]/         # e.g. assessment/, product/, post/
│   │       │   ├── featureA.model.js
│   │       │   ├── featureA.controller.js
│   │       │   └── featureA.routes.js
│   │       │
│   │       └── [feature-B]/
│   │           ├── featureB.model.js
│   │           ├── featureB.controller.js
│   │           └── featureB.routes.js
│   │
│   ├── seed/
│   │   └── seed.js                  # Seed initial data for all modules
│   ├── server.js                    # Entry point — registers all module routes
│   └── package.json
│
├── .gitignore
├── .env.example
├── package.json                     # Root — concurrently dev script
└── README.md
```

---

## 2. 🏗️ Module Structure Rules (CRITICAL)

> **The Golden Rule:** Every feature owns its own model, controller, and routes. Nothing from one module reaches into another module's internals — only import from `utils/`, `middleware/`, or `config/`.

### What lives inside a module folder

```
server/src/modules/[feature]/
├── [feature].model.js        # Mongoose schema + model
├── [feature].controller.js   # All route handlers for this feature
├── [feature].routes.js       # Express router — maps HTTP verbs to controllers
└── [feature].validation.js   # (optional) Input validation helpers
```

### What does NOT live inside a module folder
- Global middleware (auth, errorHandler) → `src/middleware/`
- Shared helpers (asyncHandler, ApiError) → `src/utils/`
- DB connection, env config → `src/config/`

### How modules connect to `server.js`
Every module exports its router from `[feature].routes.js`.
`server.js` imports and mounts each one:

```js
// server/server.js
const authRoutes      = require("./src/modules/auth/auth.routes.js");
const userRoutes      = require("./src/modules/user/user.routes.js");
const featureARoutes  = require("./src/modules/featureA/featureA.routes.js");

app.use("/api/auth",      authRoutes);
app.use("/api/users",     userRoutes);
app.use("/api/featureA",  featureARoutes);
```

> **Rule:** `server.js` only does 4 things — configure Express, connect DB, mount module routes, register global middleware. No business logic ever lives in `server.js`.

---

## 3. 🔩 Module File Templates

### 3.1 — `[feature].model.js`

```js
// server/src/modules/[feature]/[feature].model.js
const mongoose = require("mongoose");

const featureSchema = new mongoose.Schema(
  {
    title:  { type: String, required: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    // ... add fields specific to this feature
  },
  { timestamps: true }  // always include — gives createdAt + updatedAt for free
);

module.exports = mongoose.model("Feature", featureSchema);
```

---

### 3.2 — `[feature].controller.js`

```js
// server/src/modules/[feature]/[feature].controller.js
const asyncHandler = require("../../utils/asyncHandler.js");
const ApiError     = require("../../utils/ApiError.js");
const ApiResponse  = require("../../utils/ApiResponse.js");
const Feature      = require("./feature.model.js");

// GET all items for the logged-in user
const getAllFeatures = asyncHandler(async (req, res) => {
  const items = await Feature.find({ userId: req.user.id });
  res.status(200).json(new ApiResponse(200, items, "Fetched successfully"));
});

// GET single item by ID
const getFeatureById = asyncHandler(async (req, res) => {
  const item = await Feature.findById(req.params.id);
  if (!item) throw new ApiError(404, "Not found");
  res.status(200).json(new ApiResponse(200, item));
});

// POST create new item
const createFeature = asyncHandler(async (req, res) => {
  const { title } = req.body;
  if (!title) throw new ApiError(400, "Title is required");

  const item = await Feature.create({ title, userId: req.user.id });
  res.status(201).json(new ApiResponse(201, item, "Created successfully"));
});

// PUT update item
const updateFeature = asyncHandler(async (req, res) => {
  const item = await Feature.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) throw new ApiError(404, "Not found");
  res.status(200).json(new ApiResponse(200, item, "Updated successfully"));
});

// DELETE item
const deleteFeature = asyncHandler(async (req, res) => {
  const item = await Feature.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, "Not found");
  res.status(200).json(new ApiResponse(200, null, "Deleted successfully"));
});

module.exports = {
  getAllFeatures,
  getFeatureById,
  createFeature,
  updateFeature,
  deleteFeature,
};
```

---

### 3.3 — `[feature].routes.js`

```js
// server/src/modules/[feature]/[feature].routes.js
const express  = require("express");
const { protect } = require("../../middleware/authMiddleware.js");
const {
  getAllFeatures,
  getFeatureById,
  createFeature,
  updateFeature,
  deleteFeature,
} = require("./feature.controller.js");

const router = express.Router();

// Apply auth protection to all routes in this module
router.use(protect);

router.route("/")
  .get(getAllFeatures)
  .post(createFeature);

router.route("/:id")
  .get(getFeatureById)
  .put(updateFeature)
  .delete(deleteFeature);

module.exports = router;
```

---

### 3.4 — `auth` module (complete working example)

```js
// server/src/modules/auth/auth.model.js
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true, minlength: 6 },
    role:     { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
```

```js
// server/src/modules/auth/auth.controller.js
const jwt          = require("jsonwebtoken");
const asyncHandler = require("../../utils/asyncHandler.js");
const ApiError     = require("../../utils/ApiError.js");
const ApiResponse  = require("../../utils/ApiResponse.js");
const User         = require("./auth.model.js");
const ENV          = require("../../config/env.js");

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_EXPIRES_IN }
  );

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) throw new ApiError(400, "All fields required");

  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, "Email already registered");

  const user  = await User.create({ name, email, password });
  const token = generateToken(user);

  res.status(201).json(
    new ApiResponse(201, {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    }, "Registered successfully")
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, "Email and password required");

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password)))
    throw new ApiError(401, "Invalid credentials");

  const token = generateToken(user);
  res.status(200).json(
    new ApiResponse(200, {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    }, "Login successful")
  );
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) throw new ApiError(404, "User not found");
  res.status(200).json(new ApiResponse(200, user));
});

module.exports = { register, login, getMe };
```

```js
// server/src/modules/auth/auth.routes.js
const express     = require("express");
const { protect } = require("../../middleware/authMiddleware.js");
const { register, login, getMe } = require("./auth.controller.js");

const router = express.Router();

router.post("/register", register);
router.post("/login",    login);
router.get("/me",        protect, getMe);  // protect only this specific route

module.exports = router;
```

---

## 4. 🔧 Shared Utilities (used across ALL modules)

### `asyncHandler.js`
```js
// server/src/utils/asyncHandler.js
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
```

### `ApiError.js`
```js
// server/src/utils/ApiError.js
class ApiError extends Error {
  constructor(statusCode, message = "Something went wrong", errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors     = errors;
    this.success    = false;
  }
}
module.exports = ApiError;
```

### `ApiResponse.js`
```js
// server/src/utils/ApiResponse.js
class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data       = data;
    this.message    = message;
    this.success    = statusCode < 400;
  }
}
module.exports = ApiResponse;
```

---

## 5. 🛡️ Shared Middleware (used across ALL modules)

### `authMiddleware.js`
```js
// server/src/middleware/authMiddleware.js
const jwt          = require("jsonwebtoken");
const ApiError     = require("../utils/ApiError.js");
const asyncHandler = require("../utils/asyncHandler.js");
const ENV          = require("../config/env.js");

const protect = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw new ApiError(401, "Not authorized, no token");
  const decoded = jwt.verify(token, ENV.JWT_SECRET);
  req.user = decoded;
  next();
});

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin")
    throw new ApiError(403, "Admin access required");
  next();
};

module.exports = { protect, adminOnly };
```

### `errorHandler.js`
```js
// server/src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors:  err.errors  || [],
    stack:   process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
module.exports = errorHandler;
```

### `notFound.js`
```js
// server/src/middleware/notFound.js
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};
module.exports = notFound;
```

---

## 6. ⚙️ Config Files

### `config/db.js`
```js
// server/src/config/db.js
const mongoose = require("mongoose");
const ENV      = require("./env.js");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(ENV.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB error: ${err.message}`);
    process.exit(1);
  }
};
module.exports = connectDB;
```

### `config/env.js`
```js
// server/src/config/env.js
require("dotenv").config();

const ENV = {
  PORT:           process.env.PORT           || 5000,
  MONGO_URI:      process.env.MONGO_URI,
  JWT_SECRET:     process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  CLIENT_URL:     process.env.CLIENT_URL     || "http://localhost:5173",
  NODE_ENV:       process.env.NODE_ENV       || "development",
};

// Fail fast on missing critical vars
["MONGO_URI", "JWT_SECRET"].forEach((key) => {
  if (!ENV[key]) {
    console.error(`❌ Missing required env var: ${key}`);
    process.exit(1);
  }
});

module.exports = ENV;
```

---

## 7. 🚀 `server.js` — Entry Point (complete template)

```js
// server/server.js
const express      = require("express");
const cors         = require("cors");
const morgan       = require("morgan");
const connectDB    = require("./src/config/db.js");
const ENV          = require("./src/config/env.js");
const errorHandler = require("./src/middleware/errorHandler.js");
const notFound     = require("./src/middleware/notFound.js");

// ── Import module routers ───────────────────────────────────────
const authRoutes    = require("./src/modules/auth/auth.routes.js");
const userRoutes    = require("./src/modules/user/user.routes.js");
// const featureARoutes = require("./src/modules/featureA/featureA.routes.js");
// Add new module routers here as the project grows ↑

const app = express();

// ── Connect Database ────────────────────────────────────────────
connectDB();

// ── Global Middleware ───────────────────────────────────────────
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (ENV.NODE_ENV === "development") app.use(morgan("dev"));

// ── Health Check ────────────────────────────────────────────────
app.get("/api/health", (req, res) =>
  res.json({ success: true, message: "Server is running" })
);

// ── Mount Module Routes ─────────────────────────────────────────
app.use("/api/auth",    authRoutes);
app.use("/api/users",   userRoutes);
// app.use("/api/featureA", featureARoutes);

// ── 404 + Error Handler (ALWAYS LAST) ──────────────────────────
app.use(notFound);
app.use(errorHandler);

app.listen(ENV.PORT, () =>
  console.log(`🚀 Server running → http://localhost:${ENV.PORT}`)
);
```

---

## 8. 🌱 Seed File

```js
// server/seed/seed.js
require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const ENV      = require("../src/config/env.js");
const User     = require("../src/modules/auth/auth.model.js");
// Import other module models here as needed:
// const Feature = require("../src/modules/featureA/featureA.model.js");

const seed = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log("🌱 Connected — seeding...");

    // Clear existing data
    await User.deleteMany();
    // await Feature.deleteMany();

    // Create demo user
    const demoUser = await User.create({
      name:     "Demo User",
      email:    "demo@example.com",
      password: "Demo@1234",
      role:     "user",
    });

    // Seed feature data tied to demo user
    // await Feature.insertMany([
    //   { title: "Sample Item 1", userId: demoUser._id },
    //   { title: "Sample Item 2", userId: demoUser._id },
    // ]);

    console.log("✅ Seed complete");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
};

seed();
```

---

## 9. 🎨 Frontend Rules (Vite + React 18)

### Axios Instance — `client/src/lib/axiosInstance.js`
```js
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

// Attach JWT to every request automatically
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
```

### Auth Context — `client/src/context/AuthContext.jsx`
```js
import { createContext, useContext, useReducer, useEffect } from "react";
import axiosInstance from "../lib/axiosInstance";

const AuthContext = createContext(null);

const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN":
      return { user: action.payload.user, token: action.payload.token, isAuthenticated: true };
    case "LOGOUT":
      return { user: null, token: null, isAuthenticated: false };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user:            null,
    token:           localStorage.getItem("token"),
    isAuthenticated: false,
  });

  // Validate stored token on app load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axiosInstance.get("/api/auth/me")
        .then(({ data }) =>
          dispatch({ type: "LOGIN", payload: { user: data.data, token } })
        )
        .catch(() => dispatch({ type: "LOGOUT" }));
    }
  }, []);

  const login = (user, token) => {
    localStorage.setItem("token", token);
    dispatch({ type: "LOGIN", payload: { user, token } });
  };

  const logout = () => {
    localStorage.removeItem("token");
    dispatch({ type: "LOGOUT" });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### Protected Route — `client/src/components/ProtectedRoute.jsx`
```js
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated)
    return <Navigate to="/login" state={{ from: location }} replace />;

  return children;
};

export default ProtectedRoute;
```

### `cn()` Utility — `client/src/utils/cn.js`
```js
import { clsx }    from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

---

## 10. 📋 Environment Variables

### `server/.env`
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/your_db_name
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### `client/.env`
```env
VITE_API_BASE_URL=http://localhost:5000
```

> **Rule:** Never commit `.env`. Always commit `.env.example` with placeholder values and no real secrets.

---

## 11. 📦 Package Dependencies

### `server/package.json`
```json
{
  "scripts": {
    "dev":   "nodemon server.js",
    "start": "node server.js",
    "seed":  "node seed/seed.js"
  },
  "dependencies": {
    "express":      "^4.19.0",
    "mongoose":     "^8.5.0",
    "bcryptjs":     "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors":         "^2.8.5",
    "dotenv":       "^16.4.0",
    "morgan":       "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

### `client/package.json`
```json
{
  "scripts": {
    "dev":     "vite",
    "build":   "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react":            "^18.3.1",
    "react-dom":        "^18.3.1",
    "react-router-dom": "^6.26.0",
    "axios":            "^1.7.0",
    "clsx":             "^2.1.1",
    "tailwind-merge":   "^2.5.0",
    "framer-motion":    "^11.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite":                 "^5.4.0",
    "tailwindcss":          "^3.4.0",
    "autoprefixer":         "^10.4.0",
    "postcss":              "^8.4.0"
  }
}
```

### Root `package.json`
```json
{
  "scripts": {
    "dev":         "concurrently \"npm run dev --prefix server\" \"npm run dev --prefix client\"",
    "install:all": "npm i && npm i --prefix client && npm i --prefix server",
    "seed":        "npm run seed --prefix server",
    "build":       "npm run build --prefix client"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

---

## 12. ✅ Implementation Order (always follow this sequence)

```
BACKEND FIRST
──────────────────────────────────────────────────────────────────
1.  Root package.json with concurrently
2.  server/server.js skeleton (no routes yet) + connectDB working
3.  src/config/env.js  — validate required vars on startup (fail fast)
4.  src/utils/         — asyncHandler, ApiError, ApiResponse
5.  src/middleware/    — errorHandler, notFound, authMiddleware
6.  src/modules/auth/  — model → controller → routes (register + login + me)
7.  Mount /api/auth in server.js — smoke test with Thunder Client / Postman
8.  src/modules/user/  — model, controller, routes (if user profile is separate)
9.  src/modules/[featureA]/ — model → controller → routes
10. Repeat step 9 for every additional feature module
11. seed/seed.js — seed demo data for all modules, run once to verify

FRONTEND SECOND
──────────────────────────────────────────────────────────────────
12. Vite + React 18 + TailwindCSS + React Router v6 scaffold
13. client/src/lib/axiosInstance.js  (request + response interceptors)
14. client/src/context/AuthContext.jsx + useAuth hook
15. client/src/components/ProtectedRoute.jsx
16. Public pages: Home, Login, Register
17. Protected pages: Dashboard + all feature pages
18. Reusable UI atoms: Button, Card, Input, Modal, Badge in components/ui/
19. Framer-motion page transitions (do this last — do not block features)
20. Mobile responsive pass (sm: breakpoints on all layouts)

FINAL CHECKS
──────────────────────────────────────────────────────────────────
21. End-to-end test: Register → Login → Protected route → CRUD → Seed data visible
22. README.md with: setup instructions, env variable list, seed command, API table
```

---

## 13. 🗺️ How to Add a New Feature Module (checklist)

When the project needs a new feature (e.g., `order`, `review`, `notification`):

```
[ ] 1. Create folder:  server/src/modules/[feature]/
[ ] 2. Create [feature].model.js       — Mongoose schema, timestamps: true
[ ] 3. Create [feature].controller.js  — import asyncHandler, ApiError, ApiResponse
[ ] 4. Create [feature].routes.js      — import protect from middleware if auth needed
[ ] 5. In server.js:   require router → app.use("/api/[feature]", featureRoutes)
[ ] 6. In seed/seed.js: add seed data for the new model
[ ] 7. Create client/src/pages/[Feature]Page.jsx
[ ] 8. Add route to client/src/App.jsx  (wrap in <ProtectedRoute> if needed)
[ ] 9. Create client/src/hooks/use[Feature].js for API calls
```

---

## 14. ⚠️ Common Mistakes to Avoid

| Mistake | Correct Approach |
|---|---|
| Putting route logic in `server.js` | All route logic belongs in `modules/[feature]/[feature].routes.js` |
| Importing one module's model into another module's controller | OK for relationships — use relative path, never copy the model |
| Using `process.env.X` directly in a controller | Always import from `src/config/env.js` |
| Forgetting `asyncHandler` on a controller function | Every single controller must be wrapped — no exceptions |
| Registering `errorHandler` before routes | `notFound` + `errorHandler` are always the **last two** lines in `server.js` |
| Forgetting `{ timestamps: true }` on a schema | Add it to every Mongoose schema — no exceptions |
| Using array index as React `key` | Use `item._id` or another unique stable field |
| Calling `fetch()` directly in a React component | Always use `axiosInstance` from `src/lib/` |
| Committing `.env` files to git | Add `.env` to `.gitignore` before the very first commit |
| Writing business logic in `server.js` | `server.js` only: configure, connect DB, mount routes, handle errors |
| Creating a new feature without registering its router | Always add `app.use(...)` in `server.js` after creating a new module |
" no content should be lost and all points mention in above md should be included.