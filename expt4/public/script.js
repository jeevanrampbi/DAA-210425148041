/**
 * script.js
 * -------------------------------------------------
 * Frontend logic for Arun's Route Finder.
 *
 * - Fetches the city map (nodes + roads) from the server
 * - Draws it as an SVG diagram
 * - Lets the user pick From/To via dropdowns or by
 *   clicking nodes on the map
 * - Calls the server's Dijkstra API and renders the result
 * -------------------------------------------------
 */

const SVG_NS = "http://www.w3.org/2000/svg";

const state = {
  nodes: [],
  edges: [],
  from: "",
  to: ""
};

const els = {
  map: document.getElementById("city-map"),
  fromSelect: document.getElementById("from-select"),
  toSelect: document.getElementById("to-select"),
  form: document.getElementById("route-form"),
  resetBtn: document.getElementById("reset-btn"),
  message: document.getElementById("form-message"),
  resultsCard: document.getElementById("results-card"),
  resultSequence: document.getElementById("result-sequence"),
  statDistance: document.getElementById("stat-distance"),
  statStops: document.getElementById("stat-stops"),
  statAlgorithm: document.getElementById("stat-algorithm"),
  roadsList: document.getElementById("roads-list")
};

init();

async function init() {
  try {
    const res = await fetch("/api/graph");
    if (!res.ok) throw new Error("Failed to load map data");
    const data = await res.json();

    state.nodes = data.nodes;
    state.edges = data.edges;

    populateSelects();
    drawMap();
  } catch (err) {
    showMessage("Could not load the city map. Please refresh the page.", true);
    console.error(err);
  }

  els.form.addEventListener("submit", onFindRoute);
  els.resetBtn.addEventListener("click", resetRoute);
  els.fromSelect.addEventListener("change", (e) => {
    setSelection("from", e.target.value);
  });
  els.toSelect.addEventListener("change", (e) => {
    setSelection("to", e.target.value);
  });
}

/* ---------------- Dropdowns ---------------- */

function populateSelects() {
  state.nodes.forEach((node) => {
    const optionFrom = document.createElement("option");
    optionFrom.value = node.id;
    optionFrom.textContent = node.label;
    els.fromSelect.appendChild(optionFrom);

    const optionTo = document.createElement("option");
    optionTo.value = node.id;
    optionTo.textContent = node.label;
    els.toSelect.appendChild(optionTo);
  });
}

/* ---------------- Map drawing ---------------- */

function drawMap() {
  els.map.innerHTML = "";

  // Roads first, so nodes sit visually on top
  state.edges.forEach((edge) => {
    drawRoad(edge);
  });

  state.nodes.forEach((node) => {
    drawNode(node);
  });
}

function drawRoad(edge) {
  const fromNode = getNode(edge.from);
  const toNode = getNode(edge.to);
  if (!fromNode || !toNode) return;

  const line = document.createElementNS(SVG_NS, "line");
  line.setAttribute("x1", fromNode.x);
  line.setAttribute("y1", fromNode.y);
  line.setAttribute("x2", toNode.x);
  line.setAttribute("y2", toNode.y);
  line.setAttribute("class", "road-line");
  line.dataset.from = edge.from;
  line.dataset.to = edge.to;
  els.map.appendChild(line);

  const midX = (fromNode.x + toNode.x) / 2;
  const midY = (fromNode.y + toNode.y) / 2;

  const label = document.createElementNS(SVG_NS, "text");
  label.setAttribute("x", midX);
  label.setAttribute("y", midY - 6);
  label.setAttribute("class", "road-weight-label");
  label.setAttribute("text-anchor", "middle");
  label.textContent = `${edge.weight} km`;
  els.map.appendChild(label);
}

function drawNode(node) {
  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("class", "map-node");
  group.dataset.id = node.id;
  group.setAttribute("tabindex", "0");
  group.setAttribute("role", "button");
  group.setAttribute("aria-label", `Select ${node.label}`);

  const circle = document.createElementNS(SVG_NS, "circle");
  circle.setAttribute("cx", node.x);
  circle.setAttribute("cy", node.y);
  circle.setAttribute("r", 20);
  group.appendChild(circle);

  const initials = document.createElementNS(SVG_NS, "text");
  initials.setAttribute("x", node.x);
  initials.setAttribute("y", node.y + 4);
  initials.setAttribute("class", "node-dot-label");
  initials.textContent = getInitials(node.label);
  group.appendChild(initials);

  const label = document.createElementNS(SVG_NS, "text");
  label.setAttribute("x", node.x);
  label.setAttribute("y", node.y - 30);
  label.setAttribute("class", "node-label");
  label.textContent = node.label;
  group.appendChild(label);

  group.addEventListener("click", () => onNodeClick(node.id));
  group.addEventListener("keypress", (e) => {
    if (e.key === "Enter" || e.key === " ") onNodeClick(node.id);
  });

  els.map.appendChild(group);
}

