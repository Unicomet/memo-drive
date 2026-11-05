#!/usr/bin/env node
// Verification scaffolding for Memo Drive. Launch, doctor, and cleanup only
// touch the server this script started. note-delete removes one owned note
// whose title starts with "verify-".

import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  closeSync,
  openSync,
  readFileSync,
  existsSync,
} from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { readlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { createPool } from "mysql2/promise";

const exec = promisify(execFile);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.resolve(scriptDir, "..");
const projectRoot = path.resolve(skillDir, "../../..");
const runDir = path.join(skillDir, "run");
const statePath = path.join(runDir, "server.json");
const logPath = path.join(runDir, "server.log");
const accountPath = path.join(homedir(), ".config", "memo-drive", "account.json");
const defaultPort = Number(process.env.MEMO_VERIFY_PORT || 3107);

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function readState() {
  try {
    return JSON.parse(readFileSync(statePath, "utf8"));
  } catch {
    return null;
  }
}

async function writeState(state) {
  await mkdir(runDir, { recursive: true });
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

function alive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function cwdOf(pid) {
  try {
    return await readlink(`/proc/${pid}/cwd`);
  } catch {
    return null;
  }
}

async function cmdlineOf(pid) {
  try {
    return (await readFile(`/proc/${pid}/cmdline`, "utf8")).replaceAll("\0", " ");
  } catch {
    return "";
  }
}

async function isAncestor(ancestor, pid) {
  let current = pid;
  for (let hop = 0; hop < 25; hop += 1) {
    if (current === ancestor) return true;
    let status;
    try {
      status = await readFile(`/proc/${current}/status`, "utf8");
    } catch {
      return false;
    }
    const parent = Number(status.match(/^PPid:\s+(\d+)/m)?.[1] ?? 0);
    if (!parent || parent === current) return false;
    current = parent;
  }
  return false;
}

async function listeners() {
  let stdout = "";
  try {
    stdout = (await exec("ss", ["-ltnpH"])).stdout;
  } catch {
    return [];
  }
  const rows = [];
  for (const line of stdout.split("\n")) {
    if (!line.trim()) continue;
    const pid = Number(line.match(/pid=(\d+)/)?.[1] ?? 0);
    const local = line.match(/(?:\*|0\.0\.0\.0|127\.0\.0\.1|\[::\]|\[::1\]):(\d+)\s/);
    if (!pid || !local) continue;
    rows.push({ pid, port: Number(local[1]) });
  }
  return rows;
}

async function checkoutListeners() {
  const rows = [];
  for (const row of await listeners()) {
    const cwd = await cwdOf(row.pid);
    if (cwd !== projectRoot) continue;
    const command = await cmdlineOf(row.pid);
    if (!command.includes("next")) continue;
    rows.push({ ...row, command });
  }
  return rows;
}

function nextVersion() {
  const manifest = path.join(projectRoot, "node_modules", "next", "package.json");
  return JSON.parse(readFileSync(manifest, "utf8")).version;
}

async function loadEnv() {
  const text = await readFile(path.join(projectRoot, ".env.local"), "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalsAt = trimmed.indexOf("=");
    if (equalsAt === -1) continue;
    const key = trimmed.slice(0, equalsAt).trim();
    let value = trimmed.slice(equalsAt + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in .env.local`);
  return value;
}

async function selectedUserId() {
  const parsed = JSON.parse(await readFile(accountPath, "utf8"));
  if (!parsed?.userId || typeof parsed.userId !== "string") {
    throw new Error(
      "No account selected. Run `node cli/memo.mjs account list`, then `node cli/memo.mjs account use <email>`.",
    );
  }
  return parsed.userId;
}

async function fetchText(url) {
  const response = await fetch(url, { redirect: "manual" });
  const body = await response.text();
  return { response, body };
}

function printReady(info) {
  console.log("ready");
  for (const [key, value] of Object.entries(info)) {
    console.log(`${key}=${value}`);
  }
}

async function inspect(state) {
  if (!alive(state.pid)) {
    throw new Error(`not-ready process ${state.pid} is not running`);
  }
  const cwd = await cwdOf(state.pid);
  if (cwd !== projectRoot) {
    throw new Error(`not-ready pid ${state.pid} cwd is ${cwd ?? "unknown"}`);
  }
  const command = await cmdlineOf(state.pid);
  if (!command.includes("next")) {
    throw new Error(`not-ready pid ${state.pid} is not next`);
  }
  const version = nextVersion();
  if (!command.includes(version) && !command.includes("next dev")) {
    throw new Error(
      `not-ready pid ${state.pid} does not match installed next ${version}`,
    );
  }
  const bound = await listeners();
  const ownsPort = [];
  for (const row of bound) {
    if (row.port !== state.port) continue;
    if (row.pid === state.pid || (await isAncestor(state.pid, row.pid))) {
      ownsPort.push(row.pid);
    }
  }
  if (ownsPort.length === 0) {
    throw new Error(`not-ready pid ${state.pid} does not own port ${state.port}`);
  }

  const base = `http://127.0.0.1:${state.port}`;
  const home = await fetchText(`${base}/`);
  if (home.response.status !== 200 || !home.body.includes("Memo Drive") || !home.body.includes("Get Started")) {
    throw new Error(
      `not-ready GET / returned ${home.response.status} without the signed-out home page`,
    );
  }

  const notes = await fetch(`${base}/dashboard/notes`, { redirect: "manual" });
  const notesStatus = notes.headers.get("x-clerk-auth-status");
  if (notes.status !== 404 || notesStatus !== "signed-out") {
    throw new Error(
      `not-ready GET /dashboard/notes returned ${notes.status} clerk=${notesStatus ?? "none"}. A cookie-less check must be 404 signed-out.`,
    );
  }

  const signIn = await fetchText(`${base}/sign-in`);
  if (signIn.response.status !== 200 || !signIn.body.includes("Redirecting to Google")) {
    throw new Error(`not-ready GET /sign-in returned ${signIn.response.status}`);
  }

  const who = await exec("node", ["cli/memo.mjs", "whoami"], {
    cwd: projectRoot,
  });
  const identity = JSON.parse(who.stdout);
  const account = await selectedUserId();
  if (identity.userId !== account) {
    throw new Error("not-ready whoami user does not match the selected account");
  }
  if (!Array.isArray(identity.rootFolders) || identity.rootFolders.length === 0) {
    throw new Error(
      "not-ready the selected account has no root folder. Use Create New Drive in the browser before driving files.",
    );
  }

  return {
    url: base,
    port: state.port,
    pid: state.pid,
    owned: state.owned ? "true" : "false",
    next: version,
    userId: identity.userId,
    email: identity.email,
    rootFolder: identity.rootFolders.map((folder) => folder.id).join(","),
    rootName: identity.rootFolders.map((folder) => folder.name).join(","),
    home: home.response.status,
    notes: `${notes.status} signed-out`,
    signIn: signIn.response.status,
  };
}

async function waitForHttp(port, pid) {
  const deadline = Date.now() + 180000;
  let lastError = "no response yet";
  while (Date.now() < deadline) {
    if (!alive(pid)) {
      const tail = existsSync(logPath)
        ? (await readFile(logPath, "utf8")).slice(-2000)
        : "";
      throw new Error(`next exited before it was ready\n${tail}`);
    }
    try {
      const home = await fetchText(`http://127.0.0.1:${port}/`);
      if (home.response.status === 200 && home.body.includes("Memo Drive")) {
        return;
      }
      lastError = `HTTP ${home.response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "fetch failed";
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`next did not become ready within 180s (${lastError})`);
}

async function launch() {
  if (!existsSync(path.join(projectRoot, ".env.local"))) {
    throw new Error("Missing .env.local. Next and the CLI both read it.");
  }
  const current = readState();
  if (current?.pid && alive(current.pid)) {
    const info = await inspect(current);
    console.log(current.owned ? "already-running" : "using-existing");
    printReady(info);
    return;
  }

  const existing = await checkoutListeners();
  if (existing.length > 1) {
    throw new Error(
      `not-ready this checkout has ${existing.length} next listeners. Stop the extra before verifying.`,
    );
  }
  if (existing.length === 1) {
    const state = {
      pid: existing[0].pid,
      port: existing[0].port,
      owned: false,
      cwd: projectRoot,
    };
    await writeState(state);
    const info = await inspect(state);
    console.log("using-existing");
    printReady(info);
    return;
  }

  const port = defaultPort;
  const taken = (await listeners()).some((row) => row.port === port);
  if (taken) {
    throw new Error(
      `not-ready port ${port} is in use by another process. Set MEMO_VERIFY_PORT or free it without killing by name.`,
    );
  }

  await mkdir(runDir, { recursive: true });
  const nextBin = path.join(projectRoot, "node_modules", ".bin", "next");
  const logFd = openSync(logPath, "a");
  const child = spawn(
    nextBin,
    ["dev", "--turbo", "-H", "127.0.0.1", "-p", String(port)],
    {
      cwd: projectRoot,
      detached: true,
      stdio: ["ignore", logFd, logFd],
    },
  );
  closeSync(logFd);
  child.unref();
  const state = { pid: child.pid, port, owned: true, cwd: projectRoot };
  await writeState(state);
  try {
    await waitForHttp(port, child.pid);
    const info = await inspect(state);
    console.log("launched");
    printReady(info);
  } catch (error) {
    await cleanupOwned(state);
    await rm(statePath, { force: true });
    throw error;
  }
}

async function doctor() {
  const state = readState();
  if (!state?.pid) {
    throw new Error("not-ready no server is recorded. Run launch first.");
  }
  printReady(await inspect(state));
}

async function cleanupOwned(state) {
  if (!state?.owned || !state.pid || !alive(state.pid)) return;
  try {
    process.kill(-state.pid, "SIGTERM");
  } catch {
    try {
      process.kill(state.pid, "SIGTERM");
    } catch {
      // already gone
    }
  }
  const deadline = Date.now() + 5000;
  while (alive(state.pid) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  if (alive(state.pid)) {
    try {
      process.kill(-state.pid, "SIGKILL");
    } catch {
      try {
        process.kill(state.pid, "SIGKILL");
      } catch {
        // already gone
      }
    }
  }
}

async function cleanup() {
  const state = readState();
  if (!state?.pid) {
    console.log("stopped none");
  } else if (!state.owned) {
    console.log(`left-running pid=${state.pid} port=${state.port}`);
  } else {
    await cleanupOwned(state);
    console.log(`stopped pid=${state.pid} port=${state.port}`);
  }
  await rm(statePath, { force: true });
  await rm(logPath, { force: true });
}

function noteId(value) {
  if (!/^[1-9]\d*$/.test(value)) throw new Error("Note id must be a positive integer.");
  const id = Number(value);
  if (!Number.isSafeInteger(id)) throw new Error("Note id is too large.");
  return id;
}

async function noteDelete(rawId) {
  if (!rawId) throw new Error("Usage: note-delete <id>");
  const id = noteId(rawId);
  await loadEnv();
  const userId = await selectedUserId();
  const pool = createPool({
    host: requireEnv("SINGLESTORE_HOST"),
    port: Number(requireEnv("SINGLESTORE_PORT")),
    user: requireEnv("SINGLESTORE_USER"),
    password: requireEnv("SINGLESTORE_PASS"),
    database: requireEnv("SINGLESTORE_DB_NAME"),
    ssl: {},
    connectionLimit: 1,
  });
  try {
    const [rows] = await pool.query(
      `SELECT id, title, owner_id FROM drive_tutorial_notes WHERE id = ?`,
      [id],
    );
    const note = rows[0];
    if (!note) throw new Error("Note not found.");
    if (note.owner_id !== userId) throw new Error("Unauthorized");
    if (typeof note.title !== "string" || !note.title.startsWith("verify-")) {
      throw new Error("Refusing to delete a note whose title does not start with verify-.");
    }
    const [deleted] = await pool.query(
      `DELETE FROM drive_tutorial_notes WHERE id = ? AND owner_id = ? AND title = ?`,
      [id, userId, note.title],
    );
    if (deleted.affectedRows !== 1) throw new Error("Note was not deleted.");
    console.log(`deleted id=${id} title=${note.title}`);
  } finally {
    await pool.end();
  }
}

const [command, argument] = process.argv.slice(2);
const commands = new Map([
  ["launch", () => launch()],
  ["doctor", () => doctor()],
  ["cleanup", () => cleanup()],
  ["note-delete", () => noteDelete(argument)],
]);

if (!commands.has(command)) {
  fail(
    "Usage: node .cursor/skills/verify-memo-drive/scripts/memo-verify.mjs <launch|doctor|cleanup|note-delete>",
  );
} else {
  commands.get(command)().catch((error) => {
    fail(error instanceof Error ? error.message : "Command failed.");
  });
}
