#!/usr/bin/env -S deno run --allow-read --allow-write

/* here, we generate site */

const MEDIA_BASE_URL = 'https://jolinnaliarchive.github.io'

Array.prototype.to_h = function() { return Object.fromEntries(this) }
Object.prototype.to_a = function() { return Object.entries(this) }
Array.prototype.last = function() { return this[this.length - 1] }

import { dirname } from "@std/path/dirname";

const MYDIR = dirname(import.meta.url).replace(/^file:\/\//, '')

const inputfile = Deno.args[0]
if (!inputfile) throw `args: <inputfile>`

const assert = (cond, msg) => {
	if (!cond) throw `Assertion failed: ${msg}`
}

const FULLMONTHS = ['haha', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
	.map(x => x[0].toUpperCase()+x.slice(1))
// '2024.2' => whatever html
const date2datedisp = date => {
	const m = date.match(/(\d{4})\.(\d+)/)
	if (!m) throw `invalid date thing: ${date}`
	const [year, month] = m.slice(1).map(x => +x)
	return `<time>${FULLMONTHS[month]} ${year}</time>`
}

const PAGEGEN =
	{ "film": ({ title_display, yt, md_nullable, stills, date, date_display, blocks_html }) => {
		const yt_disp = yt
			? `<iframe class=film-yt src="https://www.youtube.com/embed/${yt}" title="YouTube player for ${title_display}" frameborder=0 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`
			: ''
		const stills_disp = stills.length === 0
			? ''
			: `<div class=stills>${stills.map(src => `<img class=still src='${src}'>`).join('')}</div>`
		const DISPLAY_THE_DATE = date_display ?? (date ? date2datedisp(date) : '')
		const md = md_nullable ?? ''

		return `<div class=film-intro><h2 class=film-title>${title_display}</h2>`
			+ `<div class=film-details><span>${DISPLAY_THE_DATE}</span><span>${md}</span></div>${blocks_html}</div>`
			+ yt_disp + stills_disp
	}
	, "photography": ({ title_display, stills, blocks_html }) => {
		const stills_disp = stills.length === 0
			? ''
			: `<div class=stills>${stills.map(src => `<img class=still src='${src}'>`).join('')}</div>`

		return `<div class=photography-intro><h2 class=photography-title>${title_display}</h2>${blocks_html}</div>`
			+ stills_disp
	}
	, "writing": ({ title_display, id, date_display, writing }) => {
		if (!writing) throw `writing has no writing: ${id}`
		// const writing_content = await pandoc_markdown(writing)
		return `<div class=story>
		<h2>${title_display}</h2>
		<span class=story-date>${date_display}</span>
		<hr>${writing}</div>`
	}
	, "simple": ({title_display, blocks_html}) => `<div><h2>${title_display}</h2></div>${blocks_html}`
	, "raw": ({ blocks_html }) => blocks_html
	}

const page2htmlcontent = p => {
	const gen = PAGEGEN[p.type]

	if (!gen) throw `no generator for page type ${p.type} (${p.id})`

	return gen(p)
}

// normal form for links
const short2path = short => short === 'index'
	? '.' // so you can host in a folder if you want
	: `${short}`

// generate nav for `curr` page
const navstuff = ({ pages, navs }) => curr => navs.map(g => {

}).filter(x => x).join('')

const section2navsection = selected_page => ({ t, name, page, pages }) => {

}

const page2ogdescription = p => {
	const { pagetype, filmtype } = p

	if (pagetype === 'film' && filmtype == 'experimental')
		return `An experimental film by Jolinna Li`
	if (pagetype === 'film' && filmtype == 'narrative')
		return `A narrative film by Jolinna Li`
	if (pagetype === 'photography')
		return `A series of photos taken by Jolinna Li`
	else
		throw `page2description error: ${JSON.stringify(p)}`
}

const page2og = p => !['film', 'photography'].includes(p.pagetype)
	? `` :
	`<meta property='og:title' content="${p.title_display /* NOTE: titles may have single quotes */}" />
<meta property='og:description' content="${page2ogdescription(p)}" />
<meta property='og:image' content="${MEDIA_BASE_URL}/${p.id}/${p.stills[0]}" />`

const navthing2html = id2page => curr_page => ({ t, name, id, ids, filename }) => {

	if (id) assert(id2page[id], `${id} must exist`)
	if (ids) for(const id of ids) assert(id2page[id], `${id} must exist`)

	const group_selected = id === curr_page.id || ids?.includes(curr_page.id)

	if (t === 'name') {
		return `<a short=index id=name href=.${group_selected ? ' class=current-page' : ''}>Jo Li</a>`
	} else if (t === 'page') {
		console.error(id, curr_page.id, group_selected)
		return `<a short='${id}' href='${id}'${group_selected ? ' class=current-page' : ''}>${name}</a>` // alert: bad hack
	} else if (t === 'group') {
		return `<details group='${name}'${group_selected ? ' open' : ''}>
			<summary>${name}</summary>
			<ul>
				${ids.map(id => id2page[id]).map(({ title_sidebar, id: itemid, md, stills }) => {
					const thumbnail = md
						? `<img class=thumb src='${stills[0]}'>`
						: ''
					return `<li><a short='${itemid}' class='${curr_page.id === itemid ? 'current-page ' : ''}title' href='${itemid}'>
						${thumbnail}
						<span group=${name}">${title_sidebar}</span>
					</a>`
				}).join('')}
			</ul>
		</details>`
	} else {
		throw `Unknown navthing: ${t}`
	}
}
const nav2html = id2page => nav => curr_page =>
	`<nav>${nav.map(navthing2html(id2page)(curr_page)).join('')}</nav>`

// { ...page, page } => string
const page2sitehtml = navgen => p => `<!DOCTYPE html>
<head>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-5RJJVBLRBV"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-5RJJVBLRBV');
</script>
<title>${p.title_display}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta charset="UTF-8">
${page2og(p)}
<link rel="icon" type="image/png" sizes="32x32" href="../favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="../favicon-16x16.png">
<link rel=stylesheet href="./style.css">
</head>

<body>
	<div id=header>${navgen(p)}</div>
	<div id=content short=${p.id}>${p.htmlcontent}</div>
</body>
<script>const short_base = '${p.id}'; const path2root = '${p.path2root}'</script>

${ /* scripts */
	["d3.v7.min.js", "d3-dispatch@3.js", "d3-quadtree@3.js", "d3-timer@3.js", "d3-force@3.js", "script.js"]
	.map(src => `<script src="./stuff/${src}"></script>`).join('')
}

`.replace(/^\t+/mg, '').replace(/$\n+/mg, ' ')

const partition = pred => xs => {
	const yes = [], no = []
	for (const x of xs) (pred(x) ? yes : no).push(x)
	return [yes, no]
}

const write_verbose = async (x, y) => {
	await Deno.writeTextFile(x, y)
	console.error(`wrote to ${x} (${y.length} chars)`)
}

const sectionify = pages => group(p => p.group)(pages)
	.to_a()
	.map(([grp, pages]) => {
		if (grp === 'about') {
			if (pages.length !== 1) throw `Must only be one About page!!`
			return { t: 'single', name: grp, page: pages[0] }
		} else {
			return { t: 'group', name: grp, pages }
		}
	})

const pages2sitejson = pages => pages
	.map(({ htmlcontent, title_display, navgroup, id }) => [id, { page: htmlcontent, title_display, navgroup }])
	.to_h()

const { pages: _pages } = JSON.parse(await Deno.readTextFile(inputfile))

import * as YAML from "jsr:@std/yaml";

const nav = YAML.parse(await Deno.readTextFile(`${MYDIR}/nav.yaml`))

_pages.push(
	{ id: 'index'
	, navgroup: 'index'
	, type: 'raw'
	, title_display: 'Jo Li'
	, blocks_html: "<svg id=fun viewbox='-1000,-1000, 2000, 2000'></svg>"
	}
)

for (const { title_display, id, date } of nav.filter(({t}) => t === 'page')) {
	_pages.push(
		{ id
		, group: id
		, navgroup: id
		, title_display
		, title_sidebar: title_display
		, type: 'raw'
		, blocks_html: await Deno.readTextFile(`${MYDIR}/${id}.html`)
		}
	)
}

const pages = _pages.map(_page => {
	const { id } = _page
	const page =
		{ ..._page
		, output_path: id === 'index' ? `${MYDIR}/docs/index.html` : `${MYDIR}/docs/${id}.html`
		// , title_display: _page.title
		}
	page.stills = page?.stills?.map(x => `https://jolinnaliarchive.github.io/${x}`) // used by below line!
	page.htmlcontent = page2htmlcontent(page)
	// console.error(page.stills)
	return page
})

const page_id_lookup = pages.map(page => [page.id, page]).to_h()

for (const { id, ids, name } of nav) {
	const allids = id ? [id] : ids ? ids : []
	for (const id of allids) {
		// console.error(id)
		assert(page_id_lookup[id], `${id} must exist`)
		page_id_lookup[id].navgroup = name
	}
}

for (const page of pages) {
	page.sitehtml = page2sitehtml(nav2html(page_id_lookup)(nav))(page)
	// console.error(page.navgroup)
}

await Promise.all(pages.map(page => write_verbose(page.output_path, page.sitehtml)))

// console.log(pages)


// await Promise.all(pages.map(page =>
// 	write_verbose(`docs/${page.output_path}`, page2sitehtml({ output_dir, sections })(page))
// ))

await write_verbose(`${MYDIR}/docs/site.json`, JSON.stringify(pages2sitejson(pages.filter(page => page.navgroup || page.id === 'index'))))