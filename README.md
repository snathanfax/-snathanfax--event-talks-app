# BigQuery Release Notes Explorer & Share

A modern, responsive web application built with **Python Flask** and **glassmorphic vanilla HTML/JS/CSS** that aggregates, caches, and filters the latest Google Cloud BigQuery release notes and provides an interactive Tweet composer to share updates on X (Twitter).

---

## ✨ Features

- **Automated RSS Feed Processing**: Fetches the official Google Cloud BigQuery Atom feed and parses entries dynamically by category subheadings (*Feature*, *Changed*, *Deprecated*).
- **Responsive Layout**: Designed with a high-fidelity glassmorphic dark-mode, tailored HSL color indicators, custom interactive controls, and mobile-friendly grids.
- **Smart Caching**: Caches parsed updates inside a local JSON file (`releases_cache.json`) for 1 hour to reduce network overhead and support offline/fallback modes.
- **Dynamic Category Filtering**: Allows instantaneous client-side filtering between Features, Changes, Deprecated, or All updates.
- **Interactive Tweet Composer**: Automatically pre-fills a formatted Tweet preview with emojis and tags, character-tracks against X's 280-character limit, and provides instant X Web Intent sharing.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.13, Flask, `feedparser`, `beautifulsoup4`, `requests`
- **Frontend**: Vanilla HTML5, Vanilla CSS3 (custom variables, keyframes, transitions), Vanilla JavaScript (async fetch, event delegates)
- **Deployment & Versioning**: Git, GitHub

---

## 📂 Project Structure

```text
bq-releases-notes/
├── app.py                # Flask application backend & feed parsing logic
├── requirements.txt      # Python dependencies list
├── .gitignore            # Git exclusion rules
├── templates/
│   └── index.html        # HTML application layout
└── static/
    ├── css/
    │   └── style.css     # CSS styling, animations, and responsive grids
    └── js/
        └── main.js       # Client-side API controls & tweet composition
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8+ (Python 3.13 recommended)

### 1. Clone the repository
```bash
git clone https://github.com/snathanfax/-snathanfax--event-talks-app.git
cd -snathanfax--event-talks-app
```

### 2. Set Up a Virtual Environment & Activate
On Windows:
```powershell
python -m venv venv
.\venv\Scripts\activate
```
On macOS/Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Start the Application
```bash
python app.py
```

Open **[http://127.0.0.1:5000](http://127.0.0.1:5000)** in your web browser to explore and share release updates!

---

## 🎨 Category Color Codes
- 🟢 **Feature** - Emerald/Green (Announcements of new functionalities)
- 🟡 **Changed** - Amber/Orange (Updates to existing mechanisms)
- 🔴 **Deprecated** - Rose/Red (Warnings or upcoming removals of features)
- 🔵 **General** - Indigo/Blue (Default category mappings)
