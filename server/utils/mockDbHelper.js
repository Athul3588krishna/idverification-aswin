/**
 * utils/mockDbHelper.js
 * ═══════════════════════════════════════════════════════════════
 * Allows the ExamShield system to run in a fully functional offline
 * mode without MongoDB installed or running. Saves data to local
 * JSON files under `server/data/`.
 * ═══════════════════════════════════════════════════════════════
 */

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const USERS_FILE = path.join(__dirname, "../data/mock_users.json");
const LOGS_FILE = path.join(__dirname, "../data/mock_logs.json");

// Helper to ensure data directory exists
const ensureDir = () => {
  const dir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Seed default admin, security, and student if users file is empty/non-existent
const loadUsers = () => {
  ensureDir();
  if (!fs.existsSync(USERS_FILE)) {
    const salt = bcrypt.genSaltSync(12);
    
    const users = [
      {
        _id: "65b4c123456789abcdef0001",
        name: "ExamShield Admin",
        email: "admin@examshield.com",
        password: bcrypt.hashSync("Admin@123", salt),
        role: "admin",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: "65b4c123456789abcdef0002",
        name: "Security Staff Gate 1",
        email: "security@examshield.com",
        password: bcrypt.hashSync("Security@123", salt),
        role: "security_staff",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: "65b4c123456789abcdef0003",
        name: "ATHUL KRISHNA",
        email: "athul@examshield.com",
        password: bcrypt.hashSync("Student@123", salt),
        role: "student",
        isActive: true,
        studentProfile: {
          rollNumber: "MCA26002",
          course: "MCA",
          semester: 2,
          examCenter: "Hall A - Room 102",
          dob: "1999-10-20",
          idNumber: "987654321098",
          examSubject: "MCA Entrance Examination 2026",
          examDate: "2026-08-10",
          examTime: "10:00 AM - 1:00 PM"
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    return users;
  }
  try {
    const data = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading mock users file:", err.message);
    return [];
  }
};

const saveUsers = (users) => {
  ensureDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

const loadLogs = () => {
  ensureDir();
  if (!fs.existsSync(LOGS_FILE)) {
    fs.writeFileSync(LOGS_FILE, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const data = fs.readFileSync(LOGS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading mock logs file:", err.message);
    return [];
  }
};

const saveLogs = (logs) => {
  ensureDir();
  fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2));
};

// Helper to match mongo-like queries
const matchQuery = (item, query) => {
  if (!query) return true;
  for (const key in query) {
    if (key === "$or") {
      const conditions = query[key];
      const matchAny = conditions.some((cond) => matchQuery(item, cond));
      if (!matchAny) return false;
    } else {
      const val = query[key];
      let itemVal;

      if (key.includes(".")) {
        const parts = key.split(".");
        itemVal = item;
        for (const part of parts) {
          itemVal = itemVal ? itemVal[part] : undefined;
        }
      } else {
        itemVal = item[key];
      }

      if (val && typeof val === "object") {
        if (val.$regex !== undefined) {
          const regex = new RegExp(val.$regex, val.$options || "");
          if (!regex.test(itemVal || "")) return false;
        } else if (val.$gte !== undefined) {
          if (!(new Date(itemVal) >= new Date(val.$gte))) return false;
        }
      } else {
        if (itemVal !== val) return false;
      }
    }
  }
  return true;
};

// Simulated query class for chaining (.select, .populate, .sort, .skip, .limit)
class MockQuery {
  constructor(data, modelName) {
    this.data = data;
    this.modelName = modelName;
  }

  select() {
    return this;
  }

  populate(field, fieldsToSelect) {
    // Basic population simulation
    if (field === "verifiedBy" || field === "createdBy") {
      const users = loadUsers();
      this.data = this.data.map((item) => {
        const userId = item[field];
        if (userId) {
          const matchedUser = users.find((u) => u._id === userId.toString());
          if (matchedUser) {
            const userObj = { ...matchedUser };
            delete userObj.password;
            return { ...item, [field]: userObj };
          }
        }
        return item;
      });
    }
    return this;
  }

  sort(sortObj) {
    if (sortObj) {
      const keys = Object.keys(sortObj);
      if (keys.length > 0) {
        const key = keys[0];
        const dir = sortObj[key];
        this.data.sort((a, b) => {
          let valA = a[key];
          let valB = b[key];
          if (key === "createdAt") {
            valA = new Date(valA);
            valB = new Date(valB);
          }
          if (valA < valB) return dir === -1 ? 1 : -1;
          if (valA > valB) return dir === -1 ? -1 : 1;
          return 0;
        });
      }
    }
    return this;
  }

  skip(n) {
    this.data = this.data.slice(n);
    return this;
  }

  limit(n) {
    this.data = this.data.slice(0, n);
    return this;
  }

  // Make it thenable so we can await it
  then(onresolve, onreject) {
    // If it's a single document query helper (e.g. from findOne or findById)
    // we want to return hydrated documents (objects with methods)
    const hydrated = Array.isArray(this.data)
      ? this.data.map((item) => hydrateDocument(item, this.modelName))
      : this.data
      ? hydrateDocument(this.data, this.modelName)
      : null;

    return Promise.resolve(hydrated).then(onresolve, onreject);
  }
}

// Hydrate plain objects with model instance methods
const hydrateDocument = (obj, modelName) => {
  if (!obj) return null;
  const instance = { ...obj };

  instance.toObject = function () {
    return { ...obj };
  };

  instance.toPublicJSON = function () {
    const copy = { ...obj };
    delete copy.password;
    delete copy.passwordResetToken;
    delete copy.passwordResetExpires;
    return copy;
  };

  if (modelName === "User") {
    instance.matchPassword = async function (enteredPassword) {
      return await bcrypt.compare(enteredPassword, obj.password);
    };

    instance.save = async function () {
      const users = loadUsers();
      const index = users.findIndex((u) => u._id === obj._id);
      obj.updatedAt = new Date().toISOString();
      if (index !== -1) {
        users[index] = obj;
      } else {
        users.push(obj);
      }
      saveUsers(users);
      return hydrateDocument(obj, "User");
    };

    instance.deleteOne = async function () {
      const users = loadUsers();
      const filtered = users.filter((u) => u._id !== obj._id);
      saveUsers(filtered);
      return { deletedCount: 1 };
    };
  }

  return instance;
};

// ─────────────────────────────────────────────
// Mock User Model
// ─────────────────────────────────────────────
const MockUser = {
  findOne: (query) => {
    const users = loadUsers();
    // Special handle for email.toLowerCase or rollNumber
    const normalizedQuery = {};
    for (const key in query) {
      if (typeof query[key] === "string") {
        normalizedQuery[key] = query[key].toLowerCase();
      } else {
        normalizedQuery[key] = query[key];
      }
    }

    const matched = users.find((u) => {
      // Match query fields
      for (const k in query) {
        if (k === "email") {
          if (u.email.toLowerCase() !== query.email.toLowerCase()) return false;
        } else if (k === "studentProfile.rollNumber") {
          if (
            !u.studentProfile ||
            u.studentProfile.rollNumber.toUpperCase() !==
              query[k].toUpperCase()
          )
            return false;
        } else if (u[k] !== query[k]) {
          return false;
        }
      }
      return true;
    });

    return new MockQuery(matched || null, "User");
  },

  findById: (id) => {
    const users = loadUsers();
    const idStr = id ? id.toString() : "";
    const matched = users.find((u) => u._id === idStr);
    return new MockQuery(matched || null, "User");
  },

  create: async (data) => {
    const users = loadUsers();
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = data.password
      ? await bcrypt.hash(data.password, salt)
      : "";

    const newUser = {
      _id: "user_" + Math.random().toString(36).substr(2, 9),
      ...data,
      password: hashedPassword,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);
    return hydrateDocument(newUser, "User");
  },

  find: (query) => {
    const users = loadUsers();
    const matched = users.filter((u) => matchQuery(u, query));
    return new MockQuery(matched, "User");
  },

  countDocuments: async (query) => {
    const users = loadUsers();
    if (!query || Object.keys(query).length === 0) return users.length;
    const matched = users.filter((u) => matchQuery(u, query));
    return matched.length;
  },
};

// ─────────────────────────────────────────────
// Mock VerificationLog Model
// ─────────────────────────────────────────────
const MockVerificationLog = {
  create: async (data) => {
    const logs = loadLogs();
    const newLog = {
      _id: "log_" + Math.random().toString(36).substr(2, 9),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    logs.push(newLog);
    saveLogs(logs);
    return hydrateDocument(newLog, "VerificationLog");
  },

  find: (query) => {
    const logs = loadLogs();
    const matched = logs.filter((l) => matchQuery(l, query));
    return new MockQuery(matched, "VerificationLog");
  },

  countDocuments: async (query) => {
    const logs = loadLogs();
    if (!query || Object.keys(query).length === 0) return logs.length;
    const matched = logs.filter((l) => matchQuery(l, query));
    return matched.length;
  },
};

module.exports = {
  MockUser,
  MockVerificationLog,
};
