// valentine vinyl - the wall
// 24 album slots feeding one turntable, played through the real soundcloud widget api

// ===== real track data =====
// 9 actual creative commons / free-to-use tracks, pulled from a curated
// royalty-free soundcloud playlist. i only have 9 real songs, not 24, so
// they repeat around the wall - that's the honest version of this rather
// than making up 24 fake ones. swap any of these for your own soundcloud
// urls whenever you like, nothing else in the code needs to change.
const TRACKS = [
  { title: "Sea Current", artist: "Vlad Gluschenko", track: "https://soundcloud.com/vgl9/sea-current-free-download" },
  { title: "Night Level", artist: "SODIAC", track: "https://soundcloud.com/sodiacofficial/sodiac-x-zoe-the-duck-night-level" },
  { title: "Summer Rain", artist: "Imperss Music", track: "https://soundcloud.com/imperss/summer-rain-original-mix-2021" },
  { title: "Hello World", artist: "jiglr", track: "https://soundcloud.com/jiglrmusic/hello-world" },
  { title: "Kahakai", artist: "Scandinavianz", track: "https://soundcloud.com/scandinavianz/scandinavianz-lahar-kahakai-free-download" },
  { title: "Destination", artist: "MBB", track: "https://soundcloud.com/mbbofficial/destination" },
  { title: "Ivory", artist: "Arc North", track: "https://soundcloud.com/arcnorth/arc-north-ivory" },
  { title: "Autumn", artist: "IanFever & Almi", track: "https://soundcloud.com/ianfever/ian-fever-almi-autumn" },
  { title: "Bae Bae", artist: "Rameses B", track: "https://soundcloud.com/ramesesb/rameses-b-bae-bae" },
];

// a few pink fallback colours, shown behind each album square until its
// real artwork finishes loading in from soundcloud
const FALLBACK_COLORS = ["#ff8fc0", "#ff4da6", "#e60073", "#ffb6c9"];

// build 24 wall slots by cycling through the 9 real tracks above
const ALBUMS = Array.from({ length: 24 }, (_, i) => {
  const trackIndex = i % TRACKS.length;
  return {
    ...TRACKS[trackIndex],
    trackIndex,
    color: FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  };
});

const COLS = 6; // matches grid-template-columns in style.css

// caches real artwork urls once fetched, keyed by trackIndex, so we only
// ever ask soundcloud for each track's artwork once, not 24 times
const artworkCache = new Map();

