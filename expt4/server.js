/**
 * server.js
 * -------------------------------------------------
 * Arun's Route Finder - Express backend
 *
 * Responsibilities:
 *   1. Serve the static frontend (HTML/CSS/JS) from /public
 *   2. Provide the city map data via GET /api/graph
 *   3. Compute the shortest route via POST /api/shortest-path
 *      using Dijkstra's algorithm (dijkstra.js)
 * -------------------------------------------------
 */

const express = require("express");
const path = require("path");

const { nodes, edges } = require("./graphData");
const { dijkstra, buildPath } = require("./dijkstra");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Quick lookup of valid node ids
const validNodeIds = new Set(nodes.map((n) => n.id));

// ---- API: return the map data (nodes + roads) ----
app.get("/api/graph", (req, res) => {
  res.json({ nodes, edges });
});

// ---- API: compute the shortest path between two locations ----
app.post("/api/shortest-path", (req, res) => {
  const { from, to } = req.body || {};

  if (!from || !to) {
    return res.status(400).json({
      error: "Please choose both a source and a destination."
    });
  }

  if (!validNodeIds.has(from) || !validNodeIds.has(to)) {
    return res.status(400).json({
      error: "Unknown location selected."
    });
  }

  if (from === to) {
    return res.json({
      from,
      to,
      path: [from],
      totalDistance: 0,
      stops: 1,
      sameLocation: true,
      roadsUsed: [],
      algorithm: "Dijkstra's Algorithm"
    });
  }

  const { distances, previous } = dijkstra(nodes, edges, from);
  const path = buildPath(previous, from, to);

  if (path.length === 0 || distances[to] === Infinity) {
    return res.json({
      from,
      to,
      path: [],
      totalDistance: null,
      stops: 0,
      unreachable: true,
      roadsUsed: [],
      algorithm: "Dijkstra's Algorithm"
    });
  }

  // Work out which individual roads (edges) were used, in order
  const roadsUsed = [];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const edge = edges.find(
      (e) => (e.from === a && e.to === b) || (e.from === b && e.to === a)
    );
    roadsUsed.push({
      from: a,
      to: b,
      weight: edge ? edge.weight : null
    });
  }

  res.json({
    from,
    to,
    path,
    totalDistance: distances[to],
    stops: path.length,
    roadsUsed,
    algorithm: "Dijkstra's Algorithm"
  });
});

app.listen(PORT, () => {
  console.log(`Arun's Route Finder running at http://localhost:${PORT}`);
});
