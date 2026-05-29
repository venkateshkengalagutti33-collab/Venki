import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Increase body parser limits for high-resolution base64 custom uploaded images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const DATA_DIR = path.join(process.cwd(), "data");
const SETTINGS_FILE = path.join(DATA_DIR, "proposals.json");

// Ensure persistent data directory folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache synced with persistent database JSON file
let proposalsStore: Record<string, any> = {};
if (fs.existsSync(SETTINGS_FILE)) {
  try {
    proposalsStore = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
  } catch (err) {
    console.error("Error reading proposals.json database file", err);
  }
}

// Save custom settings payload to cloud store
app.post("/api/settings", (req, res) => {
  try {
    const settings = req.body;
    if (!settings || !settings.girlfriendName) {
      return res.status(400).json({ error: "Invalid layout settings payload" });
    }
    
    // Generate a beautiful, short, clean alphanumeric ID
    const customId = Math.random().toString(36).substring(2, 10);
    proposalsStore[customId] = settings;
    
    // Save to disk asynchronously so it persists server restarts
    fs.writeFile(SETTINGS_FILE, JSON.stringify(proposalsStore, null, 2), "utf-8", (err) => {
      if (err) {
        console.error("Failed writing persistent proposals file metadata to disk", err);
      }
    });
    
    res.json({ id: customId });
  } catch (error) {
    console.error("Server error during settings save:", error);
    res.status(500).json({ error: "Failed to persist custom settings" });
  }
});

// Retrieve custom saved proposal settings for girlfriend's screen
app.get("/api/settings/:id", (req, res) => {
  const { id } = req.params;
  const data = proposalsStore[id];
  if (!data) {
    return res.status(404).json({ error: "Proposal settings not found or expired" });
  }
  res.json(data);
});

// Save feedback/reply from girlfriend under her custom settings record
app.post("/api/settings/:id/feedback", (req, res) => {
  try {
    const { id } = req.params;
    const { feedbackText, reactionEmoji, name } = req.body;
    
    const data = proposalsStore[id];
    if (!data) {
      return res.status(404).json({ error: "Proposal settings not found for this feedback" });
    }
    
    if (!data.feedbacks) {
      data.feedbacks = [];
    }
    
    const feedbackItem = {
      id: Math.random().toString(36).substring(2, 9),
      text: feedbackText || "",
      reaction: reactionEmoji || "❤️",
      name: name || data.girlfriendName || "Princess",
      timestamp: new Date().toISOString(),
    };
    
    data.feedbacks.push(feedbackItem);
    proposalsStore[id] = data;
    
    // Save updated proposals database back to disk persistently
    fs.writeFile(SETTINGS_FILE, JSON.stringify(proposalsStore, null, 2), "utf-8", (err) => {
      if (err) {
        console.error("Failed writing persistent proposals file after feedback save", err);
      }
    });
    
    res.json({ success: true, feedback: feedbackItem });
  } catch (error) {
    console.error("Server error during feedback save:", error);
    res.status(500).json({ error: "Failed to persist love feedback and response" });
  }
});

// Configure Vite middleware or static compiler distributions
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Full-Stack Server] listening on http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Fatal startup error for love proposal applet:", err);
});
