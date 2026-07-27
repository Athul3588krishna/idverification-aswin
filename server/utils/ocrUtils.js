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

module.exports = {
  performOCR
};
