/**
 * utils/telegram.js
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   Handles sending automated Telegram notifications to students
 *   when their registration is approved by the admin.
 *
 * NOTIFICATION INCLUDES:
 *   • Candidate Name & Roll Number
 *   • Exam Subject
 *   • Exam Date & Time (scheduled by admin)
 *   • Allocated Exam Hall / Room Number
 *   • Allocated Desk / Seat Number
 *   • Examination Venue & Portal Download Link
 *
 * RESILIENT DNS RESOLUTION:
 *   Includes built-in Google/Cloudflare DNS resolver fallback
 *   so that notifications never fail on ISPs with DNS blocks on api.telegram.org.
 * ═══════════════════════════════════════════════════════════════
 */

const https = require("https");
const dns = require("dns");

// Configure fallback DNS resolvers (Google 8.8.8.8, Cloudflare 1.1.1.1)
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {
  // Ignore if not permitted
}

// Custom DNS lookup function that resolves through public DNS if OS libc fails
const resilientLookup = (hostname, opts, cb) => {
  if (typeof opts === "function") {
    cb = opts;
    opts = {};
  }

  // First try dns.resolve4 using configured DNS servers
  dns.resolve4(hostname, (err, addresses) => {
    if (!err && addresses && addresses.length > 0) {
      if (opts.all) {
        return cb(null, addresses.map((a) => ({ address: a, family: 4 })));
      }
      return cb(null, addresses[0], 4);
    }

    // Fallback to standard dns.lookup
    dns.lookup(hostname, opts, cb);
  });
};

/**
 * Sends a generic message via Telegram Bot API using HTTPS request with resilient DNS.
 * @param {string|number} chatId - Student's Telegram chat ID or username
 * @param {string} text - HTML formatted message text
 * @returns {Promise<{ success: boolean, delivered: boolean, message: string }>}
 */
const sendTelegramMessage = (chatId, text) => {
  return new Promise((resolve) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const defaultChatId = process.env.TELEGRAM_DEFAULT_CHAT_ID;
    const targetChatId = chatId || defaultChatId;

    // Always log to console for development verification & debugging
    console.log(`\n================================================`);
    console.log(`📱 [Telegram Bot Notification — @Examzzzbot]`);
    console.log(`Target Chat ID: ${targetChatId || "NONE SPECIFIED"}`);
    console.log(`------------------------------------------------`);
    console.log(text.replace(/<[^>]*>/g, "")); // strip HTML tags for clear terminal view
    console.log(`================================================\n`);

    if (!botToken) {
      console.log("⚠️  TELEGRAM_BOT_TOKEN is not configured in server/.env.");
      return resolve({
        success: true,
        delivered: false,
        simulated: true,
        message: "Notification logged to server console (Bot Token not configured in .env)"
      });
    }

    if (!targetChatId) {
      console.warn("⚠️  No Telegram Chat ID provided for student and no TELEGRAM_DEFAULT_CHAT_ID set in .env.");
      return resolve({
        success: false,
        delivered: false,
        message: "No Telegram Chat ID available for candidate"
      });
    }

    const payload = JSON.stringify({
      chat_id: targetChatId,
      text: text,
      parse_mode: "HTML",
      disable_web_page_preview: false
    });

    const requestOptions = {
      hostname: "api.telegram.org",
      port: 443,
      path: `/bot${botToken}/sendMessage`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload)
      },
      lookup: resilientLookup,
      timeout: 10000
    };

    const req = https.request(requestOptions, (res) => {
      let responseBody = "";
      res.on("data", (chunk) => {
        responseBody += chunk;
      });

      res.on("end", () => {
        try {
          const data = JSON.parse(responseBody);
          if (data.ok) {
            console.log(`✅ [Telegram Bot] Message successfully delivered to Chat ID: ${targetChatId}`);
            return resolve({
              success: true,
              delivered: true,
              messageId: data.result?.message_id,
              message: "Notification delivered to student's Telegram!"
            });
          } else {
            console.warn(`⚠️ [Telegram API]: ${data.description} (Code: ${data.error_code})`);
            return resolve({
              success: false,
              delivered: false,
              error: data.description,
              message: `Telegram API note: ${data.description}`
            });
          }
        } catch (parseErr) {
          return resolve({
            success: false,
            delivered: false,
            message: `Failed to parse Telegram response: ${parseErr.message}`
          });
        }
      });
    });

    req.on("error", (err) => {
      console.error("❌ Failed to reach Telegram API:", err.message);
      return resolve({
        success: false,
        delivered: false,
        error: err.message,
        message: `Network error connecting to Telegram: ${err.message}`
      });
    });

    req.on("timeout", () => {
      req.destroy();
      console.error("❌ Telegram API request timed out after 10s");
      return resolve({
        success: false,
        delivered: false,
        message: "Telegram API request timed out"
      });
    });

    req.write(payload);
    req.end();
  });
};

