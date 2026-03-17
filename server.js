#!/usr/bin/env node
/**
 * Simple HTTP server for the TikTok Video Summary web interface (index.html).
 *
 * Usage:
 *   npm run serve
 *   # Then open http://localhost:3000 in your browser.
 *
 * The server requires the library to be built first:
 *   npm run build
 */

const http = require("http")
const fs = require("fs")
const path = require("path")

/* ── load the compiled library ── */
let Tiktok
try {
  Tiktok = require("./lib/index.js")
} catch (_) {
  console.error(
    "Could not load ./lib/index.js — please run `npm run build` first."
  )
  process.exit(1)
}

const PORT = process.env.PORT || 3000
const INDEX_HTML = path.join(__dirname, "index.html")

/* ── helpers ── */
function sendJSON(res, statusCode, data) {
  const body = JSON.stringify(data)
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Content-Length": Buffer.byteLength(body)
  })
  res.end(body)
}

function sendError(res, statusCode, message) {
  sendJSON(res, statusCode, { status: "error", message })
}

/* ── request handler ── */
const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url, `http://localhost:${PORT}`)
  const pathname = parsed.pathname
  const query = parsed.searchParams

  /* Serve index.html */
  if (pathname === "/" || pathname === "/index.html") {
    fs.readFile(INDEX_HTML, (err, data) => {
      if (err) {
        res.writeHead(500)
        res.end("Could not read index.html")
        return
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
      res.end(data)
    })
    return
  }

  /* GET /api/user-profile?username=<username> */
  if (pathname === "/api/user-profile") {
    const username = (query.get("username") || "").trim()
    if (!username) {
      sendError(res, 400, "username query parameter is required")
      return
    }
    try {
      const result = await Tiktok.StalkUser(username)
      sendJSON(res, 200, result)
    } catch (err) {
      sendError(res, 500, err.message || "Internal server error")
    }
    return
  }

  /* GET /api/user-videos?username=<username>&limit=<n> */
  if (pathname === "/api/user-videos") {
    const username = (query.get("username") || "").trim()
    if (!username) {
      sendError(res, 400, "username query parameter is required")
      return
    }
    const limit = Math.min(parseInt(query.get("limit"), 10) || 20, 100)
    try {
      const result = await Tiktok.GetUserPosts(username, { postLimit: limit })
      sendJSON(res, 200, result)
    } catch (err) {
      sendError(res, 500, err.message || "Internal server error")
    }
    return
  }

  /* 404 for everything else */
  sendError(res, 404, "Not found")
})

server.listen(PORT, () => {
  console.log(`TikTok Video Summary server running at http://localhost:${PORT}`)
  console.log('Open your browser and enter a TikTok username to see their videos.')
})
