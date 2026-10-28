# 65: The favicon in Safari

**What to build:** From the owner's inbox line: "Favicon still not showing in Safari." An earlier fix (2026-10-26) listed the PNG icon last, since Safari takes the last icon listed and does not draw an SVG one; 1.10.0 then added `favicon.ico`. Checked on the live site (2026-10-27): `favicon.ico` is served (200, `image/vnd.microsoft.icon`), but `index.html` lists it first and the SVG last again, so Safari is back to picking the SVG. Safari also keeps its own favicon cache, which a reload does not clear.

**Blocked by:** none

**Status:** to build

- [ ] The ICO (or a PNG) listed after the SVG in `index.html`, with a test that the last `rel="icon"` is not an SVG
- [ ] Confirmed in Safari after the deploy, with Safari's favicon cache cleared (the owner)
