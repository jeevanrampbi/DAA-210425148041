/**
 * dijkstra.js
 * -------------------------------------------------
 * A plain, beginner-friendly implementation of
 * Dijkstra's Shortest Path Algorithm.
 *
 * Given a list of nodes + weighted undirected edges,
 * and a start node, it computes:
 *   - distances: shortest distance from start to every node
 *   - previous:  the previous node on the shortest path
 *                (used to rebuild the actual path later)
 * -------------------------------------------------
 */

function buildAdjacencyList(nodes, edges) {
  const adjacency = {};
  nodes.forEach((node) => {
    adjacency[node.id] = [];
  });

  edges.forEach(({ from, to, weight }) => {
    // graph is undirected -> add the edge both ways
    adjacency[from].push({ node: to, weight });
    adjacency[to].push({ node: from, weight });
  });

  return adjacency;
}

/**
 * Runs Dijkstra's algorithm starting from `startId`.
 * Returns { distances, previous }.
 */
function dijkstra(nodes, edges, startId) {
  const adjacency = buildAdjacencyList(nodes, edges);

  const distances = {};
  const previous = {};
  const visited = new Set();

  // Step 1: initialise all distances as Infinity, start node as 0
  nodes.forEach((node) => {
    distances[node.id] = Infinity;
    previous[node.id] = null;
  });
  distances[startId] = 0;

  // Simple priority "queue" using an array (fine for a small graph)
  const unvisited = new Set(nodes.map((n) => n.id));

  while (unvisited.size > 0) {
    // Step 2: pick the unvisited node with the smallest known distance
    let currentId = null;
    let smallestDistance = Infinity;

    unvisited.forEach((id) => {
      if (distances[id] < smallestDistance) {
        smallestDistance = distances[id];
        currentId = id;
      }
    });

    // No reachable node left -> stop early
    if (currentId === null) break;

    unvisited.delete(currentId);
    visited.add(currentId);

    // Step 3: relax the distance of every neighbour of currentId
    const neighbours = adjacency[currentId] || [];
    neighbours.forEach(({ node: neighbourId, weight }) => {
      if (visited.has(neighbourId)) return;

      const candidateDistance = distances[currentId] + weight;
      if (candidateDistance < distances[neighbourId]) {
        distances[neighbourId] = candidateDistance;
        previous[neighbourId] = currentId;
      }
    });
  }

  return { distances, previous };
}

/**
 * Rebuilds the path from startId to endId using the `previous` map
 * produced by dijkstra(). Returns an array of node ids, e.g.
 * ["home", "park", "cafe", "hospital"], or [] if unreachable.
 */
function buildPath(previous, startId, endId) {
  if (startId === endId) return [startId];

  const path = [];
  let current = endId;

  while (current !== null && current !== undefined) {
    path.unshift(current);
    if (current === startId) break;
    current = previous[current];
  }

  // If we never reached startId, there is no valid path
  if (path[0] !== startId) return [];

  return path;
}

module.exports = { dijkstra, buildPath, buildAdjacencyList };
