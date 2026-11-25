# Passage - Student Exchange Information Portal

CSE326 course project (Problem statement: Student Exchange Information Portal).
Built with plain HTML, CSS and a little JavaScript. No frameworks, no server.

## How to run
1. Unzip the folder.
2. Double-click `index.html` (use Chrome or Edge), or open the folder in VS Code and use Live Server.

> Firefox treats every local file as a separate site, so saved data may not carry
> from page to page there. Use Chrome, Edge or Live Server.

## Features (matches the problem statement)
| Requirement             | Where                                                    |
|-------------------------|----------------------------------------------------------|
| Partner institutions    | Home page table, linked to the programs list             |
| Program details         | `program.html` (about, duration, intake, seats, fees)    |
| Eligibility             | Live CGPA and semester check on `program.html`; "programs I qualify for" filter on `programs.html` |
| Deadlines               | Tear-off stub on every ticket, days left, closed state   |
| Document checklist      | Tick-list with progress bar on `program.html`            |
| Saved programs          | Save button everywhere, `saved.html`, counter in the menu |
| Application status      | Start, submit, withdraw; `applications.html` shows Draft > Submitted > Under review > Decision |
| Student login           | `login.html`: create an account and log in; saved programs and applications belong to each student |
| Admin management        | `admin.html`: add, edit, delete programs, update statuses, reset data |

Students create their own account on the login page (kept only in this browser; passwords are stored as a SHA-256 hash, which is still not real security).

Admin demo login: **admin** / **exchange@123** (demo only; real sites check this on a server).

## Files
- `index.html`, `programs.html`, `program.html`, `saved.html`, `applications.html`, `login.html`, `admin.html` - the pages
- `style.css` - all styling (boarding-pass look, responsive)
- `data.js` - sample programs (all made-up)
- `script.js` - all behaviour, with comments (localStorage, DOM, events, forms)

## Notes
- Data is stored in the browser's localStorage, so it stays on this computer only.
- Fonts (Poppins, Inter) load from Google Fonts when online; the site falls back to system fonts offline.
