# Playlist Sortings for IINA

A single [IINA](https://iina.io/) plugin that sorts the current playlist by **filename**, **duration**, or **file size**.

This repository used to ship two separate plugins (`playlist-sort-by-duration` and `playlist-sort-by-filename`). Those are replaced by this unified plugin, which also adds size sorting.

## Features

- **Filename** — alphabetical sort by the visible filename (path ignored), with natural number order (`episode2` before `episode10`)
- **Duration** — shortest or longest first, using Spotlight metadata (`mdls`) and `ffprobe` when available
- **Size** — smallest or largest first, using the local file size
- Available from the global **Plugins → Sort Playlist** menu and the playlist panel context menu
- Keeps the currently playing item playing after the playlist is reordered
- Items without a usable duration or size (streams, remote URLs, missing metadata) are moved to the end

## Requirements

- IINA 1.4.0 or later (plugin system)
- macOS 10.11 or later

Duration sorting works best for local files that Spotlight has indexed. If `ffprobe` is on your `PATH`, it is used as a fallback.

## Installation

### From GitHub (recommended)

1. Open IINA.
2. Choose **Plugins → Manage Plugins…**
3. Click **Install from GitHub**.
4. Enter:

```
https://github.com/dotWee/iina-playlist-sortings
```

### From a release package

1. Download the `.iinaplgz` file from the [Releases](https://github.com/dotWee/iina-playlist-sortings/releases) page.
2. Double-click it, or install it from **Plugins → Manage Plugins… → Install from a local package…**

### From source (development)

```sh
/Applications/IINA.app/Contents/MacOS/iina-plugin link .
```

That creates a `.iinaplugin-dev` symlink in IINA’s plugin folder. Restart IINA after code changes.

To pack a distributable archive:

```sh
/Applications/IINA.app/Contents/MacOS/iina-plugin pack .
```

## Usage

1. Open a playlist with more than one item.
2. Sort from either:
   - **Plugins → Sort Playlist → …**
   - Right-click in the playlist panel and choose a sort action
3. The playlist is rebuilt in the new order. Playback continues on the same file when possible.

## Permissions

The plugin requests:

- **show-osd** — status messages after sorting
- **file-system** — read local file sizes and run `mdls` / `ffprobe` for duration

## Documentation

- [IINA Plugin System](https://iina.io/plugins/)
- [IINA Plugin API](https://docs.iina.io/)
- [Creating Plugins](https://docs.iina.io/pages/creating-plugins.html)
- [Playlist API](https://docs.iina.io/interfaces/IINA.API.Playlist.html)

## License

Copyright (c) 2026 Lukas 'dotWee' Wolfsteiner <lukas@wolfsteiner.media>

Licensed under the Do What The Fuck You Want To Public License. See the [LICENSE](LICENSE) file for details.
