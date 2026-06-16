# Word Smart 1 — Picture Flashcards

A private, premium, image-first study website for **Word Smart 1**.

## What this project does
- Shows the **exact original vocabulary images** without OCR replacement or redesign.
- Keeps **true numeric order**.
- Lets you filter by **A to Z**, search quickly, and open any flashcard.
- Supports **New / Learning / Mastered / Weak** progress tracking.
- Includes **Continue Study**, **Focus Study**, **Random Word Review**, and **Weak Word Review**.
- Works well on **desktop and mobile**.

## Current source in this build
- Total flashcards: **794**
- Active letters detected from source: **A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, Z**
- Missing letters in current source: **X, Y**
- Duplicate numeric source detected: **549** (handled safely with internal unique IDs)
- Missing numeric source detected: **728**

## Exact image rule
The original images are kept as the main learning material.
Allowed:
- Fit Screen
- 100%
- Zoom In / Zoom Out
- Open Original Flashcard

Not allowed:
- OCR replacement
- Recoloring
- Overlays on top of the image
- Cropping or stretching
- Changing the actual image quality

## Open the website
Open `index.html` in your browser.

## Folder structure
```text
wordsmart-image-study/
├── index.html
├── style.css
├── script.js
├── data/
│   ├── words.js
│   ├── word_names.json
│   └── word_meanings.json
├── images/
│   └── wordsmart-1/
├── tools/
├── docs/
└── README.md
```

## Progress tracking
Progress is stored in browser localStorage using key `wordsmart-progress-v1`.

## Tools
- `tools/generate_words.py` → regenerate `data/words.js`
- `tools/check_images.py` → scan images and report issues
- `tools/image_report.py` → print a collection summary
