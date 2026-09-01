# the wall (valentine vinyl)

a pink, heart-covered turntable with a wall of 24 records. click a record and it drops onto the turntable and plays for real, through soundcloud.

*(a screenshot or short screen recording goes here - grab one once you've got this running, since it's a genuinely visual project that's worth showing rather than just describing)*

## features

- 3d-tilted turntable with a spinning record and a tonearm that swings down when playing
- a wall of 24 clickable album slots, with artwork for all 9 real tracks loading in concurrently rather than one at a time
- real audio playback through the soundcloud widget api (not a fake player), with a friendly message if a track's been removed, made private, or blocked from embedding
- click a record to load and play it - works even if clicked before soundcloud's widget has finished initialising
- play/pause button right on the turntable
- proper keyboard support: arrow keys move real focus around the wall (not just a visual highlight), enter plays the focused record, space always toggles play/pause
- falling hearts, because valentine's - skipped entirely if your system has reduced motion turned on, along with the record spin and tonearm swing

## about the music

there are 9 real tracks in here, cycled around the 24 wall slots (not 24 unique songs pretending to be real - just being upfront about that). all pulled from a curated creative commons / royalty-free soundcloud playlist:

- Sea Current - Vlad Gluschenko
- Night Level - SODIAC
- Summer Rain - Imperss Music
- Hello World - jiglr
- Kahakai - Scandinavianz
- Destination - MBB
- Ivory - Arc North
- Autumn - IanFever & Almi
- Bae Bae - Rameses B

worth checking these are all still live and embeddable every so often - tracks on soundcloud can be removed, made private, or have embedding disabled by the artist at any time, entirely outside this app's control. if one does go down, the interface now shows "this track is currently unavailable" rather than just sitting there looking broken.

if you get your own soundcloud tracks lined up later, open `script.js` and edit the `TRACKS` array near the top - swap in your own `title`, `artist`, and `track` url for each one. nothing else in the code needs to change.

## real album artwork

each slot's cover art is fetched live from soundcloud's own oembed api - it's the actual artwork the artist uploaded with the track, not anything generated. all 9 requests fire concurrently rather than one after another, so the covers appear as fast as the slowest single request rather than the sum of all nine. since several slots share the same 9 tracks, the same artwork just repeats across those slots, same as the music does.

## built with

- html
- css (3d transforms for the turntable tilt, css animations for the spin and falling hearts, all respecting `prefers-reduced-motion`)
- vanilla javascript
- [soundcloud widget api](https://developers.soundcloud.com/docs/api/html5-widget)
- google fonts - poppins and life savers

## running it locally

no build step - just open `index.html` in a browser. needs an internet connection since the soundcloud widget and google fonts both load from the web.
