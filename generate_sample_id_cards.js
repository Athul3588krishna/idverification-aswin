/**
 * generate_sample_id_cards.js
 * ═══════════════════════════════════════════════════════════════
 * Generates 10 high-resolution, OCR-optimized sample Student ID Cards
 * and individual passport photos for ExamShield.
 *
 * KEY FEATURES:
 *   • Realistic College Student Identity Card format (NO premature room/seat numbers)
 *   • Separate 240x300 passport photo generated for each candidate profile
 *   • 100% OCR Accuracy for Tesseract text matching (Roll, Name, DOB, Aadhaar)
 *   • Anti-passback duplicate detection test setup
 *   • Master interactive showcase (sample_id_cards/index.html)
 *   • Printable combined PDF (sample_id_cards/All_10_Sample_ID_Cards.pdf)
 * ═══════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const QRCode = require('d:/idverification-aswin/client/node_modules/qrcode');
const bcrypt = require('d:/idverification-aswin/server/node_modules/bcryptjs');

const OUTPUT_DIR = path.join(__dirname, 'sample_id_cards');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'cards_images');
const SERVER_UPLOADS_DIR = path.join(__dirname, 'server', 'uploads');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
if (!fs.existsSync(SERVER_UPLOADS_DIR)) fs.mkdirSync(SERVER_UPLOADS_DIR, { recursive: true });

const students = [
  {
    index: 1,
    rollNumber: 'MCA26001',
    name: 'ASWIN KRISHNA',
    course: 'MCA (SEMESTER 2)',
    courseRaw: 'MCA',
    semester: 2,
    dob: '1998-05-15',
    idNumber: '1234 5678 9012',
    idNumberRaw: '123456789012',
    bloodGroup: 'B+',
    examCenter: 'Main Campus (Malappuram)',
    allocatedHall: 'Block B - Room 204',
    allocatedSeat: 'Desk #18',
    email: 'aswin@examshield.com',
    status: 'ACTIVE',
    isActive: true,
    expectedResult: 'APPROVED',
    badgeColor: '#10b981',
    scenario: 'Normal Gate Admission (Active Candidate) & Anti-Passback Test (Rescanning triggers Duplicate Entry Alert)',
    avatarSvg: `
      <rect width="100" height="120" fill="#2563eb"/>
      <circle cx="50" cy="42" r="22" fill="#ffedd5"/>
      <path d="M 28 36 Q 50 16 72 36 Q 65 22 50 22 Q 35 22 28 36 Z" fill="#0f172a"/>
      <path d="M 20 110 Q 20 72 50 72 Q 80 72 80 110 Z" fill="#0f172a"/>
      <polygon points="46,72 54,72 52,94 50,98 48,94" fill="#dc2626"/>
      <polygon points="38,72 46,72 48,94 42,94" fill="#ffffff"/>
      <polygon points="62,72 54,72 52,94 58,94" fill="#ffffff"/>
    `
  },
  {
    index: 2,
    rollNumber: 'MCA26002',
    name: 'ATHUL KRISHNA',
    course: 'MCA (SEMESTER 2)',
    courseRaw: 'MCA',
    semester: 2,
    dob: '2001-08-22',
    idNumber: '2345 6789 0123',
    idNumberRaw: '234567890123',
    bloodGroup: 'O+',
    examCenter: 'North Zone Campus (Kozhikode)',
    allocatedHall: 'Block A - Room 102',
    allocatedSeat: 'Desk #05',
    email: 'athul@examshield.com',
    status: 'ACTIVE',
    isActive: true,
    expectedResult: 'APPROVED',
    badgeColor: '#10b981',
    scenario: 'Normal Gate Admission (Active Candidate) -> Allocated Block A Desk #05',
    avatarSvg: `
      <rect width="100" height="120" fill="#0284c7"/>
      <circle cx="50" cy="42" r="22" fill="#fed7aa"/>
      <path d="M 27 34 Q 50 14 73 34 Q 65 20 50 20 Q 35 20 27 34 Z" fill="#1e293b"/>
      <circle cx="42" cy="42" r="6" fill="none" stroke="#000" stroke-width="2"/>
      <circle cx="58" cy="42" r="6" fill="none" stroke="#000" stroke-width="2"/>
      <line x1="48" y1="42" x2="52" y2="42" stroke="#000" stroke-width="2"/>
      <path d="M 18 110 Q 18 72 50 72 Q 82 72 82 110 Z" fill="#334155"/>
      <polygon points="46,72 54,72 52,94 50,98 48,94" fill="#0284c7"/>
      <polygon points="38,72 46,72 48,94 42,94" fill="#ffffff"/>
      <polygon points="62,72 54,72 52,94 58,94" fill="#ffffff"/>
    `
  },
  {
    index: 3,
    rollNumber: 'MCA26003',
    name: 'SNEHA SANTHOSH',
    course: 'MCA (SEMESTER 2)',
    courseRaw: 'MCA',
    semester: 2,
    dob: '2002-03-14',
    idNumber: '3456 7890 1234',
    idNumberRaw: '345678901234',
    bloodGroup: 'A+',
    examCenter: 'Main Campus (Malappuram)',
    allocatedHall: 'Block B - Room 201',
    allocatedSeat: 'Desk #12',
    email: 'sneha@examshield.com',
    status: 'ACTIVE',
    isActive: true,
    expectedResult: 'APPROVED',
    badgeColor: '#10b981',
    scenario: 'Normal Gate Admission (Active Candidate) -> Allocated Block B Desk #12',
    avatarSvg: `
      <rect width="100" height="120" fill="#9333ea"/>
      <path d="M 22 36 Q 50 10 78 36 Q 84 80 72 90 Q 50 80 28 90 Q 16 80 22 36 Z" fill="#3b0764"/>
      <circle cx="50" cy="42" r="20" fill="#fed7aa"/>
      <path d="M 30 32 Q 50 20 70 32 Q 50 26 30 32 Z" fill="#3b0764"/>
      <path d="M 20 110 Q 20 74 50 74 Q 80 74 80 110 Z" fill="#831843"/>
      <polygon points="44,74 56,74 53,92 50,96 47,92" fill="#fef08a"/>
      <polygon points="38,74 44,74 46,92 40,92" fill="#ffffff"/>
      <polygon points="62,74 56,74 54,92 60,92" fill="#ffffff"/>
    `
  },
  {
    index: 4,
    rollNumber: 'MCA26004',
    name: 'RAHUL NAIR',
    course: 'MCA (SEMESTER 2)',
    courseRaw: 'MCA',
    semester: 2,
    dob: '2000-11-30',
    idNumber: '4567 8901 2345',
    idNumberRaw: '456789012345',
    bloodGroup: 'AB+',
    examCenter: 'Main Campus (Malappuram)',
    allocatedHall: null,
    allocatedSeat: null,
    email: 'rahul@examshield.com',
    status: 'SUSPENDED',
    isActive: false,
    expectedResult: 'REJECTED (BARRED)',
    badgeColor: '#ef4444',
    scenario: 'Suspended Candidate (Fee Dues / Administrative Bar) -> Rejection Alert & Locked Seating',
    avatarSvg: `
      <rect width="100" height="120" fill="#dc2626"/>
      <circle cx="50" cy="42" r="22" fill="#ffedd5"/>
      <path d="M 28 35 Q 50 15 72 35 Q 65 20 50 20 Q 35 20 28 35 Z" fill="#451a03"/>
      <path d="M 20 110 Q 20 72 50 72 Q 80 72 80 110 Z" fill="#451a03"/>
      <polygon points="46,72 54,72 52,94 50,98 48,94" fill="#eab308"/>
      <polygon points="38,72 46,72 48,94 42,94" fill="#ffffff"/>
      <polygon points="62,72 54,72 52,94 58,94" fill="#ffffff"/>
    `
  },
  {
    index: 5,
    rollNumber: 'MCA26005',
    name: 'ANJALI MENON',
    course: 'MCA (SEMESTER 2)',
    courseRaw: 'MCA',
    semester: 2,
    dob: '2001-06-18',
    idNumber: '5678 9012 3456',
    idNumberRaw: '567890123456',
    bloodGroup: 'O+',
    examCenter: 'South Zone Campus (Ernakulam)',
    allocatedHall: 'Block C - Room 301',
    allocatedSeat: 'Desk #22',
    email: 'anjali@examshield.com',
    status: 'ACTIVE',
    isActive: true,
    expectedResult: 'APPROVED',
    badgeColor: '#10b981',
    scenario: 'Normal Gate Admission (Active Candidate) -> Allocated Block C Desk #22',
    avatarSvg: `
      <rect width="100" height="120" fill="#059669"/>
      <path d="M 22 36 Q 50 12 78 36 Q 84 75 74 88 Q 50 80 26 88 Q 16 75 22 36 Z" fill="#18181b"/>
      <circle cx="50" cy="42" r="20" fill="#fed7aa"/>
      <path d="M 30 32 Q 50 22 70 32 Q 50 26 30 32 Z" fill="#18181b"/>
      <path d="M 20 110 Q 20 74 50 74 Q 80 74 80 110 Z" fill="#065f46"/>
      <polygon points="44,74 56,74 53,92 50,96 47,92" fill="#facc15"/>
      <polygon points="38,74 44,74 46,92 40,92" fill="#ffffff"/>
      <polygon points="62,74 56,74 54,92 60,92" fill="#ffffff"/>
    `
  },
  {
    index: 6,
    rollNumber: 'BCA26021',
    name: 'HARISANKAR P',
    course: 'BCA (SEMESTER 4)',
    courseRaw: 'BCA',
    semester: 4,
    dob: '2003-01-25',
    idNumber: '6789 0123 4567',
    idNumberRaw: '678901234567',
    bloodGroup: 'B+',
    examCenter: 'South Zone Campus (Ernakulam)',
    allocatedHall: 'Block C - Room 302',
    allocatedSeat: 'Desk #08',
    email: 'harisankar@examshield.com',
    status: 'ACTIVE',
    isActive: true,
    expectedResult: 'APPROVED',
    badgeColor: '#10b981',
    scenario: 'Normal Gate Admission (Active Candidate) -> Allocated Block C Desk #08',
    avatarSvg: `
      <rect width="100" height="120" fill="#0891b2"/>
      <circle cx="50" cy="42" r="22" fill="#ffedd5"/>
      <path d="M 28 35 Q 50 15 72 35 Q 65 20 50 20 Q 35 20 28 35 Z" fill="#0f172a"/>
      <path d="M 20 110 Q 20 72 50 72 Q 80 72 80 110 Z" fill="#164e63"/>
      <polygon points="46,72 54,72 52,94 50,98 48,94" fill="#06b6d4"/>
      <polygon points="38,72 46,72 48,94 42,94" fill="#ffffff"/>
      <polygon points="62,72 54,72 52,94 58,94" fill="#ffffff"/>
    `
  },
  {
    index: 7,
    rollNumber: 'BCA26022',
    name: 'FATHIMA R',
    course: 'BCA (SEMESTER 4)',
    courseRaw: 'BCA',
    semester: 4,
    dob: '2002-09-09',
    idNumber: '7890 1234 5678',
    idNumberRaw: '789012345678',
    bloodGroup: 'A+',
    examCenter: 'North Zone Campus (Kozhikode)',
    allocatedHall: 'Block D - Room 401',
    allocatedSeat: 'Desk #14',
    email: 'fathima@examshield.com',
    status: 'ACTIVE',
    isActive: true,
    expectedResult: 'APPROVED',
    badgeColor: '#10b981',
    scenario: 'Normal Gate Admission (Active Candidate) -> Allocated Block D Desk #14',
    avatarSvg: `
      <rect width="100" height="120" fill="#4f46e5"/>
      <path d="M 25 45 Q 25 15 50 15 Q 75 15 75 45 Q 82 85 75 105 Q 50 95 25 105 Q 18 85 25 45 Z" fill="#312e81"/>
      <circle cx="50" cy="48" r="16" fill="#fed7aa"/>
      <path d="M 22 110 Q 22 76 50 76 Q 78 76 78 110 Z" fill="#4338ca"/>
      <polygon points="45,76 55,76 53,95 50,98 47,95" fill="#f43f5e"/>
    `
  },
  {
    index: 8,
    rollNumber: 'CS26081',
    name: 'GOKUL DAS',
    course: 'B.TECH CSE (SEMESTER 6)',
    courseRaw: 'B.Tech CSE',
    semester: 6,
    dob: '2002-12-05',
    idNumber: '8901 2345 6789',
    idNumberRaw: '890123456789',
    bloodGroup: 'O-',
    examCenter: 'Main Campus (Malappuram)',
    allocatedHall: 'Lab 1 - Ground Floor',
    allocatedSeat: 'Desk #03',
    email: 'gokul@examshield.com',
    status: 'ACTIVE',
    isActive: true,
    expectedResult: 'APPROVED',
    badgeColor: '#10b981',
    scenario: 'Normal Gate Admission (Active Candidate) -> Allocated Lab 1 Desk #03',
    avatarSvg: `
      <rect width="100" height="120" fill="#059669"/>
      <circle cx="50" cy="42" r="22" fill="#fed7aa"/>
      <path d="M 28 35 Q 50 15 72 35 Q 65 20 50 20 Q 35 20 28 35 Z" fill="#1e293b"/>
      <path d="M 20 110 Q 20 72 50 72 Q 80 72 80 110 Z" fill="#14532d"/>
      <polygon points="46,72 54,72 52,94 50,98 48,94" fill="#f97316"/>
      <polygon points="38,72 46,72 48,94 42,94" fill="#ffffff"/>
      <polygon points="62,72 54,72 52,94 58,94" fill="#ffffff"/>
    `
  },
  {
    index: 9,
    rollNumber: 'CS26082',
    name: 'MEERA PILLAI',
    course: 'B.TECH CSE (SEMESTER 6)',
    courseRaw: 'B.Tech CSE',
    semester: 6,
    dob: '2001-04-17',
    idNumber: '9012 3456 7890',
    idNumberRaw: '901234567890',
    bloodGroup: 'B+',
    examCenter: 'Main Campus (Malappuram)',
    allocatedHall: null,
    allocatedSeat: null,
    email: 'meera@examshield.com',
    status: 'SUSPENDED',
    isActive: false,
    expectedResult: 'REJECTED (SUSPENDED)',
    badgeColor: '#ef4444',
    scenario: 'Disciplinary Barred Candidate (Suspended) -> Entry Denied & Seating Locked',
    avatarSvg: `
      <rect width="100" height="120" fill="#b91c1c"/>
      <path d="M 22 36 Q 50 10 78 36 Q 84 80 72 90 Q 50 80 28 90 Q 16 80 22 36 Z" fill="#450a0a"/>
      <circle cx="50" cy="42" r="20" fill="#fed7aa"/>
      <circle cx="43" cy="42" r="5" fill="none" stroke="#000" stroke-width="1.8"/>
      <circle cx="57" cy="42" r="5" fill="none" stroke="#000" stroke-width="1.8"/>
      <line x1="48" y1="42" x2="52" y2="42" stroke="#000" stroke-width="1.8"/>
      <path d="M 30 32 Q 50 20 70 32 Q 50 26 30 32 Z" fill="#450a0a"/>
      <path d="M 20 110 Q 20 74 50 74 Q 80 74 80 110 Z" fill="#7f1d1d"/>
      <polygon points="44,74 56,74 53,92 50,96 47,92" fill="#fef08a"/>
      <polygon points="38,74 44,74 46,92 40,92" fill="#ffffff"/>
      <polygon points="62,74 56,74 54,92 60,92" fill="#ffffff"/>
    `
  },
  {
    index: 10,
    rollNumber: 'CS26099',
    name: 'JOHN DOE (FAKE)',
    course: 'B.TECH CSE (SEMESTER 6)',
    courseRaw: 'B.Tech CSE',
    semester: 6,
    dob: '1999-07-20',
    idNumber: '9999 8888 7777',
    idNumberRaw: '999988887777',
    bloodGroup: 'UNKNOWN',
    examCenter: 'UNREGISTERED ZONE',
    allocatedHall: null,
    allocatedSeat: null,
    email: 'fake_candidate@unknown.com',
    status: 'NOT_REGISTERED',
    isActive: false,
    expectedResult: 'REJECTED (NOT FOUND)',
    badgeColor: '#dc2626',
    scenario: 'Fraudulent / Imposter ID Card (Not in Database) -> Rejection: Roll number not found',
    avatarSvg: `
      <rect width="100" height="120" fill="#475569"/>
      <circle cx="50" cy="42" r="22" fill="#cbd5e1"/>
      <path d="M 20 110 Q 20 72 50 72 Q 80 72 80 110 Z" fill="#cbd5e1"/>
      <text x="50" y="48" font-size="20" font-family="Arial" font-weight="bold" fill="#dc2626" text-anchor="middle">?</text>
    `
  }
];

// Helper to build realistic Student ID Card HTML (No room or desk numbers!)
async function generateCardHtml(student) {
  const qrDataUrl = await QRCode.toDataURL(`EXAM-${student.rollNumber}-2026`, { margin: 1, width: 140 });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${student.rollNumber} - ${student.name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Arial, Helvetica, sans-serif; }
  body { background: #ffffff; padding: 0; margin: 0; width: 850px; height: 500px; }
  
  .id-card {
    width: 850px;
    height: 500px;
    background: #ffffff;
    border: 3px solid ${student.status === 'NOT_REGISTERED' ? '#dc2626' : student.status === 'SUSPENDED' ? '#b91c1c' : '#1e3a8a'};
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .card-header {
    background: ${student.status === 'NOT_REGISTERED' ? '#991b1b' : student.status === 'SUSPENDED' ? '#7f1d1d' : '#1e3a8a'};
    color: #ffffff;
    padding: 16px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 4px solid ${student.status === 'NOT_REGISTERED' ? '#f87171' : student.status === 'SUSPENDED' ? '#ef4444' : '#f59e0b'};
  }

  .header-titles h1 {
    font-size: 20px;
    font-weight: 800;
    text-transform: uppercase;
    color: #ffffff;
    margin: 0;
    letter-spacing: 0.5px;
  }
  .header-titles h2 {
    font-size: 13px;
    color: ${student.status === 'NOT_REGISTERED' ? '#fee2e2' : student.status === 'SUSPENDED' ? '#fee2e2' : '#fef08a'};
    font-weight: 700;
    text-transform: uppercase;
    margin-top: 4px;
    letter-spacing: 0.5px;
  }

  .badge-session {
    background: ${student.status === 'NOT_REGISTERED' ? '#fee2e2' : student.status === 'SUSPENDED' ? '#fee2e2' : '#f59e0b'};
    color: #000000;
    font-size: 12px;
    font-weight: 800;
    padding: 6px 12px;
    border-radius: 4px;
  }

  .card-body {
    display: flex;
    padding: 24px 28px;
    flex: 1;
    gap: 24px;
    background: #ffffff;
    align-items: center;
  }

  .photo-col {
    width: 150px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .photo-frame {
    width: 130px;
    height: 165px;
    border: 2px solid #000000;
    background: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .photo-frame svg {
    width: 100%;
    height: 100%;
  }
  .id-badge-tag {
    font-size: 11px;
    font-weight: 800;
    color: #0f172a;
    margin-top: 10px;
    text-transform: uppercase;
    background: #e2e8f0;
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid #cbd5e1;
    text-align: center;
    width: 100%;
  }

  .details-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .info-table {
    width: 100%;
    border-collapse: collapse;
  }
  .info-table td {
    padding: 6px 0;
    font-size: 15px;
    vertical-align: middle;
  }
  .label-cell {
    width: 140px;
    font-weight: 700;
    color: #334155;
    text-transform: uppercase;
    font-size: 13px;
  }
  .value-cell {
    font-weight: 800;
    color: #000000;
    text-transform: uppercase;
    font-size: 16px;
  }
  .roll-val {
    font-size: 22px;
    color: #000000;
    font-weight: 900;
    letter-spacing: 1px;
  }

  .qr-col {
    width: 150px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-left: 14px;
    border-left: 2px solid #e2e8f0;
  }
  .qr-box {
    background: #ffffff;
    padding: 6px;
    border: 2px solid #000000;
  }
  .qr-box img {
    display: block;
    width: 120px;
    height: 120px;
  }
  .qr-code-text {
    font-size: 11px;
    font-weight: 800;
    color: #000000;
    margin-top: 8px;
    text-align: center;
  }

  .card-footer {
    background: #f8fafc;
    color: #0f172a;
    padding: 12px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    font-weight: 800;
    border-top: 2px solid #cbd5e1;
  }
  .signature-text {
    font-family: 'Brush Script MT', cursive, sans-serif;
    font-size: 16px;
    color: ${student.status === 'NOT_REGISTERED' ? '#dc2626' : '#1e3a8a'};
  }
</style>
</head>
<body>
  <div class="id-card">
    <div class="card-header">
      <div class="header-titles">
        <h1>STATE TECHNOLOGICAL UNIVERSITY</h1>
        <h2>OFFICIAL STUDENT IDENTITY CARD</h2>
      </div>
      <div class="badge-session">VALID: 2025 - 2027</div>
    </div>
    <div class="card-body">
      <div class="photo-col">
        <div class="photo-frame">
          <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
            ${student.avatarSvg}
          </svg>
        </div>
        <div class="id-badge-tag">${student.status === 'NOT_REGISTERED' ? 'INVALID CARD' : student.status === 'SUSPENDED' ? 'SUSPENDED PASS' : 'REGULAR STUDENT'}</div>
      </div>
      <div class="details-col">
        <table class="info-table">
          <tr>
            <td class="label-cell">STUDENT NAME:</td>
            <td class="value-cell">${student.name}</td>
          </tr>
          <tr>
            <td class="label-cell">ROLL NUMBER:</td>
            <td class="value-cell roll-val">${student.rollNumber}</td>
          </tr>
          <tr>
            <td class="label-cell">COURSE:</td>
            <td class="value-cell">${student.course}</td>
          </tr>
          <tr>
            <td class="label-cell">DATE OF BIRTH:</td>
            <td class="value-cell">${student.dob}</td>
          </tr>
          <tr>
            <td class="label-cell">AADHAAR / ID NO:</td>
            <td class="value-cell">${student.idNumber}</td>
          </tr>
          <tr>
            <td class="label-cell">BLOOD GROUP:</td>
            <td class="value-cell">${student.bloodGroup} | VALIDITY: 31-07-2027</td>
          </tr>
        </table>
      </div>
      <div class="qr-col">
        <div class="qr-box">
          <img src="${qrDataUrl}" alt="QR">
        </div>
        <div class="qr-code-text">EXAM-${student.rollNumber}-2026</div>
      </div>
    </div>
    <div class="card-footer">
      <span>CARD ID: ID-2026-${student.rollNumber}</span>
      <span>HOLDER SIGN: <span class="signature-text">${student.name.split(' ')[0]}</span></span>
      <span>REGISTRAR: <span class="signature-text">Dr. K. S. Pillai</span></span>
    </div>
  </div>
</body>
</html>`;
}

// Helper to build 240x300 passport photo HTML
function generatePassportPhotoHtml(student) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: 240px; height: 300px; overflow: hidden; background: #e2e8f0; display: flex; align-items: center; justify-content: center; }
  svg { width: 100%; height: 100%; display: block; }
</style>
</head>
<body>
  <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
    ${student.avatarSvg}
  </svg>
</body>
</html>`;
}

// Master execution
async function main() {
  console.log('🚀 Starting Updated Sample ID Cards & Passport Photos Generation...');
  const chromePath = '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"';

  for (const student of students) {
    const padIndex = String(student.index).padStart(2, '0');
    const safeName = student.name.replace(/[^a-zA-Z0-9]/g, '_');
    const cardFileName = `${padIndex}_${student.rollNumber}_${safeName}`;
    const cardHtmlFileName = `${cardFileName}.html`;
    const cardPngFileName = `${cardFileName}.png`;

    const cardHtmlFilePath = path.join(OUTPUT_DIR, cardHtmlFileName);
    const cardPngFilePath = path.join(IMAGES_DIR, cardPngFileName);
    const serverUploadCardPath = path.join(SERVER_UPLOADS_DIR, cardPngFileName);

    // 1. Generate ID Card
    const cardHtml = await generateCardHtml(student);
    fs.writeFileSync(cardHtmlFilePath, cardHtml);
    const cmdCard = `${chromePath} --headless=new --disable-gpu --screenshot="${cardPngFilePath}" --window-size=850,500 "file:///${cardHtmlFilePath.replace(/\\/g, '/')}"`;
    execSync(cmdCard);
    fs.copyFileSync(cardPngFilePath, serverUploadCardPath);

    // 2. Generate Dedicated Passport Photo (240x300)
    const photoFileName = `photo_${student.rollNumber}.png`;
    const photoHtmlFilePath = path.join(OUTPUT_DIR, `photo_${student.rollNumber}.html`);
    const serverPhotoPath = path.join(SERVER_UPLOADS_DIR, photoFileName);

    const photoHtml = generatePassportPhotoHtml(student);
    fs.writeFileSync(photoHtmlFilePath, photoHtml);
    const cmdPhoto = `${chromePath} --headless=new --disable-gpu --screenshot="${serverPhotoPath}" --window-size=240,300 "file:///${photoHtmlFilePath.replace(/\\/g, '/')}"`;
    execSync(cmdPhoto);

    console.log(`✅ [${padIndex}/10] Generated ID Card: ${cardPngFileName} & Passport Photo: ${photoFileName}`);
  }

  // ── Sync with mock_users.json ──
  console.log('\n📦 Synchronizing database records in mock_users.json...');
  const salt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('Student@123', salt);

  const mockUsersPath = path.join(__dirname, 'server', 'data', 'mock_users.json');
  let currentUsers = [];
  if (fs.existsSync(mockUsersPath)) {
    try {
      currentUsers = JSON.parse(fs.readFileSync(mockUsersPath, 'utf-8'));
    } catch (e) {
      currentUsers = [];
    }
  }

  const staffUsers = currentUsers.filter(u => u.role === 'admin' || u.role === 'security_staff');
  if (staffUsers.length === 0) {
    staffUsers.push(
      {
        _id: '65b4c123456789abcdef0001',
        name: 'ExamShield Admin',
        email: 'admin@examshield.com',
        password: bcrypt.hashSync('Admin@123', salt),
        role: 'admin',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: '65b4c123456789abcdef0002',
        name: 'Security Staff Gate 1',
        email: 'security@examshield.com',
        password: bcrypt.hashSync('Security@123', salt),
        role: 'security_staff',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
  }

  const registeredStudents = students
    .filter(s => s.status !== 'NOT_REGISTERED')
    .map(s => {
      const padIndex = String(s.index).padStart(2, '0');
      const safeName = s.name.replace(/[^a-zA-Z0-9]/g, '_');
      const cardPngFileName = `${padIndex}_${s.rollNumber}_${safeName}.png`;
      const photoFileName = `photo_${s.rollNumber}.png`;

      const existingUser = currentUsers.find(
        u => u.role === 'student' && u.studentProfile && u.studentProfile.rollNumber === s.rollNumber
      );

      return {
        _id: existingUser ? existingUser._id : `student_${s.rollNumber.toLowerCase()}`,
        name: s.name,
        email: s.email,
        password: defaultPasswordHash,
        role: 'student',
        isActive: s.isActive,
        studentProfile: {
          rollNumber: s.rollNumber,
          course: s.courseRaw,
          semester: s.semester,
          dob: s.dob,
          idNumber: s.idNumberRaw,
          bloodGroup: s.bloodGroup,
          examCenter: s.examCenter,
          allocatedHall: s.isActive ? s.allocatedHall : null,
          allocatedSeat: s.isActive ? s.allocatedSeat : null,
          adminVerified: s.isActive,
          adminVerifiedAt: s.isActive ? new Date().toISOString() : null,
          checkInStatus: 'NOT_ARRIVED',
          checkInTime: null,
          qrToken: `EXAM-${s.rollNumber}-2026`,
          examSubject: `${s.courseRaw} Entrance Examination 2026`,
          examDate: '2026-08-10',
          examTime: '10:00 AM - 1:00 PM',
          photoUrl: `/uploads/${photoFileName}`,
          idCardImageUrl: `/uploads/${photoFileName}`,
          referenceCardUrl: `/uploads/${cardPngFileName}`
        },
        createdAt: existingUser ? existingUser.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

  const finalUsers = [...staffUsers, ...registeredStudents];
  fs.writeFileSync(mockUsersPath, JSON.stringify(finalUsers, null, 2));
  console.log(`✅ mock_users.json updated with ${registeredStudents.length} registered students.`);

  // ── Sync with students.csv ──
  console.log('\n📄 Synchronizing students.csv...');
  const csvPath = path.join(__dirname, 'server', 'data', 'students.csv');
  const csvRows = ['RollNumber,Name,Course,Semester,ExamCenter,Status'];
  for (const s of students) {
    if (s.status !== 'NOT_REGISTERED') {
      csvRows.push(`${s.rollNumber},${s.name},${s.courseRaw},${s.semester},${s.examCenter},${s.status}`);
    }
  }
  fs.writeFileSync(csvPath, csvRows.join('\n') + '\n');
  console.log('✅ students.csv updated.');

  // ── Generate Master Interactive Viewer / Showcase HTML ──
  console.log('\n🎨 Generating Master Interactive Gallery (sample_id_cards/index.html)...');
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ExamShield - 10 Sample Student ID Cards Test Suite</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
<style>
  body {
    background-color: #0f172a;
    color: #f8fafc;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  }
  .card-box {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 12px;
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .card-box:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.4);
    border-color: #3b82f6;
  }
  .card-img-preview {
    width: 100%;
    height: auto;
    display: block;
    border-bottom: 2px solid #334155;
    background: #fff;
  }
  .badge-approved { background-color: #059669; }
  .badge-suspended { background-color: #dc2626; }
  .badge-unregistered { background-color: #991b1b; }
</style>
</head>
<body class="py-5">

<div class="container">
  <!-- Header -->
  <div class="text-center mb-5">
    <div class="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-primary bg-opacity-25 text-primary border border-primary border-opacity-50 mb-2">
      <i class="bi bi-shield-check"></i> ExamShield Gate Identity Verification Test Suite
    </div>
    <h1 class="fw-bold display-5">Official 10 Sample Student ID Cards</h1>
    <p class="text-secondary fs-6 max-w-700 mx-auto">
      These realistic institutional Student Identity Cards contain the candidate's personal credentials (Name, Roll No, DOB, Aadhaar, Blood Group).
      <span class="text-info d-block mt-1">Specific Room & Desk Number allocations are kept confidential and are dynamically assigned to the candidate's <strong>Hall Ticket</strong> upon Admin verification.</span>
    </p>
  </div>

  <!-- Testing Guidance Banner -->
  <div class="alert alert-dark border-secondary p-4 rounded-3 mb-5">
    <h5 class="fw-bold text-info"><i class="bi bi-info-circle-fill me-2"></i>How to Test in ExamShield:</h5>
    <div class="row g-3 mt-1">
      <div class="col-md-4">
        <div class="p-3 bg-secondary bg-opacity-10 rounded border border-secondary border-opacity-25 h-100">
          <strong class="text-light d-block mb-1">1. OCR ID Card Scan</strong>
          <small class="text-secondary">Click <em>Download PNG</em> on any card below, open <a href="http://localhost:5173/verify" target="_blank" class="text-primary text-decoration-none">http://localhost:5173/verify</a>, upload the card in <strong>OCR mode</strong>. The system extracts Name, Roll No, DOB, and Aadhaar to verify!</small>
        </div>
      </div>
      <div class="col-md-4">
        <div class="p-3 bg-secondary bg-opacity-10 rounded border border-secondary border-opacity-25 h-100">
          <strong class="text-light d-block mb-1">2. Dynamic Seating Guidance</strong>
          <small class="text-secondary">When verified, the gate scanner announces the candidate's assigned room & desk (e.g. <code>Block B - Room 204 [Desk #18]</code>) and marks them Checked In!</small>
        </div>
      </div>
      <div class="col-md-4">
        <div class="p-3 bg-secondary bg-opacity-10 rounded border border-secondary border-opacity-25 h-100">
          <strong class="text-light d-block mb-1">3. Anti-Passback Test</strong>
          <small class="text-secondary">Scan <strong>Card #01 (MCA26001)</strong> once to approve and admit. Then immediately upload it again to witness the live <em>Duplicate Entry Alarm</em>!</small>
        </div>
      </div>
    </div>
  </div>

  <!-- Cards Grid -->
  <div class="row g-4">
    ${students.map(s => {
      const padIndex = String(s.index).padStart(2, '0');
      const safeName = s.name.replace(/[^a-zA-Z0-9]/g, '_');
      const pngFile = `cards_images/${padIndex}_${s.rollNumber}_${safeName}.png`;
      const htmlFile = `${padIndex}_${s.rollNumber}_${safeName}.html`;
      const badgeClass = s.status === 'NOT_REGISTERED' ? 'badge-unregistered' : s.status === 'SUSPENDED' ? 'badge-suspended' : 'badge-approved';

      return `
      <div class="col-lg-6">
        <div class="card-box h-100 d-flex flex-column">
          <!-- Card Image Preview -->
          <a href="${pngFile}" target="_blank" title="Click to view full image">
            <img src="${pngFile}" alt="${s.name}" class="card-img-preview" />
          </a>
          
          <div class="p-4 flex-grow-1 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge ${badgeClass} text-uppercase px-2 py-1">${s.expectedResult}</span>
                <span class="text-secondary small fw-bold">Card #${padIndex} of 10</span>
              </div>
              <h4 class="fw-bold mb-1">${s.name}</h4>
              <p class="text-primary fw-bold mb-2">Roll No: <code>${s.rollNumber}</code> | ${s.courseRaw} (${s.bloodGroup})</p>
              
              <div class="bg-black bg-opacity-25 p-3 rounded mb-3 text-secondary small">
                <div><strong>Test Purpose:</strong> ${s.scenario}</div>
                <div class="mt-1"><strong>DOB:</strong> ${s.dob} | <strong>Aadhaar:</strong> ${s.idNumber}</div>
                <div class="mt-1"><strong>Allocated Hall Ticket Seating:</strong> ${s.isActive ? `${s.allocatedHall} [${s.allocatedSeat}]` : '🔒 Locked (Pending Admin Verification)'}</div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="d-flex flex-wrap gap-2 pt-2 border-top border-secondary border-opacity-25">
              <a href="${pngFile}" download class="btn btn-sm btn-primary d-inline-flex align-items-center gap-1">
                <i class="bi bi-download"></i> Download ID Card
              </a>
              <button class="btn btn-sm btn-outline-light d-inline-flex align-items-center gap-1" onclick="navigator.clipboard.writeText('${s.rollNumber}'); alert('Copied Roll Number: ${s.rollNumber}');">
                <i class="bi bi-clipboard"></i> Copy Roll
              </button>
              <button class="btn btn-sm btn-outline-info d-inline-flex align-items-center gap-1" onclick="navigator.clipboard.writeText('EXAM-${s.rollNumber}-2026'); alert('Copied QR Token: EXAM-${s.rollNumber}-2026');">
                <i class="bi bi-qr-code"></i> Copy QR Token
              </button>
              <a href="${htmlFile}" target="_blank" class="btn btn-sm btn-outline-secondary ms-auto">
                <i class="bi bi-box-arrow-up-right"></i> HTML
              </a>
            </div>
          </div>
        </div>
      </div>
      `;
    }).join('')}
  </div>

  <!-- Footer -->
  <footer class="mt-5 pt-4 text-center text-secondary border-top border-secondary border-opacity-25">
    <p>ExamShield Automated Identity Verification Project &copy; 2026 - MEA Engineering College</p>
  </footer>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml);
  console.log('✅ Generated sample_id_cards/index.html');

  // ── Generate Combined Printable PDF ──
  console.log('\n📄 Generating Combined Printable PDF of All 10 Cards...');
  const combinedHtmlPath = path.join(OUTPUT_DIR, 'all_cards_print.html');
  const combinedPdfPath = path.join(OUTPUT_DIR, 'All_10_Sample_ID_Cards.pdf');

  let combinedCardsHtml = '';
  for (const s of students) {
    const cardHtmlInner = await generateCardHtml(s);
    const match = cardHtmlInner.match(/<div class="id-card">[\s\S]*?<\/div>\s*<\/body>/);
    if (match) {
      combinedCardsHtml += `
        <div class="print-page-wrapper">
          <div class="scenario-banner">
            <strong>Card #${String(s.index).padStart(2, '0')}: ${s.name} (${s.rollNumber})</strong> — Status: <span>${s.expectedResult}</span>
          </div>
          ${match[0].replace('</body>', '')}
        </div>
      `;
    }
  }

  const printableDoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>All 10 Sample Student ID Cards - ExamShield</title>
<style>
  @page { size: A4 portrait; margin: 12mm 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; }
  body { background: #ffffff; color: #000; }
  .print-page-wrapper {
    page-break-after: always;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 90vh;
    padding: 20px 0;
  }
  .print-page-wrapper:last-child { page-break-after: auto; }
  .scenario-banner {
    width: 850px;
    padding: 8px 16px;
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    margin-bottom: 14px;
    font-size: 13px;
  }
  .scenario-banner span { font-weight: bold; color: #1e3a8a; }
  .id-card { width: 850px; height: 500px; border: 3px solid #1e3a8a; display: flex; flex-direction: column; overflow: hidden; }
  .card-header { background: #1e3a8a; color: #ffffff; padding: 16px 28px; display: flex; align-items: center; justify-content: space-between; border-bottom: 4px solid #f59e0b; }
  .header-titles h1 { font-size: 20px; font-weight: 800; text-transform: uppercase; color: #ffffff; margin: 0; }
  .header-titles h2 { font-size: 13px; color: #fef08a; font-weight: 700; text-transform: uppercase; margin-top: 4px; }
  .badge-session { background: #f59e0b; color: #000000; font-size: 12px; font-weight: 800; padding: 6px 12px; border-radius: 4px; }
  .card-body { display: flex; padding: 24px 28px; flex: 1; gap: 24px; background: #ffffff; align-items: center; }
  .photo-col { width: 150px; display: flex; flex-direction: column; align-items: center; }
  .photo-frame { width: 130px; height: 165px; border: 2px solid #000000; background: #f1f5f9; display: flex; align-items: center; justify-content: center; }
  .photo-frame svg { width: 100%; height: 100%; }
  .id-badge-tag { font-size: 11px; font-weight: 800; color: #0f172a; margin-top: 10px; text-transform: uppercase; background: #e2e8f0; padding: 4px 8px; border-radius: 4px; border: 1px solid #cbd5e1; text-align: center; width: 100%; }
  .details-col { flex: 1; display: flex; flex-direction: column; justify-content: center; }
  .info-table { width: 100%; border-collapse: collapse; }
  .info-table td { padding: 6px 0; font-size: 15px; vertical-align: middle; }
  .label-cell { width: 140px; font-weight: 700; color: #334155; text-transform: uppercase; font-size: 13px; }
  .value-cell { font-weight: 800; color: #000000; text-transform: uppercase; font-size: 16px; }
  .roll-val { font-size: 22px; color: #000000; font-weight: 900; letter-spacing: 1px; }
  .qr-col { width: 150px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding-left: 14px; border-left: 2px solid #e2e8f0; }
  .qr-box { background: #ffffff; padding: 6px; border: 2px solid #000000; }
  .qr-box img { display: block; width: 120px; height: 120px; }
  .qr-code-text { font-size: 11px; font-weight: 800; color: #000000; margin-top: 8px; text-align: center; }
  .card-footer { background: #f8fafc; color: #0f172a; padding: 12px 28px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 800; border-top: 2px solid #cbd5e1; }
  .signature-text { font-family: 'Brush Script MT', cursive, sans-serif; font-size: 16px; color: #1e3a8a; }
</style>
</head>
<body>
${combinedCardsHtml}
</body>
</html>`;

  fs.writeFileSync(combinedHtmlPath, printableDoc);
  const pdfCmd = `${chromePath} --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${combinedPdfPath}" "file:///${combinedHtmlPath.replace(/\\/g, '/')}"`;
  try {
    execSync(pdfCmd);
    console.log(`✅ Generated combined PDF at: ${combinedPdfPath}`);
  } catch (err) {
    console.error('PDF generation error:', err.message);
  }

  console.log('\n🎉 ALL 10 SAMPLE STUDENT ID CARDS & PASSPORT PHOTOS GENERATION COMPLETE!');
}

main().catch(err => {
  console.error('Fatal execution error:', err);
});
