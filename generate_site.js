#!/usr/bin/env -S deno run --allow-read --allow-write

import { dirname } from "@std/path/dirname";

// directory that contains this script
const MYDIR = dirname(import.meta.url).replace(/^file:\/\//, '')

Array.prototype.to_h = function() { return Object.fromEntries(this) }
Object.prototype.to_a = function() { return Object.entries(this) }
Array.prototype.last = function() { return this[this.length - 1] }
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
	page.stills = page.stills.map(x => x.replace(/^media/, '/media'))
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
home-remedies
napa
whats-the-hurry
series-of-experiments
guizhou
a-rolling-stone-gathers-no-moss
animus
crows-mouth-film
home-of-rocks
fairytale
me-and-my-babysitter
growing-and-leaving
intro-film
`.trim().split('\n')

const show_ids = `
the-womb-is-an-altar-of-all-the-things-i-miss
the-hand-is-no-ones
`.trim().split('\n')

// console.log(film_ids.)
const films = film_ids.map(id => project_by_id[id])
const shows = show_ids.map(id => project_by_id[id])
// console.error(films)

const site_template = await Deno.readTextFile(`${MYDIR}/template/site.html`)

const makeVideoDisplay = page => {
	return ''
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
	const { id, stills, title_display, date, blocks_html } = project
	return `
<section id="${id}" class="film">
<div class="film_description">
	<h1>${title_display}</h1>
	<time>${date2datedisp(date)}</time>
	${blocks_html}
</div>
${makeVideoDisplay(project)}
${make_stills_slide(project)}
</section>
`
}).join('')

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

const films_sidebar_content = make_sidebar_content(films)
const shows_sidebar_content = make_sidebar_content(shows)

const idToGroup = [...films, ...shows].map(({ id, group }) => [id, group]).to_h()

let site_html = `<!DOCTYPE html>
<script>
window.idToGroup = ${JSON.stringify(idToGroup)}
</script>
` +
	site_template
		.replace("{{films}}", films_content).replace("{{films_sidebar}}", films_sidebar_content)
		.replace("{{shows}}", shows_content).replace("{{shows_sidebar}}", shows_sidebar_content)

site_html = site_html.replace(/\/?(media\/stills\/[^'"]+)/g, 'https://jolinnaliarchive.github.io/$1')

console.log(site_html)
