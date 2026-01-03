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

[taxonomies]
  technology = "technology"  # Exercise grouping by technology
```

**Field Explanations:**

- **`baseURL`**: The full URL where your site will be deployed. Update this before production deployment.
- **`title`**: Website name displayed in the browser tab and navigation bar.
- **`teacher_name`**: Instructor name displayed on the site. This appears in the header and footer.
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

Copy the MCPGrader output JSON to `data/leaderboard.json`:

```bash
cp /path/to/grader/leaderboard.json data/leaderboard.json
```

The site will automatically read this file and display leaderboards on exercise pages. See [MCPGrader Integration](#mcpgrader-integration) for details.

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
   ---
   ```
3. Fill in the exercise content
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
---

# Exercise Name

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

## Leaderboard Data Format

The `data/leaderboard.json` file should contain output directly from MCPGrader:

```json
{
  "exercise-slug": [
    {
      "name": "StudentUsername",
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
      "name": "AnotherStudent",
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

- **`name`**: Student name(s) from GitHub Classroom
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
│   └── partials/             # Reusable components
│       ├── footer.html
│       ├── navbar.html
│       └── sidebar.html
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
