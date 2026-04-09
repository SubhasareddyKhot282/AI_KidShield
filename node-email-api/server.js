const { createApp } = require("./src/app");

const app = createApp();

const port = process.env.PORT ? Number(process.env.PORT) : 5001;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Email + Media API listening on http://localhost:${port}`);
});

