const { core, playlist, menu, file, utils, console } = iina;

const ASC = 1;
const DESC = -1;

function basename(path) {
  return path
    .replace(/[?#].*$/, "")
    .split(/[\\/]/)
    .pop();
}

function toLocalPath(filename) {
  if (!filename) {
    return null;
  }
  if (filename.indexOf("file://") === 0) {
    const withoutScheme = filename.replace(/^file:\/\//, "");
    try {
      return decodeURIComponent(withoutScheme);
    } catch (e) {
      return withoutScheme;
    }
  }
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(filename)) {
    return null;
  }
  return filename;
}

function getFileSize(filename) {
  const path = toLocalPath(filename);
  if (!path) {
    return null;
  }
  try {
    if (!file.exists(path)) {
      return null;
    }
    const handle = file.handle(path, "read");
    handle.seekToEnd();
    const size = handle.offset();
    handle.close();
    if (typeof size === "number" && isFinite(size) && size >= 0) {
      return size;
    }
  } catch (e) {
    console.log("Unable to read file size for " + filename + ": " + e);
  }
  return null;
}

async function getDurationSeconds(filename) {
  const path = toLocalPath(filename);
  if (!path) {
    return null;
  }

  try {
    const result = await utils.exec("mdls", [
      "-name",
      "kMDItemDurationSeconds",
      "-raw",
      path,
    ]);
    if (result.status === 0) {
      const value = parseFloat(String(result.stdout).trim());
      if (!isNaN(value) && value > 0) {
        return value;
      }
    }
  } catch (e) {
    console.log("mdls duration lookup failed for " + filename + ": " + e);
  }

  if (utils.fileInPath("ffprobe")) {
    try {
      const result = await utils.exec("ffprobe", [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        path,
      ]);
      if (result.status === 0) {
        const value = parseFloat(String(result.stdout).trim());
        if (!isNaN(value) && value > 0) {
          return value;
        }
      }
    } catch (e) {
      console.log("ffprobe duration lookup failed for " + filename + ": " + e);
    }
  }

  return null;
}

function compareFilename(a, b, direction) {
  return (
    direction *
    basename(a).localeCompare(basename(b), undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );
}

function compareNullableNumber(a, b, direction) {
  const aMissing = a === null || a === undefined;
  const bMissing = b === null || b === undefined;
  if (aMissing && bMissing) {
    return 0;
  }
  if (aMissing) {
    return 1;
  }
  if (bMissing) {
    return -1;
  }
  if (a === b) {
    return 0;
  }
  return a < b ? -direction : direction;
}

function rebuildPlaylist(sortedFilenames) {
  const items = playlist.list();
  const playingPath = items.find((it) => it.isPlaying)?.filename ?? null;

  for (let idx = items.length - 1; idx >= 0; idx--) {
    playlist.remove(idx);
  }
  sortedFilenames.forEach((path, idx) => playlist.add(path, idx));

  if (playingPath) {
    const newIdx = sortedFilenames.indexOf(playingPath);
    if (newIdx !== -1) {
      playlist.play(newIdx);
    }
  }
}

function sortByFilename(direction) {
  const items = playlist.list();
  if (items.length <= 1) {
    core.osd("Nothing to sort");
    return;
  }

  const original = items.map((it) => it.filename);
  const sorted = original.slice().sort((a, b) => compareFilename(a, b, direction));

  if (JSON.stringify(original) === JSON.stringify(sorted)) {
    core.osd("Playlist already sorted by filename");
    return;
  }

  rebuildPlaylist(sorted);
  core.osd(
    direction === ASC
      ? "Playlist sorted by filename (A–Z)"
      : "Playlist sorted by filename (Z–A)"
  );
}

function sortBySize(direction) {
  const items = playlist.list();
  if (items.length <= 1) {
    core.osd("Nothing to sort");
    return;
  }

  const decorated = items.map((it) => ({
    filename: it.filename,
    size: getFileSize(it.filename),
  }));
  const original = decorated.map((it) => it.filename);
  const sorted = decorated
    .slice()
    .sort((a, b) => compareNullableNumber(a.size, b.size, direction))
    .map((it) => it.filename);

  if (JSON.stringify(original) === JSON.stringify(sorted)) {
    core.osd("Playlist already sorted by size");
    return;
  }

  rebuildPlaylist(sorted);
  core.osd(
    direction === ASC
      ? "Playlist sorted by size (smallest first)"
      : "Playlist sorted by size (largest first)"
  );
}

async function sortByDuration(direction) {
  const items = playlist.list();
  if (items.length <= 1) {
    core.osd("Nothing to sort");
    return;
  }

  core.osd("Sorting playlist by duration…");

  const decorated = [];
  for (const it of items) {
    decorated.push({
      filename: it.filename,
      duration: await getDurationSeconds(it.filename),
    });
  }

  const original = decorated.map((it) => it.filename);
  const sorted = decorated
    .slice()
    .sort((a, b) => compareNullableNumber(a.duration, b.duration, direction))
    .map((it) => it.filename);

  if (JSON.stringify(original) === JSON.stringify(sorted)) {
    core.osd("Playlist already sorted by duration");
    return;
  }

  rebuildPlaylist(sorted);
  core.osd(
    direction === ASC
      ? "Playlist sorted by duration (shortest first)"
      : "Playlist sorted by duration (longest first)"
  );
}

function sortMenuItems() {
  return [
    menu.item("Sort by Filename (A–Z)", () => sortByFilename(ASC)),
    menu.item("Sort by Filename (Z–A)", () => sortByFilename(DESC)),
    menu.separator(),
    menu.item("Sort by Duration (shortest first)", () => sortByDuration(ASC)),
    menu.item("Sort by Duration (longest first)", () => sortByDuration(DESC)),
    menu.separator(),
    menu.item("Sort by Size (smallest first)", () => sortBySize(ASC)),
    menu.item("Sort by Size (largest first)", () => sortBySize(DESC)),
  ];
}

const sortMenu = menu.item("Sort Playlist");
sortMenuItems().forEach((item) => sortMenu.addSubMenuItem(item));
menu.addItem(sortMenu);

playlist.registerMenuBuilder(() => sortMenuItems());

console.log("Playlist Sort plugin loaded.");
