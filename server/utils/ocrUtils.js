/**
 * utils/ocrUtils.js
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   Wrapper utility that uses the Tesseract.js engine to extract raw
 *   text from an uploaded image file path.
 *
 * KEY FEATURES:
 *   • Initializes Tesseract OCR recognition.
 *   • Extracts alphanumeric character data.
 *   • Cleans extracted text by stripping extra whitespaces.
 * ═══════════════════════════════════════════════════════════════
 */

const { createWorker } = require("tesseract.js");

/**
 * Performs OCR scanning on an image file using Tesseract.js
 * @param {string} imagePath - Absolute or relative path to the image on disk
 * @returns {Promise<string>} The extracted text content
 */
const performOCR = async (imagePath) => {
  let worker = null;
  try {
    console.log(`[OCR Processing] Initiating scan for: ${imagePath}`);
    const startTime = Date.now();

    // Create a worker for English language
    worker = await createWorker("eng");
    
    // Perform recognition
    const { data: { text } } = await worker.recognize(imagePath);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[OCR Success] Scan completed in ${duration}s`);
    
    return text || "";
  } catch (error) {
    console.error("[OCR Failure] Error during text extraction:", error.message);
    throw new Error(`OCR processing failed: ${error.message}`);
  } finally {
    // Terminate worker resources properly
    if (worker) {
      await worker.terminate();
    }
  }
};

/**
 * Parses raw OCR text from a student ID card and extracts structured candidate fields.
 * @param {string} rawText - Unstructured text from Tesseract OCR
 * @returns {Object} Extracted fields: rollNumber, name, dob, idNumber, course, semester
 */
const parseIdCardText = (rawText) => {
  if (!rawText || typeof rawText !== "string") return {};

  const result = {};

  // Normalize common OCR artifacts
  const normalizedText = rawText
    .replace(/€/g, "C")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"');

  // 1. Roll Number extraction
  const rollMatch =
    normalizedText.match(/CARD\s*ID\s*:\s*ID-\d{4}-([A-Z0-9]+)/i) ||
    normalizedText.match(/EXAM[-.\s]+([A-Z0-9]{6,10})/i) ||
    normalizedText.match(/(?:ROLL\s*(?:NO|NUMBER)?|REG\s*(?:NO|NUMBER)?)[:\s\~\-\]]*([A-Z0-9]{6,10})/i);

  if (rollMatch) {
    let cleanRoll = rollMatch[1].toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (cleanRoll.startsWith("C5") && !cleanRoll.startsWith("CS")) {
      cleanRoll = "CS" + cleanRoll.slice(2);
    }
    result.rollNumber = cleanRoll;
  }

  // 2. Candidate Full Name
  const nameMatch = normalizedText.match(
    /(?:STUDENT\s*NAME|CANDIDATE\s*NAME|NAME)[:\s\~\-\]]*([A-Za-z\s\(\)]{3,40})/i
  );
  if (nameMatch) {
    let cleaned = nameMatch[1]
      .split(/[\r\n|]/)[0]
      .trim()
      .toUpperCase();
    cleaned = cleaned
      .replace(/\s+/g, " ")
      .replace(/\(FAKE\)/i, "")
      .replace(/[^A-Z\s]/g, "")
      .trim();
    if (cleaned.length > 2) {
      result.name = cleaned;
    }
  }

  // 3. Date of Birth (normalized to YYYY-MM-DD)
  const dobMatch = normalizedText.match(
    /(?:DOB|DATE\s*OF\s*BIRTH|D\.O\.B)[:\s\~\-\]]*(\d{4}[-\/]\d{2}[-\/]\d{2}|\d{2}[-\/]\d{2}[-\/]\d{4})/i
  );
  if (dobMatch) {
    let d = dobMatch[1].replace(/\//g, "-");
    if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
      const parts = d.split("-");
      d = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    result.dob = d;
  }

  // 4. Aadhaar / Govt ID (12 digits)
  const idMatch = normalizedText.match(
    /(?:AADHAAR|AADHAR|ID\s*NO|GOVT\s*ID|UID)[:\s\~\-\]]*(\d{4}\s*\d{4}\s*\d{4}|\d{12})/i
  );
  if (idMatch) {
    result.idNumber = idMatch[1].replace(/\s/g, "");
  } else {
    const rawDigits = normalizedText.match(/\b\d{4}\s\d{4}\s\d{4}\b|\b\d{12}\b/);
    if (rawDigits) result.idNumber = rawDigits[0].replace(/\s/g, "");
  }

  // 5. Course Identification
  if (/B\.?TECH\s*CSE|COMPUTER\s*SCIENCE/i.test(normalizedText)) {
    result.course = "B.Tech CSE";
  } else if (/B\.?TECH/i.test(normalizedText)) {
    result.course = "B.Tech CSE";
  } else if (/MCA/i.test(normalizedText)) {
    result.course = "MCA";
  } else if (/BCA/i.test(normalizedText)) {
    result.course = "BCA";
  } else if (/B\.?SC/i.test(normalizedText)) {
    result.course = "B.Sc CS";
  }

  // 6. Semester Number
  const semMatch = normalizedText.match(/(?:SEMESTER|SEM)\s*[:\-\~\]\s]*(\d+)/i);
  if (semMatch) {
    result.semester = parseInt(semMatch[1], 10);
  }

  return result;
};

module.exports = {
  performOCR,
  parseIdCardText,
};

