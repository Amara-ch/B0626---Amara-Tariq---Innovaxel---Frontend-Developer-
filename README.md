<div align="center">

# Spendly
### Personal Expense Tracker

*Take-Home Assessment — Innovaxel Summer Internship 2026*

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat-square&logo=chartdotjs&logoColor=white)

</div>

---

## Overview

Spendly is a zero-dependency single-page application for tracking personal expenses. Built with vanilla HTML, CSS, and JavaScript — no frameworks, no build tools, no installation required.

Open `index.html` and it works.

---

## Features

**Core**
- Add, edit, and delete expenses with a polished modal interface
- Fields: Title, Amount, Category, Date, Notes (optional)
- Expense table sorted by date — most recent first
- Delete confirmation to prevent accidental loss

**Summary & Visualization**
- Total spent, transaction count, top spending category
- Interactive category chart — toggle between Doughnut and Bar views
- Category breakdown with progress bars and percentage split

**Bonus**
- Filter by category, date range, or both — with one-click clear
- Input validation — required fields enforced, no zero or negative amounts, inline error messages
- Export filtered data to CSV — respects active filters
- LocalStorage persistence — data survives page refresh and browser close
- Fully responsive — tested at 360px (mobile) and 1440px (desktop)
- Smooth UI — modal animations, row fade-in, toast notifications

---

## Getting Started

No installation needed.

```bash
# Option 1 — just open it
double-click index.html

# Option 2 — local server (recommended)
python3 -m http.server 8080
# then visit http://localhost:8080

# Option 3 — VS Code
# Right-click index.html → Open with Live Server
```

> Chart.js is loaded via CDN — internet connection required on first load.

---

## Project Structure

```
spendly/
├── index.html      # Markup and modal templates
├── style.css       # Styling, CSS variables, responsive breakpoints, animations
├── app.js          # All logic — CRUD, LocalStorage, Chart.js, CSV export, validation
└── README.md
```

Single responsibility per file. No build step, no bundler, no dependencies to manage.

---

## Technical Decisions

| Decision | Rationale |
|---|---|
| Vanilla JS | Demonstrates DOM fundamentals without framework abstractions |
| CSS custom properties | Single source of truth for colors and spacing — easy to theme |
| Event delegation on tbody | One listener handles all dynamically rendered rows efficiently |
| LocalStorage | Client-side persistence without backend complexity |
| Chart.js via CDN | Lightweight, well-documented — no npm required |
| Filter-aware CSV export | Export respects active filters, giving users meaningful data slices |
| Modular render functions | `renderTable()`, `renderSummary()`, `renderChart()` — each owns one concern |

---

## If I Were to Extend This

- **Backend** — FastAPI or Node.js REST API replacing LocalStorage
- **Auth** — JWT-based login, per-user data isolation
- **Budget limits** — monthly caps per category with overspend alerts
- **Recurring expenses** — auto-add on schedule
- **Multi-currency** — with live exchange rate support

---

## Author

**Amara Tariq**  
BS Data Science — PUCIT, University of the Punjab  
[github.com/Amara-ch](https://github.com/Amara-ch)
