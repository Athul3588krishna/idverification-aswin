/**
 * utils/systemConfig.js
 * ═══════════════════════════════════════════════════════════════
 * Manages system-wide settings like Auto-Approve for student registrations.
 * ═══════════════════════════════════════════════════════════════
 */

const fs = require("fs");
const path = require("path");

const CONFIG_FILE = path.join(__dirname, "../data/system_config.json");

let configCache = {
  autoApproveStudents: false
};

// Load saved config if exists
const loadConfig = () => {
  try {
    const dir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf-8");
      configCache = { ...configCache, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error("Error reading system config file:", err.message);
  }
};

loadConfig();

const saveConfig = () => {
  try {
    const dir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configCache, null, 2));
  } catch (err) {
    console.error("Error writing system config file:", err.message);
  }
};

module.exports = {
  getAutoApprove: () => configCache.autoApproveStudents,
  setAutoApprove: (val) => {
    configCache.autoApproveStudents = Boolean(val);
    saveConfig();
    return configCache.autoApproveStudents;
  },
  getSystemConfig: () => ({ ...configCache })
};
