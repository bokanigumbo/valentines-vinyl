# the wall (valentine vinyl)

a pink, heart-covered turntable with a wall of 24 records. click a record and it drops onto the turntable and plays for real, through soundcloud.

## features

- 3d-tilted turntable with a spinning record and a tonearm that swings down when playing
- a wall of 24 clickable album slots
- real audio playback through the soundcloud widget api (not a fake player)
- click a record to load and play it
- play/pause button right on the turntable
- keyboard controls:
  - `space` - play/pause
  - arrow keys - browse the wall
  - `enter` - play whichever record is highlighted
- falling hearts, because valentine's

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

if you get your own soundcloud tracks lined up later, open `script.js` and edit the `TRACKS` array near the top - swap in your own `title`, `artist`, and `track` url for each one. nothing else in the code needs to change.

## real album artwork

each slot's cover art is fetched live from soundcloud's own oembed api - it's the actual artwork the artist uploaded with the track, not anything generated. it loads in a moment after the page opens (starts as a pink gradient, then pops in once fetched). since several slots share the same 9 tracks, the same artwork just repeats across those slots, same as the music does.

## built with

- html
- css (3d transforms for the turntable tilt, css animations for the spin and falling hearts)
- vanilla javascript
- [soundcloud widget api](https://developers.soundcloud.com/docs/api/html5-widget)
- google fonts - poppins and caveat

## running it locally

no build step - just open `index.html` in a browser. needs an internet connection since the soundcloud widget and google fonts both load from the web.
# valentines-vinyl
