// Vercel Serverless Function Entry Point
// This file is required for Vercel to properly route all requests to the Express app

import "dotenv/config";
import app from "../index.js";

// Vercel requires a default export for serverless functions
// The app handles all routing automatically
export default app;
