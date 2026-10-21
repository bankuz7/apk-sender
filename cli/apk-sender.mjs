#!/usr/bin/env node
// apk-sender CLI — upload any file (APK etc.) to Vercel Blob, get a public shareable link.
// Works with the exact same Blob store as the web app (uses BLOB_READ_WRITE_TOKEN).

import {
  createReadStream,
  statSync,
} from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Tiny .env loader: reads .env from cwd, only fills vars that aren't already set
function loadDotEnv() {
  try {
    const raw = readFileSync(".env", "utf8");
    for (const line of raw.split("\n")) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (match && match[2] !== undefined && !(match[1] in process.env)) {
        process.env[match[1]] = match[2].replace(/^["'](.*)["']$/, "$1");
      }
    }
  } catch {
    // no .env — fine, user must use env var or --token
  }
}
loadDotEnv();
const VERSION = "1.0.0";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

function usage(code = 1) {
  console.log(`apk-sender ${VERSION} — share files with one command

Usage: apk-sender <file> [options]

Options:
  --name <path>    Custom blob pathname (default: uploads/<filename>)
  --token <token>  BLOB_READ_WRITE_TOKEN (or set the env var instead)
  --quiet          Print only the URL (for scripting)
  --json           Print JSON response
  --copy           Copy the URL to the system clipboard
  --help           Show this help
  --version        Show version

Environment:
  BLOB_READ_WRITE_TOKEN   Blob store token (the same one your web app uses)

Examples:
  apk-sender myapp.apk
  apk-sender screenshot.png --quiet | pbcopy
  apk-sender build/app-release.apk --name apps/latest.apk`);
  process.exit(code);
}

function readToken(args) {
  const flagIndex = args.indexOf("--token");
  if (flagIndex !== -1) {
    const token = args[flagIndex + 1];
    if (!token) usage();
    args.splice(flagIndex, 2);
    return token;
  }
  return process.env.BLOB_READ_WRITE_TOKEN;
}

function parseArgs(argv) {
  const args = [...argv];
  if (args[0] === "--help" || args[0] === "-h") usage(0);
  if (args[0] === "--version" || args[0] === "-v") {
    console.log(VERSION);
    process.exit(0);
  }

  let quiet = false;
  let json = false;
  let copy = false;
  let name = null;

  for (const opt of ["--quiet", "-q"]) {
    const i = args.indexOf(opt);
    if (i !== -1) { quiet = true; args.splice(i, 1); }
  }
  {
    const i = args.indexOf("--json");
    if (i !== -1) { json = true; quiet = true; args.splice(i, 1); }
  }
  {
    const i = args.indexOf("--copy");
    if (i !== -1) { copy = true; args.splice(i, 1); }
  }
  {
    const i = args.indexOf("--name");
    if (i !== -1) {
      name = args[i + 1];
      if (!name) usage();
      args.splice(i, 2);
    }
  }
  const file = args[0];
  if (!file || args.length > 1) usage();
  if (file === "-") {
    console.error(`${RED}Standard input is not supported. Pass a file path.${RESET}`);
    process.exit(1);
  }
  return { file, quiet, json, copy, name };
}

function humanSize(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 100 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function copyToClipboard(text) {
  const commands = [
    { cmd: "pbcopy", args: [] },            // macOS
    { cmd: "wl-copy", args: [] },           // Wayland
    { cmd: "termux-clipboard-set", args: [] }, // Android/Termux
    { cmd: "xclip", args: ["-selection", "clipboard"] }, // X11
  ];
  for (const { cmd, args } of commands) {
    const result = spawnSync(cmd, args, { input: text, timeout: 5000 });
    if (result.status === 0) return true;
    if (result.error && result.error.code === "ENOENT") continue;
  }
  return false;
}

async function uploadFile(filePath, token, { pathname, quiet, json }) {
  try {
    statSync(filePath);
  } catch {
    console.error(`${RED}File not found: ${filePath}${RESET}`);
    process.exit(1);
  }
  if (!token) {
    console.error(`${RED}Missing BLOB_READ_WRITE_TOKEN.${RESET}
Get it from Vercel Dashboard → Storage → your Blob store, then:
  ${DIM}apk-sender <file> --token <token>${RESET}
  ${DIM}export BLOB_READ_WRITE_TOKEN=<token>${RESET}`);
    process.exit(1);
  }

  const filename = path.basename(filePath);
  const size = statSync(filePath).size;

  // Match the web app's addRandomSuffix behaviour so repeated uploads don't overwrite
  const ext = path.extname(filename);
  const random = Math.random().toString(36).slice(2, 8);
  const target = pathname || `uploads/${filename.slice(0, -ext.length || undefined)}-${random}${ext}`;

  let lastPercent = -1;
  if (!quiet && !json) {
    console.log(`${CYAN}Uploading${RESET} ${BOLD}${filename}${RESET} ${DIM}(${humanSize(size)})${RESET}`);
  }

  const stream = createReadStream(filePath);
  const result = await put(target, stream, {
    access: "public",
    token,
    onUploadProgress: (event) => {
      if (quiet || json) return;
      const percent = Math.min(100, Math.round((event.loaded / Math.max(event.total, 1)) * 100));
      if (percent !== lastPercent) {
        lastPercent = percent;
        process.stdout.write(`\r  ${DIM}${percent}%${RESET}  `);
      }
    },
  });

  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (quiet) {
    console.log(result.url);
  } else {
    process.stdout.write("\n");
    console.log(`${GREEN}✔ Uploaded${RESET}`);
    console.log(`  URL:    ${BOLD}${result.url}${RESET}`);
  }
  return result.url;
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0) usage(1);
  const token = readToken(argv);
  const options = parseArgs(argv);
  const bundle = { quiet: options.quiet, json: options.json, pathname: options.name };
  const url = await uploadFile(options.file, token, bundle);
  if (options.copy) {
    if (copyToClipboard(url)) {
      if (!options.quiet) console.log(`  ${DIM}Copied to clipboard${RESET}`);
    } else {
      console.error(`${RED}Could not copy to clipboard (no pbcopy/wl-copy/xclip found).${RESET}`);
    }
  }
}

main().catch((error) => {
  console.error(`${RED}Upload failed: ${error.message || error}${RESET}`);
  process.exit(1);
});
