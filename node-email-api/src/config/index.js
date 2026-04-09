require("dotenv").config();

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

const config = {
  port: process.env.PORT ? Number(process.env.PORT) : 5001,
  nodeEnv: process.env.NODE_ENV || "development",

  mongodbUri: required("MONGODB_URI"),
  tokenEncryptionKey: required("TOKEN_ENCRYPTION_KEY"),

  // Used by the child device/service to call alert + upload endpoints
  childApiKey: required("CHILD_API_KEY"),

  // Used to build file URLs returned by the GET APIs
  publicBaseUrl: process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 5001}`,
};

module.exports = config;

