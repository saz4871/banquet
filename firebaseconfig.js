/* PROTECTED — Firebase client bootstrap.
 * Runtime configuration is intentionally encoded to avoid exposing readable
 * config values in the source file. NOTE: browser Firebase config is not a
 * secret; real protection comes from Firebase Auth/Realtime Database Rules.
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const PROTECTED = "eyJhcGlLZXkiOiJBSXphU3lCRG1qZnNaY1FfY3FIX1NBWEJmZzYtQklBQ2JzX2p0VXciLCJhdXRoRG9tYWluIjoiYmFucXVldC03NDRkMC5maXJlYmFzZWFwcC5jb20iLCJkYXRhYmFzZVVSTCI6Imh0dHBzOi8vYmFucXVldC03NDRkMC1kZWZhdWx0LXJ0ZGIuYXNpYS1zb3V0aGVhc3QxLmZpcmViYXNlZGF0YWJhc2UuYXBwIiwicHJvamVjdElkIjoiYmFucXVldC03NDRkMCIsInN0b3JhZ2VCdWNrZXQiOiJiYW5xdWV0LTc0NGQwLmZpcmViYXNlc3RvcmFnZS5hcHAiLCJtZXNzYWdpbmdTZW5kZXJJZCI6IjY0ODc3Mzg3ODg2MCIsImFwcElkIjoiMTo2NDg3NzM4Nzg4NjA6d2ViOjU0ODBiZTc4MzEyMDk3YzNjYWEwZTkiLCJtZWFzdXJlbWVudElkIjoiRy1RSDgwWEVRSDkwIn0=";
const decodeProtected = (value) => JSON.parse(atob(value));
const app = initializeApp(decodeProtected(PROTECTED));
export const database = getDatabase(app);
export default app;
