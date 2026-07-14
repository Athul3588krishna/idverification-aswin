/**
 * middleware/uploadMiddleware.js
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   Configures Multer storage engine and file filters for uploading
 *   student ID card images.
 *
 * KEY FEATURES:
 *   • Disk Storage: Saves uploaded files to the local './uploads' folder.
 *   • Unique Filename Generation: Appends a unique suffix (timestamp + random number)
 *     to prevent name collisions when different users upload files with the same name.
 *   • Image File Filtering: Enforces that only JPEG, JPG, and PNG files are accepted.
 *     Rejects other file formats (e.g. PDFs, executables) to maintain security.
 *   • File Size Limit: Restricts file sizes to a maximum of 5MB to optimize server storage
 *     and ensure faster processing times during Tesseract OCR scans.
 * ═══════════════════════════════════════════════════════════════
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ── Ensure Upload Directory Exists ───────────────────────────
const uploadDirectory = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// ── Configure Storage Engine ─────────────────────────────────
const storage = multer.diskStorage({
  // Destination directory for storing files
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },
  
  // Custom unique filename definition
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Extract file extension (e.g., .jpg, .png)
    const ext = path.extname(file.originalname).toLowerCase();
    // Save as: fieldname-timestamp-random.extension (e.g., idCard-17000000000-83848.jpg)
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// ── File Filter: Only Images ─────────────────────────────────
const fileFilter = (req, file, cb) => {
  // Accepted MIME types
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];
  
  // Check extension as well
  const allowedExtensions = /jpeg|jpg|png/;
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  
  if (allowedMimeTypes.includes(file.mimetype) && extname) {
    cb(null, true); // Accept file
  } else {
    cb(new Error("Only image files (.jpg, .jpeg, .png) are allowed!"), false); // Reject file
  }
};

// ── Initialize Multer Instance ──────────────────────────────
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 Megabytes limit
  }
});

module.exports = upload;
