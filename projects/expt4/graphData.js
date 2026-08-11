/**
 * graphData.js
 * -------------------------------------------------
 * Static description of Arun's fictional city map.
 * Each node has an id, a display label, and x/y coordinates
 * used purely to draw the SVG map on the client.
 *
 * Each edge is an undirected road between two locations
 * with a fixed "weight" representing distance in km.
 * -------------------------------------------------
 */

const nodes = [
  { id: "home", label: "Home", x: 90, y: 230 },
  { id: "office", label: "Office", x: 300, y: 90 },
  { id: "park", label: "Park", x: 300, y: 370 },
  { id: "cafe", label: "Cafe", x: 480, y: 180 },
  { id: "clothingStore", label: "Clothing Store", x: 480, y: 340 },
  { id: "hospital", label: "Hospital", x: 640, y: 250 }
];

// weight = distance in km between two locations
const edges = [
  { from: "home", to: "office", weight: 5 },
  { from: "home", to: "park", weight: 4 },
  { from: "office", to: "park", weight: 8 },
  { from: "office", to: "cafe", weight: 6 },
  { from: "park", to: "clothingStore", weight: 4 },
  { from: "cafe", to: "clothingStore", weight: 3 },
  { from: "cafe", to: "hospital", weight: 5 },
  { from: "clothingStore", to: "hospital", weight: 3 }
];

module.exports = { nodes, edges };
