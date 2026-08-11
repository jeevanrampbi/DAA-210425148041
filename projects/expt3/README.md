# MyCity Connect

A minimum-cost network planner for a fictional city belonging to Arun.
Built to demonstrate **Prim's** and **Kruskal's** Minimum Spanning Tree
(MST) algorithms — based on DAA Experiment 3.

## Problem Statement

Arun's city has 5 key locations, each connected to some of the others by
roads with a fixed cost. Building or maintaining every possible road is
wasteful — what's the cheapest set of roads that still keeps every
location reachable from every other one? This is a classic Minimum
Spanning Tree problem, solved here with both Kruskal's and Prim's
algorithms so their results can be compared directly.

## Technologies

HTML, CSS, and vanilla JavaScript only — no frameworks, backend,
database, or external APIs.

## The City

5 fixed locations, shown as clickable markers on a simple CSS map:

1. Home
2. Office
3. Park
4. Clothing Store
5. Cafe

Predefined roads (weights = connection cost):

| Road                        | Cost |
|-----------------------------|------|
| Home – Office                | ₹7  |
| Home – Park                  | ₹5  |
| Office – Park                | ₹8  |
| Office – Clothing Store      | ₹7  |
| Park – Clothing Store        | ₹5  |
| Park – Cafe                  | ₹6  |
| Clothing Store – Cafe        | ₹8  |

## Algorithms

**Kruskal's algorithm** sorts every road by cost and adds each one to
the network as long as it doesn't create a cycle, using a union-find
(disjoint-set) structure to check that quickly.

**Prim's algorithm** starts at one location (Home) and repeatedly adds
the cheapest road that connects a location already in the network to
one that isn't yet.

Both algorithms are guaranteed to produce a spanning tree of the same
minimum total cost, even though they build it in a different order —
the app runs both and shows that they agree.

## Features

- 5 fixed locations shown as clickable markers on a simple map-style
  background (no map API, no external libraries)
- Clicking a marker shows its direct roads and their costs
- All 7 predefined roads are drawn on the map with their cost labelled
- **Find Minimum Network** button runs both Kruskal's and Prim's
  algorithms on the same road data
- The selected MST roads are highlighted directly on the map
- Results panel shows: total minimum network cost, Kruskal's cost,
  Prim's cost, whether they agree, and the full list of selected roads

## What This Project Does NOT Do

- No graph editor — locations and roads are fixed in `script.js`
- No adding/removing nodes or edges from the UI
- No Dijkstra or shortest-path algorithm — this is MST only
- No backend, database, or external map service

## How to Run

No build step or server required. Just open `index.html` in any modern
browser. If you'd rather use a local server:

```bash
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## Files

- `index.html` — page structure
- `style.css` — minimal card-based styling
- `script.js` — city data, Kruskal's & Prim's implementations, UI logic
- `README.md` — this file
