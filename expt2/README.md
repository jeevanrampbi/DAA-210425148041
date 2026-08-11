# Smart Document Search

An algorithm-powered text search tool built to demonstrate and compare three
classic string-matching algorithms: **Naive Search**, **KMP**, and
**Rabin-Karp**.

## Problem Statement

Searching for a word or phrase inside a large document by hand is slow and
error-prone, and simply calling a built-in `indexOf`/`includes` hides *how*
the search actually works. This project implements the underlying
algorithms from scratch and wraps them in a small web app so the
differences between them — approach, speed, and complexity — can be seen
and compared directly, instead of just read about.

## Objectives

- Implement Naive Search
- Implement KMP (Knuth–Morris–Pratt)
- Implement Rabin-Karp
- Compare the three algorithms on matches found and execution time
- Visualize how each algorithm scans through text, using the same logic
  that produces the actual search results (not a separate fake animation)
- Build a simple, usable web interface around all of the above

## Technologies

HTML, CSS, and vanilla JavaScript only — no frameworks, no backend, no
build step.

## Algorithms

**Naive Search** slides the pattern over the text one position at a time
and compares characters directly. Simple, but it can repeat work when the
text has similar substrings. Worst case: O(n·m).

**KMP** pre-processes the pattern into an LPS ("longest prefix that is
also a suffix") array. When a mismatch happens, the LPS array tells the
algorithm how far it can safely shift the pattern without re-checking
characters it has already matched. Time: O(n + m).

**Rabin-Karp** computes a rolling hash of the pattern and of each
same-sized window of the text. Hashes are cheap to compare, and the hash
for the next window can be computed from the previous one in O(1). A
hash match still triggers a direct character comparison, since two
different strings can occasionally hash to the same value (a collision).
Average case: O(n + m); worst case (many collisions): O(n·m).

## Features

- Paste a document or load one of three built-in sample documents
  (Machine Learning, Space Exploration, Computer Networks)
- Upload a `.txt` file
- Live character and word counts
- Search with Naive Search, KMP, Rabin-Karp, or all three at once
- Match count, match positions, and measured execution time
  (`performance.now()`) per algorithm
- "Compare All" mode highlights the fastest algorithm on that run —
  based on the actual measured time, not a fixed assumption
- Every match highlighted directly in the document, with HTML-safe
  rendering so special characters can't break the page
- Step-by-step visualization of the selected algorithm, built from the
  same trace the search itself produces (play/pause/step controls)
- Case-sensitive toggle (off by default)
- Collapsible "About the Algorithms" reference section
- Complexity comparison table (best / average / worst case)
- Handles edge cases: empty document, empty query, query longer than the
  document, no matches, overlapping matches, regex-special characters in
  the query (treated as literal text, never as a regex), and empty
  uploaded files

## How to Run

No build step or server is required. Just open `index.html` in any
modern browser. If your browser blocks local file access for some
reason, you can also run a simple local server from this folder, e.g.:

```bash
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## Future Improvements

- PDF/DOCX document support
- Search history across sessions
- Larger benchmark datasets for more meaningful timing comparisons
- More advanced, frame-by-frame visualization
- Search suggestions / autocomplete based on document content
