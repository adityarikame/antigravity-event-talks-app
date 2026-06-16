# BigQuery Release Notes Dashboard & X/Twitter Sharer

A modern, high-fidelity web application built with **Python Flask** and **Vanilla HTML, CSS, and JavaScript** that tracks, filters, and shares the latest Google Cloud BigQuery Release Notes.

## 🚀 Features

*   **Live XML Feed Parser**: Parses the official Google Cloud BigQuery Atom feed (`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`) in real-time.
*   **Granular Update Extraction**: Automatically parses HTML content to separate multiple release notes (e.g. `Feature`, `Issue`, `Deprecation`, `Change`) listed under a single day.
*   **Interactive Dashboard**:
    *   **Live Search**: Instant keypress filtering across dates, tags, and content.
    *   **Category Filtering**: Quick action filter pills to isolate specific update types.
    *   **Sorting**: Sort updates by Newest First, Oldest First, or Grouped by Category.
    *   **Statistical Counters**: View total count updates, features, issues, and deprecations at a glance.
*   **X/Twitter Web Intent Composer**:
    *   Select any individual release note update card to open a custom Tweet Composer.
    *   Choose from pre-defined templates (e.g., *📢 Announcement Alert*, *💡 Feature Spotlight*, *🔗 Tech Link*).
    *   Real-time 280-character limit counter with a dynamic visual progress ring indicator.
    *   One-click X/Twitter sharing opens pre-filled Web Intent drafts in a new tab.
*   **Premium Visual Design**: Dark mode aesthetic with glassmorphism panels, glowing borders, smooth hover animations, custom scrollbars, and shimmery loading skeleton states.

## 🛠️ Tech Stack

*   **Backend**: Python 3, Flask, Beautiful Soup 4, Requests
*   **Frontend**: HTML5, Vanilla CSS3 (Custom properties, CSS Gradients, Flexbox/Grid), Vanilla JavaScript (ES6)

## 📦 Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/adityarikame/antigravity-event-talks-app.git
    cd antigravity-event-talks-app
    ```

2.  **Create & activate virtual environment**:
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate  # On Windows: .venv\Scripts\activate
    ```

3.  **Install dependencies**:
    ```bash
    pip install flask requests beautifulsoup4
    ```

4.  **Run the application**:
    ```bash
    python app.py
    ```

5.  **Access the web app**:
    Open [http://127.0.0.1:5001](http://127.0.0.1:5001) in your browser.

## 📄 License

This project is licensed under the MIT License.