// asks soundcloud's oembed endpoint for a track's real, artist-uploaded
// cover art. this is genuine artwork straight from the track itself
async function fetchArtwork(trackIndex) {
  if (artworkCache.has(trackIndex)) return artworkCache.get(trackIndex);

  const trackUrl = TRACKS[trackIndex].track;
  const endpoint = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(trackUrl)}`;

  try {
    const res = await fetch(endpoint);
    const data = await res.json();
    artworkCache.set(trackIndex, data.thumbnail_url || null);
    return data.thumbnail_url || null;
  } catch (err) {
    // if the fetch fails (offline, rate limited, whatever) we just keep
    // the pink gradient fallback - not the end of the world
    console.warn("couldn't load artwork for", trackUrl, err);
    return null;
  }
}

// goes through every unique track used on the wall and fetches its real
// artwork, then paints it onto every slot playing that track.
//
// these 9 requests are independent of each other - there's no reason for
// the second one to wait for the first to finish. the previous version
// awaited each fetchArtwork() call inside a for-loop, which ran them one
// after another; nine sequential round-trips to soundcloud made the covers
// pop in noticeably slower than they needed to. firing them all at once
// with Promise.all and only THEN updating the dom means every cover shows
// up as soon as the slowest single request finishes, not the sum of all nine.
async function loadAllArtwork() {
  const uniqueTrackIndexes = [...new Set(ALBUMS.map((a) => a.trackIndex))];

  const results = await Promise.all(
    uniqueTrackIndexes.map(async (trackIndex) => ({
      trackIndex,
      artworkUrl: await fetchArtwork(trackIndex),
    }))
  );

  results.forEach(({ trackIndex, artworkUrl }) => {
    if (!artworkUrl) return;
    document
      .querySelectorAll(`.album-art[data-track-index="${trackIndex}"]`)
      .forEach((art) => {
        art.style.backgroundImage = `linear-gradient(0deg, rgba(0,0,0,0.35), transparent 40%), url("${artworkUrl}")`;
      });
  });
}

// ===== respecting reduced motion =====
// checked once up front and reused everywhere motion is triggered from js
// (css handles its own animations/transitions directly via the media query
// in style.css - this only covers the handful of things script.js controls:
// whether hearts spawn at all, and whether keyboard browsing scrolls
// smoothly or jumps straight there)
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ===== grab elements =====
const els = {
  wall: document.getElementById("albumWall"),
  record: document.getElementById("record"),
  labelTitle: document.getElementById("labelTitle"),
  labelArtist: document.getElementById("labelArtist"),
  tonearm: document.getElementById("tonearm"),
  playPauseBtn: document.getElementById("playPauseBtn"),
  playPauseIcon: document.getElementById("playPauseIcon"),
  nowPlayingTitle: document.getElementById("nowPlayingTitle"),
  nowPlayingArtist: document.getElementById("nowPlayingArtist"),
  scWidget: document.getElementById("scWidget"),
  heartsLayer: document.getElementById("heartsLayer"),
};

// loadedIndex = the album actually on the turntable right now (or null if none yet)
// highlightIndex = the one the keyboard cursor is sitting on, for browsing with arrow keys
// pendingIndex = an album the user picked before the widget finished loading -
// see loadAlbum() and the READY handler below for why this exists
let loadedIndex = null;
let highlightIndex = 0;
let pendingIndex = null;
let widget = null;
let widgetReady = false;

// ===== build the 24 album slots =====
function buildAlbumWall() {
  ALBUMS.forEach((album, index) => {
    const btn = document.createElement("button");
    btn.className = "album-slot";
    btn.setAttribute("role", "option");
    btn.setAttribute("aria-label", `${album.title} by ${album.artist}`);
    btn.setAttribute("aria-selected", "false");
    // roving tabindex: only the currently-highlighted slot is a tab stop,
    // so tabbing into the wall lands on one predictable button instead of
    // stepping through all 24 individually. updateHighlight() keeps this
    // in sync as the highlight moves.
    btn.tabIndex = index === 0 ? 0 : -1;
    btn.dataset.index = index;

    // starts out as a pink gradient placeholder, then loadAllArtwork()
    // swaps in the track's real cover art once it's fetched
    const art = document.createElement("div");
    art.className = "album-art";
    art.dataset.trackIndex = album.trackIndex;
    art.style.background = `linear-gradient(160deg, ${album.color}, #1a0510)`;

    const title = document.createElement("span");
    title.className = "album-art-title";
    title.textContent = album.title;

    art.appendChild(title);
    btn.appendChild(art);

    btn.addEventListener("click", () => {
      highlightIndex = index;
      updateHighlight();
      loadAlbum(index, true);
    });

    // space is reserved globally for play/pause (see the hint text) - a
    // focused <button> would otherwise treat space as "click me", which
    // would load whatever's highlighted instead of toggling playback,
    // and could fire on top of the global handler too. enter is left
    // alone deliberately: letting the browser's own native activation
    // handle it (which fires the click listener above) means there's
    // only ever one code path that can load an album on enter, not two
    // racing to do the same thing.
    btn.addEventListener("keydown", (e) => {
      if (e.code === "Space") e.preventDefault();
    });

    els.wall.appendChild(btn);
  });
}

// ===== keyboard browsing highlight =====
function updateHighlight() {
  document.querySelectorAll(".album-slot").forEach((slot, i) => {
    const isHighlighted = i === highlightIndex;
    slot.classList.toggle("is-highlighted", isHighlighted);
    // roving tabindex follows the highlight
    slot.tabIndex = isHighlighted ? 0 : -1;
  });
}

// moves the highlight cursor around the grid based on arrow key direction,
// and actually moves real keyboard focus there too - previously this only
// toggled a css class, so a screen reader (or anyone relying on visible
// focus) had no way to tell the highlight had moved at all, since the
// browser's own focus stayed wherever it was.
function moveHighlight(direction) {
  let newIndex = highlightIndex;

  if (direction === "ArrowRight") newIndex = Math.min(highlightIndex + 1, ALBUMS.length - 1);
  if (direction === "ArrowLeft") newIndex = Math.max(highlightIndex - 1, 0);
  if (direction === "ArrowDown") newIndex = Math.min(highlightIndex + COLS, ALBUMS.length - 1);
  if (direction === "ArrowUp") newIndex = Math.max(highlightIndex - COLS, 0);

  highlightIndex = newIndex;
  updateHighlight();

  const slot = document.querySelectorAll(".album-slot")[highlightIndex];
  slot?.focus();
  slot?.scrollIntoView({
    block: "nearest",
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });
}

