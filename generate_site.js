#!/usr/bin/env -S deno run --allow-read --allow-write

import { dirname } from "@std/path/dirname";

// directory that contains this script
const MYDIR = dirname(import.meta.url).replace(/^file:\/\//, '')

Array.prototype.to_h = function() { return Object.fromEntries(this) }
Object.prototype.to_a = function() { return Object.entries(this) }
Array.prototype.last = function() { return this[this.length - 1] }

String.prototype.lines = function() {
	const trimmed = this.trim();
	return trimmed ? trimmed.split(/\n+/).map(line => line.trim()) : [];
}

Array.prototype.unsplit = function(sep) {
	return !sep ? this.join('') : this.join(sep)
}

Array.prototype.unlines = function() {
	return this.unsplit('\n')
}

function safe(strings, ...values) {
  // Check if any interpolated value is null, undefined, or missing
  const hasMissingValue = values.some(val => val === null || val === undefined);

  if (hasMissingValue) {
    return '';
  }

  // If all values are valid, reconstruct the full string
  return strings.reduce((result, currentString, index) => {
    return result + currentString + (values[index] ?? '');
  }, '');
}

const assert = (cond, msg) => {
	if (!cond) throw `Assertion failed: ${msg}`
}

if (!Deno.args[0]) {
	throw `Please specify arg: <input file>`
}

// They are not really "pages".. more like "projects".
// { pages }
let { pages } = JSON.parse(await Deno.readTextFile(Deno.args[0]))

for (const page of pages) {
	page.group ??= "films"
}

// (a -> b) => [a] => { b: [a] }
const partition = f => xs => {
	const res = {}
	for (const x of xs) {
		const key = f(x)
		res[key] ??= []
		res[key].push(x)
	}
	return res
}

const projects_by_group = partition(x => x.group)(pages)

const project_by_id = pages.map(x => [x.id, x]).to_h()

const film_ids = `
car-dreams
the-heart-is-an-engine

stories-of-the-sea
guizhou

home-remedies
napa

a-rolling-stone-gathers-no-moss
animus

series-of-experiments
me-and-my-babysitter
`.lines()

const show_ids = `
the-womb-is-an-altar-of-all-the-things-i-miss
the-hand-is-no-ones
`.lines()

// console.log(film_ids.)
const films = film_ids.map(id => project_by_id[id])
const shows = show_ids.map(id => project_by_id[id])
// console.error(films)

const site_template = await Deno.readTextFile(`${MYDIR}/template/TEST.html`)

const makeVideoDisplay = page => {
	const { yt, vimeo, title_display } = page
	if (yt && vimeo) {
		throw `Unexpected both yt and vimeo..: ${page.id}`
	}

	let inner = ''
	if (vimeo) {
		// Unlisted Vimeo video seems to have two parts: video id, unlisted hash.
		// I expect this vimeo variable to have form "videoid/unlistedhash"
		const parts = vimeo.split('/')
		assert(parts.length >= 1, "Vimeo no parts?")
		inner = `<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/${parts[0]}${parts.length > 1 ? `?h=${parts[1]}` : ''}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" referrerpolicy="strict-origin-when-cross-origin" style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>`
	} else if (yt) {
		inner = `<iframe class=film-yt src="https://www.youtube.com/embed/${yt}" title="YouTube player for ${title_display}" frameborder=0 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`
	} else {
		console.error(page.id, "Have none")
	}
	return `<div class="film_video">${inner}</div>`
}

const FULLMONTHS = ['haha', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
	.map(s => s[0].toUpperCase() + s.slice(1))
const date2datedisp = date => {
	if (!date) return ''
	const m = date.match(/(\d{4})\.(\d+)/)
	if (!m) throw `invalid date thing: ${date}`
	const [year, month] = m.slice(1).map(x => +x)
	return `<time>${FULLMONTHS[month]} ${year}</time>`
}

const make_stills_slide = ({ stills }) => `
<div class="stills_slide">
	<div class="stills_wrapper">
		<div class="stills">
			${stills.map(href => `<div class=still><img src="${href}" alt="still"></div>`).join('')}
		</div>
	</div>
</div>
`

const films_content = films.map(project => {
	const { id, stills, four_pics, title_display, date, blocks_html, runtime_display, background } = project
	return `

<div id="film_${id}" class="page filmpage"><div class="content_scrollcontainer">
	<main>
		<h2>${title_display}${safe` | ${runtime_display}`}</h2>

		${safe`<p class="subtitle">${background}</p>`}

		<div class="image-grid">
			${four_pics.map(href => `<div class="img-box"><img src="${href}" alt="Goldfish"></div>`).unlines()}
		</div>

		<div class="summary">${blocks_html}</div>

		${makeVideoDisplay(project)}

	</main>
	</div>
</div>

`
}).unlines()

/*


<section id="${id}" class="film">
<div class="film_description">
	<h1>${title_display}</h1>
	<time>${date2datedisp(date)}</time>
	${blocks_html}
</div>
${makeVideoDisplay(project)}
${make_stills_slide(project)}
</section>

*/

const shows_content = shows.map(project => {
	const { id, stills, title_display, date, blocks_html } = project
	return `
<section id="${id}" class="film">
<div class="film_description">
	<h1>${title_display}</h1>
	<time>${date2datedisp(date)}</time>
	${blocks_html}
</div>
<div class="film_video">
	${makeVideoDisplay(project)}
</div>
${make_stills_slide(project)}
</section>
`
}).join('')

const make_sidebar_content = projects => projects.map(project => {
	const { id, stills, title_display, date, blocks_html } = project
	return `<li><a href="#${id}">${title_display}</a></li>`
}).join('')

const film_menu = films.map(project => {
	const { id, stills, thumb, four_pics, title_display, date, blocks_html, runtime_display, background } = project
	return `
<div>
	<a href="#${id}"><img src="${thumb}" /></a>
	<div><a href="#${id}">${title_display}</a></div>
	${safe`<div>${runtime_display}</div>`}
</div>

`
}).unlines()


const idToGroup = [...films, ...shows].map(({ id, group }) => [id, group]).to_h()

let site_html = `<!DOCTYPE html>
<script>
window.idToGroup = ${JSON.stringify(idToGroup)}
</script>
` +
	site_template
		.replace("<!-- add: film_grid -->", film_menu.lines().unsplit())
		.replace("<!-- add: films -->", films_content.lines().unsplit())

// normalize
site_html = site_html.replaceAll('../../media/docs/stills', '/media/stills')

site_html = site_html.replace(/\/?(media\/stills\/[^'"]+)/g, 'https://jolinnaliarchive.github.io/$1')

// site_html = site_html.replace(/\/?media\/stills\/([^'"]+)/g, '../../media/docs/stills/$1')

console.log(site_html);

