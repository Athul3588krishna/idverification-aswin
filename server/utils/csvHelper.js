/**
 * utils/csvHelper.js
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   A pure JavaScript helper to read and parse the local CSV database
 *   of registered candidates (`server/data/students.csv`).
 *
 * FUNCTIONS EXPOSED:
 *   • getStudentsFromCSV()  → Returns an array of student objects from the CSV.
 *   • findStudentByRoll(roll) → Searches and returns a student by roll number.
 * ═══════════════════════════════════════════════════════════════
 */

const fs = require("fs");
const path = require("path");

const CSV_PATH = path.join(__dirname, "../data/students.csv");

/**
 * Parses the students.csv file into an array of JSON objects.
 * Handles line breaks and extracts headers.
 * @returns {Array<Object>} List of registered students
 */
const getStudentsFromCSV = () => {
  try {
    if (!fs.existsSync(CSV_PATH)) {
      console.warn(`[CSV Warning] CSV file not found at ${CSV_PATH}`);
      return [];
    }

    const data = fs.readFileSync(CSV_PATH, "utf-8");
    const lines = data.split(/\r?\n/).filter((line) => line.trim() !== "");

    if (lines.length === 0) return [];

    // Extract headers (RollNumber,Name,Course,Semester,ExamCenter,Status)
    const headers = lines[0].split(",").map((h) => h.trim());

    const students = [];

    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].split(",");
      if (currentLine.length < headers.length) continue;

      const student = {};
      headers.forEach((header, index) => {
        student[header] = currentLine[index] ? currentLine[index].trim() : "";
      });

      students.push(student);
    }

    return students;
  } catch (error) {
    console.error("Error reading/parsing students.csv:", error.message);
    return [];
  }
};

/**
 * Searches the CSV list for a specific roll number (case-insensitive).
 * @param {string} rollNumber - The roll number to look up
 * @returns {Object|null} The matched student object or null
 */
const findStudentByRoll = (rollNumber) => {
  if (!rollNumber) return null;
  const students = getStudentsFromCSV();
  const searchRoll = rollNumber.trim().toUpperCase();
  
  return students.find((s) => s.RollNumber.toUpperCase() === searchRoll) || null;
};

module.exports = {
  getStudentsFromCSV,
  findStudentByRoll
};