// ===== loading + playing a record =====
function loadAlbum(index, autoplay) {
  const album = ALBUMS[index];
  loadedIndex = index;
  hideTrackError();

  // update the record label text on the turntable
  els.labelTitle.textContent = album.title;
  els.labelArtist.textContent = album.artist;
  els.record.style.background =
    `repeating-radial-gradient(circle, ${album.color}, ${album.color} 8%, #1a0510 8%, #1a0510 10%)`;

  els.nowPlayingTitle.textContent = album.title;
  els.nowPlayingArtist.textContent = album.artist;

  // mark which slot is "playing" and "selected" visually + for screen readers
  document.querySelectorAll(".album-slot").forEach((slot, i) => {
    slot.classList.toggle("is-playing", i === index);
    slot.setAttribute("aria-selected", i === index ? "true" : "false");
  });

  if (widgetReady) {
    widget.load(album.track, { auto_play: autoplay, show_artwork: false });
  } else {
    // the widget script (loaded from soundcloud's cdn) might not have
    // finished initialising yet, especially on a slow connection. without
    // this, clicking a record before READY fires would update all the
    // visuals above but never actually tell soundcloud to load anything -
    // the interface would look like it worked while silently doing nothing.
    // stashing the choice here means the READY handler below can finish
    // the job the moment the widget's actually ready for it.
    pendingIndex = index;
  }
}

// ===== turning the visuals on/off to match play state =====
function setPlayingVisuals(isPlaying) {
  els.record.classList.toggle("spinning", isPlaying);
  els.tonearm.classList.toggle("playing", isPlaying);
  els.playPauseIcon.textContent = isPlaying ? "⏸" : "▶";
}

// ===== play/pause button + spacebar both call this =====
function togglePlayPause() {
  // nothing loaded yet - start with whatever's currently highlighted
  if (loadedIndex === null) {
    loadAlbum(highlightIndex, true);
    return;
  }

  if (!widgetReady) return;

  widget.isPaused((paused) => {
    if (paused) widget.play();
    else widget.pause();
  });
}

// ===== friendly error messaging when a track won't play =====
// soundcloud tracks can be deleted, made private, or have embedding turned
// off by the artist after the fact - all things entirely outside this app's
// control. previously none of that was handled at all: the interface would
// just sit there looking like nothing was happening, with no way to tell a
// broken track apart from a slow connection.
function showTrackError() {
  els.nowPlayingArtist.textContent = "this track is currently unavailable - try another record";
  els.nowPlayingArtist.classList.add("error");
  setPlayingVisuals(false);
}

function hideTrackError() {
  els.nowPlayingArtist.classList.remove("error");
  if (loadedIndex !== null) {
    els.nowPlayingArtist.textContent = ALBUMS[loadedIndex].artist;
  }
}

// ===== wire up the soundcloud widget once the api script has loaded =====
window.addEventListener("load", () => {
  widget = SC.Widget(els.scWidget);

  widget.bind(SC.Widget.Events.READY, () => {
    widgetReady = true;
    // if someone picked a record before we got here, honour that choice now
    if (pendingIndex !== null) {
      const index = pendingIndex;
      pendingIndex = null;
      loadAlbum(index, true);
    }
  });

  widget.bind(SC.Widget.Events.PLAY, () => setPlayingVisuals(true));
  widget.bind(SC.Widget.Events.PAUSE, () => setPlayingVisuals(false));
  widget.bind(SC.Widget.Events.FINISH, () => setPlayingVisuals(false));
  widget.bind(SC.Widget.Events.ERROR, () => showTrackError());
});

// ===== keyboard controls =====
document.addEventListener("keydown", (e) => {
  // don't hijack space/arrows if the user is typing somewhere (not needed here yet,
  // but good habit in case a search box gets added later)
  const tag = document.activeElement.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;

  if (e.code === "Space") {
    // if a button already has focus, its own native space-handling would
    // otherwise fire alongside this and double up (most visibly: the
    // play/pause button toggling twice, which is the same as not toggling
    // at all). the play/pause button's own click listener already covers
    // space-while-focused-on-it, and album buttons suppress space entirely
    // in their own keydown handler above - so this only needs to run when
    // focus isn't on a button that's already handling it itself.
    if (document.activeElement === els.playPauseBtn) return;
    e.preventDefault(); // stops the page from scrolling down on spacebar
    togglePlayPause();
  } else if (e.key.startsWith("Arrow")) {
    e.preventDefault();
    moveHighlight(e.key);
  }
  // enter is deliberately not handled here - see the comment in
  // buildAlbumWall() on why native button activation covers it instead
});

els.playPauseBtn.addEventListener("click", togglePlayPause);

// ===== falling hearts, purely decorative =====
function createHeart() {
  const heart = document.createElement("div");
  heart.className = "heart";
  heart.style.left = `${Math.random() * 100}vw`;
  heart.style.animationDuration = `${4 + Math.random() * 4}s`;
  els.heartsLayer.appendChild(heart);

  // clean up after itself so we're not leaving thousands of hearts in the dom
  setTimeout(() => heart.remove(), 8000);
}

// skip the hearts entirely under reduced motion, rather than spawning
// elements with a css animation that a stylesheet rule then has to fight
// to suppress
if (!prefersReducedMotion) {
  setInterval(createHeart, 500);
}

// ===== kick things off =====
buildAlbumWall();
updateHighlight();
loadAllArtwork(); // fires off in the background, artwork pops in as each one loads