/**
 * Sends a structured candidate approval notification with Exam Date, Room, and Time.
 * @param {Object} details
 * @param {string} details.chatId - Telegram Chat ID
 * @param {string} details.studentName - Full Name
 * @param {string} details.rollNumber - Roll / Registration Number
 * @param {string} [details.course] - Academic Course
 * @param {string} [details.examSubject] - Subject
 * @param {string} details.examDate - Scheduled Exam Date
 * @param {string} details.examTime - Scheduled Exam Time Slot
 * @param {string} details.allocatedHall - Allocated Room / Hall
 * @param {string} details.allocatedSeat - Allocated Desk / Seat
 * @param {string} [details.examCenter] - Center Venue
 */
const sendTelegramApprovalNotification = async ({
  chatId,
  studentName,
  rollNumber,
  course,
  examSubject = "Entrance Examination 2026",
  examDate = "2026-08-10",
  examTime = "10:00 AM - 1:00 PM",
  allocatedHall = "Block B - Room 204",
  allocatedSeat = "Desk #18",
  examCenter = "State University Main Examination Complex"
}) => {
  const portalUrl = process.env.CLIENT_ORIGIN || "http://localhost:5173";

  const messageText = `
🎓 <b>EXAMSHIELD — ADMIT CARD ISSUANCE & APPROVAL NOTICE</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dear <b>${studentName || "Candidate"}</b>,

Your registration for the <b>${examSubject}</b> has been reviewed and <b>APPROVED</b> by the Examination Authority!

Here are your officially scheduled examination and seating allocation details:

👤 <b>Candidate Name:</b> ${studentName}
🎫 <b>Roll / Reg No:</b> <code>${rollNumber || "N/A"}</code>
📚 <b>Course:</b> ${course || "N/A"}
📖 <b>Exam Subject:</b> ${examSubject}
─────────────────────────────────
📅 <b>EXAM DATE:</b> <b>${examDate}</b>
⏰ <b>EXAM TIME:</b> <b>${examTime}</b>
🏛️ <b>EXAM HALL / ROOM:</b> <b>${allocatedHall}</b>
🪑 <b>ALLOCATED DESK:</b> <b>${allocatedSeat}</b>
📍 <b>VENUE:</b> ${examCenter}
─────────────────────────────────

✅ <b>Admit Card Unlocked:</b>
Your official Hall Ticket featuring your encrypted security QR code is now available for download.

🔗 <b>Login to Student Portal:</b>
${portalUrl}/student/login

⚠️ <i>Important Instructions:</i>
• Please arrive at your allocated Exam Hall at least 30 minutes before the examination time.
• Carry a printed copy of your Admit Card and your valid Photo ID Card for gate verification.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  return await sendTelegramMessage(chatId, messageText.trim());
};

module.exports = {
  sendTelegramMessage,
  sendTelegramApprovalNotification
};
