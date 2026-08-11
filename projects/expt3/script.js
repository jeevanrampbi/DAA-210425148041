/* ===========================================================
   MyCity Connect — script.js
   DAA Experiment 3: Prim's & Kruskal's Minimum Spanning Tree
   =========================================================== */

/* ---------- 1. Fixed city data ---------- */

// 5 locations placed on a 0-100 (x,y) grid over the map.
const LOCATIONS = [
  { id: 'home',     label: 'Home',            x: 14, y: 18 },
  { id: 'office',   label: 'Office',          x: 84, y: 16 },
  { id: 'park',     label: 'Park',            x: 50, y: 52 },
  { id: 'clothing', label: 'Clothing Store',  x: 18, y: 84 },
  { id: 'cafe',     label: 'Cafe',            x: 82, y: 86 }
];

// Predefined weighted roads between locations (connection cost).
const EDGES = [
  { a: 'home',     b: 'office',   w: 7 },
  { a: 'home',     b: 'park',     w: 5 },
  { a: 'office',   b: 'park',     w: 8 },
  { a: 'office',   b: 'clothing', w: 7 },
  { a: 'park',     b: 'clothing', w: 5 },
  { a: 'park',     b: 'cafe',     w: 6 },
  { a: 'clothing', b: 'cafe',     w: 8 }
];

function locationById(id) {
  return LOCATIONS.find(loc => loc.id === id);
}

/* ---------- 2. Kruskal's algorithm ---------- */
// Sort all edges by weight, add each edge if it does not create a
// cycle (checked with a union-find / disjoint-set structure).

function kruskalMST(edges) {
  const parent = {};
  LOCATIONS.forEach(loc => { parent[loc.id] = loc.id; });

  function find(x) {
    while (parent[x] !== x) x = parent[x];
    return x;
  }
  function union(x, y) {
    const rx = find(x), ry = find(y);
    if (rx === ry) return false; // would create a cycle
    parent[rx] = ry;
    return true;
  }

  const sorted = [...edges].sort((e1, e2) => e1.w - e2.w);
  const mstEdges = [];
  let totalCost = 0;

  for (const edge of sorted) {
    if (union(edge.a, edge.b)) {
      mstEdges.push(edge);
      totalCost += edge.w;
    }
  }

  return { edges: mstEdges, totalCost };
}

/* ---------- 3. Prim's algorithm ---------- */
// Start from one location, and repeatedly add the cheapest edge that
// connects a visited location to an unvisited one.

function primMST(edges, startId) {
  const visited = new Set([startId]);
  const mstEdges = [];
  let totalCost = 0;

  while (visited.size < LOCATIONS.length) {
    let bestEdge = null;

    for (const edge of edges) {
      const aIn = visited.has(edge.a);
      const bIn = visited.has(edge.b);
      if (aIn === bIn) continue; // skip edges inside the tree or fully outside it

      if (bestEdge === null || edge.w < bestEdge.w) {
        bestEdge = edge;
      }
    }

    if (!bestEdge) break; // graph is disconnected (not the case here)

    mstEdges.push(bestEdge);
    totalCost += bestEdge.w;
    visited.add(bestEdge.a);
    visited.add(bestEdge.b);
  }

  return { edges: mstEdges, totalCost };
}

/* ---------- 4. Map rendering ---------- */

const el = {};

function cacheDom() {
  ['mapSvg', 'mapMarkers', 'selectedInfo', 'findBtn', 'resultsBody']
    .forEach(id => el[id] = document.getElementById(id));
}

function edgeKey(edge) {
  return [edge.a, edge.b].sort().join('__');
}

function drawBaseMap() {
  // Roads (all edges, thin/grey) with weight labels.
  let svgHtml = '';
  EDGES.forEach(edge => {
    const p1 = locationById(edge.a);
    const p2 = locationById(edge.b);
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    svgHtml += `<line data-edge="${edgeKey(edge)}" x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}"></line>`;
    svgHtml += `<text data-edge-label="${edgeKey(edge)}" x="${midX}" y="${midY}" text-anchor="middle">${edge.w}</text>`;
  });
  el.mapSvg.innerHTML = svgHtml;

  // Location markers.
  el.mapMarkers.innerHTML = LOCATIONS.map(loc => `
    <button type="button" class="marker" data-id="${loc.id}" style="left:${loc.x}%; top:${loc.y}%;">
      <span class="dot"></span>
      <span class="label">${loc.label}</span>
    </button>
  `).join('');

  document.querySelectorAll('.marker').forEach(btn => {
    btn.addEventListener('click', () => showLocationInfo(btn.dataset.id));
  });
}

function showLocationInfo(id) {
  document.querySelectorAll('.marker').forEach(m => m.classList.toggle('selected', m.dataset.id === id));

  const loc = locationById(id);
  const connections = EDGES
    .filter(e => e.a === id || e.b === id)
    .map(e => {
      const otherId = e.a === id ? e.b : e.a;
      return `<li>${locationById(otherId).label} — ₹${e.w}</li>`;
    })
    .join('');

  el.selectedInfo.innerHTML = `
    <strong>${loc.label}</strong> direct roads:
    <ul class="conn-list">${connections}</ul>
  `;
  el.selectedInfo.hidden = false;
}

function highlightMST(mstEdges) {
  const mstKeys = new Set(mstEdges.map(edgeKey));
  document.querySelectorAll('.map-svg line').forEach(line => {
    line.classList.toggle('mst', mstKeys.has(line.dataset.edge));
  });
  document.querySelectorAll('.map-svg text[data-edge-label]').forEach(text => {
    text.classList.toggle('mst-label', mstKeys.has(text.dataset.edgeLabel));
  });
}

/* ---------- 5. Results rendering ---------- */

function renderResults(kruskal, prim) {
  const sameCost = kruskal.totalCost === prim.totalCost;

  const edgeRows = kruskal.edges.map(e => `
    <div class="edge-row">
      <span class="edge-path">${locationById(e.a).label} — ${locationById(e.b).label}</span>
      <span class="edge-weight">₹${e.w}</span>
    </div>
  `).join('');

  el.resultsBody.innerHTML = `
    <div class="total-cost">
      <div class="label">Minimum Network Cost</div>
      <div class="value">₹${kruskal.totalCost}</div>
    </div>

    <div class="algo-grid">
      <div class="algo-box">
        <div class="algo-name">Kruskal</div>
        <div class="algo-cost">₹${kruskal.totalCost}</div>
      </div>
      <div class="algo-box">
        <div class="algo-name">Prim</div>
        <div class="algo-cost">₹${prim.totalCost}</div>
      </div>
    </div>

    <div class="agree-banner ${sameCost ? 'yes' : 'no'}">
      ${sameCost ? '✓ Both algorithms agree' : '✗ Costs differ — check the edge list'}
    </div>

    <div class="section-label">Selected Roads (MST)</div>
    <div class="edge-list">${edgeRows}</div>
  `;
}

/* ---------- 6. Wire it all together ---------- */

function handleFindNetwork() {
  const kruskal = kruskalMST(EDGES);
  const prim = primMST(EDGES, LOCATIONS[0].id); // start Prim's from Home

  highlightMST(kruskal.edges);
  renderResults(kruskal, prim);
}

function init() {
  cacheDom();
  drawBaseMap();
  el.findBtn.addEventListener('click', handleFindNetwork);
}

document.addEventListener('DOMContentLoaded', init);
