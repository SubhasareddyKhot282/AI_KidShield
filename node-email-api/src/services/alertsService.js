const { sendAlertEmail } = require("./emailSender");

async function sendAlertEmailWrapper({ user, alert }) {
  return sendAlertEmail({ user, alert });
}

module.exports = { sendAlertEmail: sendAlertEmailWrapper };

