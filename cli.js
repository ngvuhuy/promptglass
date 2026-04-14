#!/usr/bin/env node
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const startServer = () => {
  const serverPath = join(__dirname, "server", "dist", "index.js");

  if (!fs.existsSync(serverPath)) {
    console.error("Error: Production build not found. Please run 'npm run build' first.");
    process.exit(1);
  }

  console.log("Starting PromptGlass...");

  const proc = spawn("node", [serverPath], {
    cwd: __dirname,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "production",
    },
  });

  proc.on("close", (code) => process.exit(code ?? 0));

  // Handle termination signals
  process.on("SIGINT", () => proc.kill("SIGINT"));
  process.on("SIGTERM", () => proc.kill("SIGTERM"));
};

startServer();