function getInitials(label) {
  return label
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getNode(id) {
  return state.nodes.find((n) => n.id === id);
}

/* ---------------- Selection (dropdowns <-> map clicks) ---------------- */

function onNodeClick(nodeId) {
  // First click sets "from" (or replaces it if both are already set),
  // second click sets "to".
  if (!state.from || (state.from && state.to)) {
    setSelection("from", nodeId);
    setSelection("to", "");
  } else {
    setSelection("to", nodeId);
  }
}

function setSelection(which, value) {
  state[which] = value;
  if (which === "from") els.fromSelect.value = value || "";
  if (which === "to") els.toSelect.value = value || "";
  updateNodeSelectionStyles();
  clearMessage();
}

function updateNodeSelectionStyles() {
  document.querySelectorAll(".map-node").forEach((group) => {
    const id = group.dataset.id;
    group.classList.toggle("is-selected-from", id === state.from);
    group.classList.toggle("is-selected-to", id === state.to);
  });
}

/* ---------------- Find route ---------------- */

async function onFindRoute(e) {
  e.preventDefault();
  clearMessage();

  const from = els.fromSelect.value;
  const to = els.toSelect.value;

  if (!from || !to) {
    showMessage("Please select both a source and a destination.", true);
    return;
  }

  state.from = from;
  state.to = to;
  updateNodeSelectionStyles();

  try {
    const res = await fetch("/api/shortest-path", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to })
    });
    const data = await res.json();

    if (!res.ok) {
      showMessage(data.error || "Something went wrong.", true);
      return;
    }

    if (data.sameLocation) {
      showMessage("Source and destination are the same location.", false);
      renderResult(data);
      return;
    }

    if (data.unreachable) {
      showMessage("No route exists between these two locations.", true);
      clearRouteHighlight();
      els.resultsCard.hidden = true;
      return;
    }

    renderResult(data);
  } catch (err) {
    showMessage("Could not reach the server. Please try again.", true);
    console.error(err);
  }
}

function renderResult(data) {
  els.resultsCard.hidden = false;

  // Route sequence e.g. Home -> Park -> Cafe -> Hospital
  els.resultSequence.innerHTML = "";
  data.path.forEach((nodeId, index) => {
    const nodeEl = document.createElement("span");
    nodeEl.className = "seq-node";
    nodeEl.textContent = getNode(nodeId) ? getNode(nodeId).label : nodeId;
    els.resultSequence.appendChild(nodeEl);

    if (index < data.path.length - 1) {
      const arrow = document.createElement("span");
      arrow.className = "seq-arrow";
      arrow.textContent = "\u2192";
      els.resultSequence.appendChild(arrow);
    }
  });

  els.statDistance.textContent =
    data.totalDistance === 0 ? "0 km" : `${data.totalDistance} km`;
  els.statStops.textContent = data.stops;
  els.statAlgorithm.textContent = data.algorithm || "Dijkstra";

  // Roads used list
  els.roadsList.innerHTML = "";
  if (data.roadsUsed.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No roads needed \u2014 already there.";
    els.roadsList.appendChild(li);
  } else {
    data.roadsUsed.forEach((road) => {
      const li = document.createElement("li");

      const routeText = document.createElement("span");
      routeText.textContent = `${getNode(road.from).label} \u2192 ${getNode(road.to).label}`;

      const weightText = document.createElement("span");
      weightText.className = "road-weight";
      weightText.textContent = `${road.weight} km`;

      li.appendChild(routeText);
      li.appendChild(weightText);
      els.roadsList.appendChild(li);
    });
  }

  highlightRoute(data.path);
}

/* ---------------- Highlighting ---------------- */

function highlightRoute(path) {
  clearRouteHighlight();

  // Highlight nodes on the path
  document.querySelectorAll(".map-node").forEach((group) => {
    if (path.includes(group.dataset.id)) {
      group.classList.add("is-route");
    }
  });

  // Highlight the roads connecting consecutive nodes in the path
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const line = document.querySelector(
      `.road-line[data-from="${a}"][data-to="${b}"], .road-line[data-from="${b}"][data-to="${a}"]`
    );
    if (line) line.classList.add("route-active");
  }
}

function clearRouteHighlight() {
  document.querySelectorAll(".road-line").forEach((line) => {
    line.classList.remove("route-active");
  });
  document.querySelectorAll(".map-node").forEach((group) => {
    group.classList.remove("is-route");
  });
}

/* ---------------- Messages & reset ---------------- */

function showMessage(text, isError) {
  els.message.textContent = text;
  els.message.classList.add("is-visible");
  els.message.style.color = isError ? "var(--danger)" : "var(--text-muted)";
}

function clearMessage() {
  els.message.textContent = "";
  els.message.classList.remove("is-visible");
}

function resetRoute() {
  state.from = "";
  state.to = "";
  els.fromSelect.value = "";
  els.toSelect.value = "";
  els.fromSelect.selectedIndex = 0;
  els.toSelect.selectedIndex = 0;
  clearMessage();
  clearRouteHighlight();
  updateNodeSelectionStyles();
  els.resultsCard.hidden = true;
}
