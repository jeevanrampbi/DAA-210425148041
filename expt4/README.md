# Arun's Route Finder

**DAA Experiment 4 &mdash; Dijkstra's Shortest Path Algorithm**

A small Node.js + Express web app that models a fictional city map for
a person named Arun and finds the shortest route between any two of his
regular locations using **Dijkstra's Algorithm**.

---

## 1. Project purpose

This is a college mini-project for the "Design and Analysis of Algorithms"
(DAA) course, Experiment 4. It demonstrates Dijkstra's shortest-path
algorithm on a small, hand-built weighted graph, wrapped in a simple,
usable dashboard instead of a plain console program.

Arun has six regular locations in his city:

- Home
- Office
- Park
- Cafe
- Clothing Store
- Hospital

These locations are connected by roads, each with a fixed distance
(in km). The app lets you pick a **From** and **To** location and
computes the shortest path between them, on demand, using Dijkstra's
algorithm &mdash; nothing is hardcoded.

## 2. Dijkstra's Algorithm (short explanation)

Dijkstra's algorithm finds the shortest distance from a single source
node to every other node in a weighted graph (with non-negative
weights). It works like this:

1. Set the distance to the start node as `0`, and every other node as
   infinity.
2. Repeatedly pick the unvisited node with the smallest known
   distance.
3. "Relax" all of its neighbours: if going through the current node
   gives a shorter path to a neighbour than what was previously
   known, update that neighbour's distance and remember the current
   node as its predecessor.
4. Mark the current node as visited and repeat until every reachable
   node has been visited.
5. Rebuild the shortest path to any destination by walking backwards
   through the recorded predecessors.

In this project, that logic lives in [`dijkstra.js`](./dijkstra.js)
and is run **server-side**, in plain JavaScript, every time a route is
requested &mdash; the result is never hardcoded or precomputed.

## 3. Tech stack

- **Node.js** &mdash; JavaScript runtime
- **Express** &mdash; minimal web server / routing
- **HTML, CSS, vanilla JavaScript** &mdash; frontend (no frameworks)
- **SVG** &mdash; hand-drawn city map (no map APIs, no images)
- No database, no authentication, no external APIs

## 4. Project structure

```
expt4/
├── server.js          # Express server + API endpoints
├── dijkstra.js         # Dijkstra's algorithm implementation
├── graphData.js         # City map data: nodes (locations) + edges (roads)
├── package.json
├── public/
│   ├── index.html       # Dashboard UI
│   ├── style.css        # Styling (light dashboard theme)
│   └── script.js        # Draws the SVG map, handles clicks, calls the API
└── README.md
```

### How the pieces fit together

- `graphData.js` defines the six locations (with x/y coordinates for
  the SVG map) and the roads between them, each with a distance.
- `dijkstra.js` exports a small, reusable Dijkstra implementation
  (`dijkstra()` to compute distances, `buildPath()` to reconstruct the
  actual route).
- `server.js` is an Express app that:
  - serves the static frontend from `public/`
  - exposes `GET /api/graph` so the frontend can draw the map
  - exposes `POST /api/shortest-path` which runs Dijkstra's algorithm
    for the chosen `from`/`to` pair and returns the path, total
    distance, number of stops, and the individual roads used
- `public/script.js` fetches the graph, draws it as SVG, lets the user
  pick locations (via dropdowns or by clicking nodes on the map), and
  renders the result returned by the API, including highlighting the
  route on the map.

## 5. How to run locally

Requirements: Node.js (v16+ recommended).

```bash
cd expt4
npm install
npm start
```

Then open your browser at:

```
http://localhost:3000
```

## 6. Using the app

1. Pick a **From** location and a **To** location (via the dropdowns,
   or by clicking two different nodes on the map).
2. Click **Find Shortest Route**.
3. The app shows:
   - the route sequence (e.g. `Home → Park → Cafe → Hospital`)
   - the total distance in km
   - the number of stops
   - "Dijkstra's Algorithm" as the method used
   - the individual roads used, each with its distance
   - the route highlighted on the map
4. Click **Reset Route** to clear the selection and start again.

The app also handles a few edge cases:

- **Same source and destination** &mdash; shows a message and a
  one-stop, zero-distance result.
- **Unreachable location** &mdash; shows a clear "no route exists"
  message (not applicable on the default map, since it's fully
  connected, but the check is in place).
- **Empty selections** &mdash; the form won't submit and shows a
  validation message until both a source and destination are chosen.
