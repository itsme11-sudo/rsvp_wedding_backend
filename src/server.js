import "dotenv/config";
import { createApp } from "./app.js";
import { connectToDatabase } from "./config/database.js";

const port = Number(process.env.PORT) || 3000;

await connectToDatabase();

createApp().listen(port, "0.0.0.0", () => {
  console.log(`Wedding RSVP API listening on port ${port}.`);
});
