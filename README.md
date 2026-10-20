# MCPLeaderboard

A Hugo-based static website for displaying student performance leaderboards for Embedded and Multicore Systems Programming exercises.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
  - [Step 1: Configure Site Settings](#step-1-configure-site-settings)
  - [Step 2: Customize Homepage Content](#step-2-customize-homepage-content)
  - [Step 3: Create Exercises](#step-3-create-exercises)
  - [Step 4: Integrate Leaderboard Data](#step-4-integrate-leaderboard-data)
- [Creating Exercises](#creating-exercises)
  - [Method 1: Using Hugo Archetype (Recommended)](#method-1-using-hugo-archetype-recommended)
  - [Method 2: Manual Creation](#method-2-manual-creation)
- [MCPGrader Integration](#mcpgrader-integration)
- [Grader Administration](#grader-administration)
- [Leaderboard Data Format](#leaderboard-data-format)
- [Leaderboard Metrics](#leaderboard-metrics)
- [Site Structure](#site-structure)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Overview

MCPLeaderboard is a static website generator built with Hugo that displays student performance on programming exercises. It automatically generates leaderboards from grading results, organizing exercises by technology (CUDA, MPI, OpenMP, etc.).

The system:
1. Receives grading results from [MCPGrader](https://github.com/Fra179/MCPGrader)
2. Organizes exercises by parallel programming technology
3. Displays student rankings based on performance metrics
4. Provides a clean, responsive interface for viewing results

## Features

- **Automated Leaderboard Generation**: Displays rankings from MCPGrader JSON output
- **Technology-Based Organization**: Groups exercises by CUDA, MPI, OpenMP
- **Exercise Templates**: Standardized archetype for consistent exercise pages
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS
- **Performance Metrics**: Runtime-based rankings with average execution times
- **Easy Content Management**: Markdown-based content with Hugo
- **Static Site**: Fast, deployable anywhere (GitHub Pages, Netlify, etc.)

## Installation

1. **Clone this repository**:
   ```bash
   git clone https://github.com/your-org/MCPLeaderboard.git
   cd MCPLeaderboard
   ```

2. **Install Hugo** (extended version recommended):
   ```bash
   # macOS
   brew install hugo
   
   # Linux (Snap)
   snap install hugo
   
   # Or download from: https://gohugo.io/installation/
   ```

3. **Install Node.js dependencies** (for Tailwind CSS):
   ```bash
   npm install
   ```

4. **Run development server**:
   ```bash
   hugo server
   ```
   Visit http://localhost:1313 to view the site.

5. **Build for production**:
   ```bash
   hugo
   ```
   Output will be in the `public/` directory.

## Configuration

### Step 1: Configure Site Settings

Edit `hugo.toml` to customize the site configuration:

```toml
baseURL = 'http://example.org/'
languageCode = 'en-us'
title = 'MCP 2025'  # Website title displayed in navigation

[params]
  teacher_name = "Prof. De Sensi"  # Teacher name shown throughout the site
  recovery_email = "grader@example.org"  # Recipient for secret recovery requests
  leaderboard_source = "file"  # "file" or "api", for all exercise pages
  grader_api_url = "https://grader-api.francescodb.me"  # Grader API base URL

[taxonomies]
  technology = "technology"  # Exercise grouping by technology
```

**Field Explanations:**

- **`baseURL`**: The full URL where your site will be deployed. Update this before production deployment.
- **`title`**: Website name displayed in the browser tab and navigation bar.
- **`teacher_name`**: Instructor name displayed on the site. This appears in the header and footer.
- **`recovery_email`**: Recipient of secret recovery emails. Set this to the actual recovery inbox; the recovery page and sidebar link are omitted when empty or whitespace-only.
- **`leaderboard_source`**: Site-wide data source: `"file"` (default) embeds `data/leaderboard.json` at build time; `"api"` loads current results in the browser.
- **`grader_api_url`**: Grader API base URL, shared by API leaderboards and the submission/admin pages.
- **`technology`**: Taxonomy used to group exercises. Do not modify unless you're adding custom taxonomies.

### Step 2: Customize Homepage Content

The homepage content is defined in `content/_index.md`. This Markdown file contains:

- Course overview and description
- Logistics (schedule, office hours, textbooks)
- Syllabus and technical modules
- Evaluation methods
- Exercise announcements

**To modify the homepage:**

1. Open `content/_index.md`
2. Edit the frontmatter (YAML between `---`):
   ```markdown
   ---
   title: "Embedded and Multicore Systems Programming"
   description: "Course description"
   date: 2025-09-23
   author: "Daniele De Sensi"
   draft: false
   ---
   ```
3. Edit the Markdown content below the frontmatter
4. Save and reload - changes appear immediately in development mode

### Step 3: Create Exercises

See the [Creating Exercises](#creating-exercises) section below for detailed instructions.

### Step 4: Integrate Leaderboard Data

Choose one source for the entire website with `params.leaderboard_source` in `hugo.toml`.

With `leaderboard_source = "file"` (the default), copy the MCPGrader output JSON to `data/leaderboard.json`:

```bash
cp /path/to/grader/leaderboard.json data/leaderboard.json
```

Rebuild and deploy the site to publish file changes. See [MCPGrader Integration](#mcpgrader-integration) for details.

With `leaderboard_source = "api"`, every exercise page fetches
`GET <grader_api_url>/leaderboard?assignment_name=<exercise-folder>` when it opens.
This public endpoint needs no admin key. Results, task choices, charts, and logs
load from the API; no local leaderboard file is required. Active evaluations show
a grading indicator while keeping any previous completed result visible.
Empty results and request failures display a message on the leaderboard tab.

Set the worker's `ALLOWED_ORIGINS` to include the website's origin (for example,
`https://fra179.github.io` or `http://localhost:1313`). API results update on page
reload without rebuilding; changing the site configuration still requires a rebuild.
API mode does not fall back to the local file if a request fails.

## Creating Exercises

### Exercise Structure

Each exercise is a folder under `content/exercises/` containing an `index.md` file. The folder name must match the assignment `name` in the MCPGrader configuration.

### Method 1: Using Hugo Archetype (Recommended)

The project includes an archetype template at `archetypes/exercises.md` that provides a standardized structure:

```bash
hugo new exercises/<exercise-slug>/index.md
```

**Example:**
```bash
hugo new exercises/matrix-multiplication/index.md
```

This creates a new exercise file with:
- Pre-configured frontmatter (title, date, technology)
- Standard sections (description, guidelines, build instructions, evaluation criteria)
- Proper formatting and structure

**After creation:**
1. Open `content/exercises/matrix-multiplication/index.md`
2. Update the frontmatter:
   ```markdown
   ---
   title: "Matrix Multiplication"
   date: 2026-01-03T00:00:00Z
   draft: false
   technology: "cuda"  # Options: cuda, mpi, omp
   github_url: "https://github.com/your-org/your-exercise"  # Optional
   ---
   ```
3. Fill in the exercise content. To display the optional GitHub link, add `{{< githublink >}}` where you want it to appear (for example, below `{{< faqlink >}}`).
4. Set `draft: false` to publish

### Method 2: Manual Creation

Create the exercise folder and file manually:

1. **Create directory**:
   ```bash
   mkdir -p content/exercises/matrix-multiplication
   ```

2. **Create `index.md`** with this template:

````markdown
---
title: "Matrix Multiplication"
date: 2026-01-03T00:00:00Z
draft: false
technology: "cuda"  # Options: cuda, mpi, omp
github_url: "https://github.com/your-org/your-exercise"  # Optional
---

# Exercise Name

{{< faqlink >}}

{{< githublink >}}

## What this program does
Brief description of the program's purpose and learning objectives.

## Files you must NOT edit
- `input/` contents
- `output/` contents  
- `Makefile`
- `test_script.sh`

Only modify the code between the guard comments:
```
// ========================= INIT AREA OF INTEREST =========================
// Your code here
// ========================= END AREA OF INTEREST =========================
```

## Implementation guidelines
- Key implementation points
- Performance considerations
- Common pitfalls to avoid

## Build, clean, and test
- Build: `make target`
- Clean: `make clean`
- Test: `make test`

## Evaluation criteria
- Correctness: All tests must pass
- Performance: Ranked by average execution time
- Code quality: Follows guidelines
````

**Exercise Frontmatter Fields:**

- **`title`** (required): Exercise display name shown on the website
- **`date`** (required): Publication date (ISO 8601 format)
- **`draft`** (required): Set to `false` to publish, `true` to hide
- **`technology`** (required): One of `"cuda"`, `"mpi"`, or `"omp"` - determines grouping on exercise list page
- **`github_url`** (optional): GitHub URL used by the `githublink` shortcode. Omit it or leave it empty to hide the link.

### Adding a GitHub Link

Set `github_url` in the frontmatter of the exercise's `index.md`:

```yaml
github_url: "https://github.com/your-org/your-exercise"
```

Then place `{{< githublink >}}` wherever you want the link in the exercise Markdown, for example below the FAQ:

```markdown
{{< faqlink >}}

{{< githublink >}}
```

The shortcode displays the italic text “View the exercise on GitHub” as a link that opens in a new tab. Setting `github_url` alone does not display the link; the shortcode controls its placement. If the field is missing or empty, the shortcode renders nothing. URLs without a protocol automatically use `https://`.

The `faqlink` and `githublink` shortcodes work independently, so you can use either one on its own.

## MCPGrader Integration

### Overview

MCPLeaderboard is designed to work with [MCPGrader](https://github.com/Fra179/MCPGrader), an automated grading system for GitHub Classroom assignments.

### Workflow

1. **Students submit** assignments via GitHub Classroom
2. **MCPGrader runs** tests and generates `leaderboard.json`
3. **Copy results** to `data/leaderboard.json` in this project
4. **Rebuild site** with `hugo` - leaderboards automatically update

### Naming Convention (Critical)

**The exercise folder name must exactly match the assignment `name` in MCPGrader's YAML configuration.**

**Example:**

MCPGrader configuration (`grader-config.yaml`):
```yaml
assignments:
  - name: vector-sum  # This is the key
    invite_link: "https://classroom.github.com/a/xxxxx"
    test_script_path: "./test_scripts/test_vectorsum.sh"
```

Hugo exercise structure:
```
content/exercises/vector-sum/index.md  # Folder name must match
```

**If names don't match:** The leaderboard will not be displayed on the exercise page.

### Automatic Updates

To keep leaderboards current, set up a script that:
1. Runs MCPGrader periodically (via cron or systemd timer)
2. Copies the output to `data/leaderboard.json`
3. Rebuilds and deploys the Hugo site

**Example update script:**
```bash
#!/bin/bash
# update-leaderboard.sh

cd /path/to/MCPGrader
uv run main.py

cd /path/to/MCPLeaderboard
cp /path/to/MCPGrader/leaderboard.json data/leaderboard.json
hugo
# Deploy public/ to your hosting
```

## Grader administration

Open `admin.html` from the sidebar to manage the grader. The page uses
`params.grader_api_url` from `hugo.toml` by default; you can override the API URL
in the page. The worker must allow the website's origin in `ALLOWED_ORIGINS`.

Upload an ECDSA P-256 private key generated by the grader worker's
`scripts/admin-keys.sh new <name>` and authorize its public key with
`scripts/admin-keys.sh push`. The private key stays in the browser's localStorage;
admin requests use ECDSA signatures. Use HTTPS or localhost for Web Crypto support,
and use **Remove** to clear the saved key on a shared browser.

The page supports listing and filtering by assignment or push time, sorting,
copying deploy private keys, rotating webhook secrets,
deleting individual submissions, and deleting all submissions for an assignment.
Use the separate **Submit your project** page to create submissions.
Deletion and secret rotation require confirmation. It deliberately omits the
worker's consuming `GET /updates` action; use **Pushed after** to inspect recent
pushes without clearing the grader's pending updates.

## Recovering secrets

The **Recovering secrets** sidebar link opens `/recover-secrets/`. Set
`params.recovery_email` in `hugo.toml` to the recovery inbox and rebuild the site.
Edit `content/recover-secrets.md` to add or change Markdown text above the form.
Its YAML front matter defines the page title, layout, and URL; the Markdown below
it supplies the preamble. The sidebar uses that title and URL too. Hugo's content
adapter reads both and creates the page only when the recovery email is configured;
`ignoreFiles` prevents a duplicate page. Rebuild and deploy to apply changes.

Students select an assignment and either the deploy key, webhook secret, or both.
Assignments use the same published exercise list and assignment identifiers as the
submission page. **Send email** opens a Gmail draft addressed to the configured
recipient, with subject `Recover secret` and a JSON body containing
`assignment_name` and `actions`. Deploy keys request `get_public_key`; webhook
secrets request `rotate_webhook_secret`. Selecting both includes both actions.
The email is sent by the student from Gmail. A yellow notice reminds them to use
the same Sapienza email address used for submission. Webhook recovery rotates the
secret, so students must update their repository's webhook settings afterward.

## Leaderboard Data Format

The `data/leaderboard.json` file should contain output directly from MCPGrader:

```json
{
  "exercise-slug": [
    {
      "name": "1234567",
      "commit_hash": "abc1234",
      "status": "graded",
      "error": "",
      "stdout": "Test output...",
      "avg_runtime": 586.76,
      "data": {
        "passed": 12,
        "total": 12,
        "times": [439.79, 662.68, 882.69, ...]
      }
    },
    {
      "name": "7654321",
      "commit_hash": "def5678",
      "status": "error",
      "error": "Compilation failed",
      "stdout": "...",
      "avg_runtime": 0.0,
      "data": null
    }
  ]
}
```

**Field Descriptions:**

- **`name`**: Student ID (matricola) of the submitter
- **`commit_hash`**: Git commit hash (first 7 characters) of the graded submission
- **`status`**: Grading status - `"graded"` (success) or `"error"` (failure)
- **`error`**: Error message if status is `"error"`, empty otherwise
- **`stdout`**: Complete output from the test script execution
- **`avg_runtime`**: Average of all values in `data.times` (milliseconds)
- **`data`**: Parsed JSON from test script (null if tests failed):
  - **`passed`**: Number of tests passed
  - **`total`**: Total number of tests
  - **`times`**: Array of runtime measurements in milliseconds

## Leaderboard Metrics

### Current Implementation

The leaderboard uses **runtime** as the primary ranking metric:

- **Ranking**: Students sorted by `avg_runtime` (lower is better)
- **Units**: Milliseconds (ms)
- **Calculation**: Average of all runtime values from the `times` array
- **Display**: Shows execution times for each test case

### Future Development

**Customizable metrics are work-in-progress (WIP).**

Planned features:
- Custom performance metrics (throughput, memory usage, etc.)
- Weighted scoring across multiple metrics
- Different ranking criteria per exercise
- Configurable display formats (charts, graphs, percentiles)
- Historical performance tracking

## Site Structure

```
MCPLeaderboard/
├── archetypes/
│   ├── default.md            # Default content template
│   └── exercises.md          # Exercise-specific template
├── assets/
│   └── css/
│       └── main.css          # Tailwind CSS styles
├── content/
│   ├── _index.md             # Homepage content
│   └── exercises/            # Exercise pages
│       ├── vector-sum/
│       │   └── index.md
│       └── mpi-pi-calculation/
│           └── index.md
├── data/
│   └── leaderboard.json      # Grading results from MCPGrader
├── layouts/
│   ├── index.html            # Homepage template
│   ├── _default/
│   │   ├── baseof.html       # Base HTML structure
│   │   ├── list.html         # List page template
│   │   └── single.html       # Single page template
│   ├── exercises/
│   │   ├── list.html         # Exercise listing with technology groups
│   │   └── single.html       # Individual exercise page with leaderboard
│   ├── partials/             # Reusable components
│   │   ├── footer.html
│   │   ├── navbar.html
│   │   └── sidebar.html
│   └── shortcodes/           # Components placed in Markdown
│       ├── faqlink.html      # FAQ link
│       └── githublink.html   # Exercise GitHub link
├── public/                   # Generated site (after `hugo` build)
├── resources/                # Hugo's asset cache
├── hugo.toml                 # Hugo configuration
├── package.json              # NPM dependencies
├── postcss.config.js         # PostCSS configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── README.md                 # This file
```

**Key Files:**

- **`hugo.toml`**: Site configuration (title, teacher name, taxonomies)
- **`content/_index.md`**: Homepage markdown content
- **`content/exercises/*/index.md`**: Individual exercise pages
- **`data/leaderboard.json`**: Grading results (from MCPGrader)
- **`layouts/exercises/single.html`**: Template that displays leaderboard tables
- **`layouts/exercises/list.html`**: Template that groups exercises by technology

## Troubleshooting

**Issue: Leaderboard not showing on exercise page**
- Verify the exercise folder name matches the assignment `name` in MCPGrader config exactly
- Check that `data/leaderboard.json` contains data for that exercise name
- Ensure the exercise has `draft: false` in its frontmatter
- Try rebuilding: `hugo server --disableFastRender`

**Issue: Exercise not appearing on exercises list page**
- Check that `draft: false` in the exercise's frontmatter
- Verify the `technology` field is set to `"cuda"`, `"mpi"`, or `"omp"`
- Make sure the file is named `index.md` (not `index.markdown` or other)
- Restart the Hugo server

**Issue: Changes not appearing**
- Hugo caches aggressively - use `hugo server --disableFastRender` during development
- Clear the `resources/` and `public/` directories: `rm -rf resources/ public/`
- Check browser cache - try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

**Issue: Styling not working**
- Ensure Node dependencies are installed: `npm install`
- Verify Tailwind is configured in `tailwind.config.js`
- Check that `assets/css/main.css` imports Tailwind directives
- Rebuild: `hugo --gc`

**Issue: "Error: Unable to locate config file"**
- Ensure you're running Hugo from the project root directory
- Verify `hugo.toml` exists and is valid TOML syntax
- Try running `hugo config` to validate configuration

**Issue: Teacher name or site title not updating**
- Edit `hugo.toml` and save
- Restart `hugo server`
- Check that you're editing the correct field (`title` or `params.teacher_name`)

---

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

Copyright (C) 2026

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

---

## Acknowledgments

Developed for the *Programmazione di Sistemi Embedded e Multicore* course at Università degli Studi di Roma "La Sapienza".
