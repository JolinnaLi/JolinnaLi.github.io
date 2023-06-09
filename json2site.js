#!/usr/bin/env -S deno run --allow-write --allow-run

import { readAll } from 'https://deno.land/std@0.177.0/streams/mod.ts'

const FILM_GROUPS = new Set(['narrative', 'experimental'])
const PHOTOGRAPHY_GROUPS = new Set(['photography'])
const SINGLE_GROUPS = new Set(['about'])

Array.prototype.to_h = function() {
	return Object.fromEntries(this)
}

Object.prototype.to_a = function() {
	return Object.entries(this)
}

Object.prototype.vals = function() {
	return Object.values(this)
}

const ENC = new TextEncoder()
const DEC = new TextDecoder()
const pandoc_markdown = async md => {
	const p = Deno.run({ cmd: ['pandoc'], stdout: 'piped', stdin: 'piped' })
	await p.stdin.write(ENC.encode(md))
	await p.stdin.close()
	const out = await p.output()
	p.close();
	return DEC.decode(out)
}

const pages = JSON.parse(new TextDecoder().decode(await readAll(Deno.stdin)))

const counts = xs => {
	const res = {}
	for (const x of xs)
		res[x] = (res[x] ?? 0) + 1
	return res
}

// all groups across all pages
const groups = pages
	.filter(x => x.short !== 'index')
	.map(x => x.group)

const navs = [...new Set(groups)]

// note: *should* keep order?
// `group`s that have more than 2 pages
const cats = counts(groups)
	.to_a()
	.filter(x => x[1] > 1)
	.map(x => x[0])

const page2page = async ({ short, title, content, yt, md, stills, group }) => {
	const html = await pandoc_markdown(content)

	if (FILM_GROUPS.has(group)) { // film page
		const yt_disp = yt
			? `<iframe class=film-yt src="https://www.youtube.com/embed/${yt}" title="YouTube player for ${title}" frameborder=0 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`
			: ''
		const stills_disp = stills.length === 0
			? ''
			: `<div class=stills>${stills.map(src => `<img class=still src='${src}'>`).join('')}</div>`

		return `<div class=film-intro><h2 class=film-title>${title}</h2><div class=film-medium>${md}</div>${html}</div>`
			+ yt_disp + stills_disp
	} else if (PHOTOGRAPHY_GROUPS.has(group)) {
		const stills_disp = stills.length === 0
			? ''
			: `<div class=stills>${stills.map(src => `<img class=still src='${src}'>`).join('')}</div>`

		return `<div class=photography-intro><h2 class=photography-title>${title}</h2>${html}</div>`
			+ stills_disp
	} if (short !== 'index') { // not index
		return `<div><h2>${title}</h2></div>${html}`
	} else {
		return html
	}
}

// normal form for links
const short2path = short => short === 'index'
	? '.' // so you can host in a folder if you want
	: `${short}`

// generate nav for `curr` page
const navstuff = curr => navs.map(g => {
	// special 'About' case -- whole page, not a group
	if (SINGLE_GROUPS.has(g)) {
		const page = pages.find(({ group }) => g === group)
		return `<a short='${page.short}' href='${short2path(page.short)}'${page.short === curr.short ? ' class=current-page' : ''}>${g}</a>` // alert: bad hack
	}

	return `<details group='${g}'${g === curr.group ? ' open' : ''}>
		<summary>${g}</summary>
		<ul>
		${pages.filter(({group}) => g === group)
			.map(({ title, short, md, stills }) => {
				const thumbnail = md
					? `<img class=thumb src='${stills[0]}'>`
					: ''
				return `<li><a short='${short}' class='${curr.short === short ? 'current-page ' : ''}title' href='${short2path(short)}'>${thumbnail}${title}</a>`
			})
			.join('')}
		</ul>
	</details>`
}).join('')

const page2ogdescription = p => {
	const {group} = p
	if (group === 'experimental')
		return `An experimental film by Jolinna Li`
	if (group === 'narrative')
		return `A narrative film by Jolinna Li`
	if (group === 'photography')
		return `A series of photos taken by Jolinna Li`
	else
		throw `page2description error: ${JSON.stringify(p)}`
}

// { ...page, page } => string
const to_html = p => `<!DOCTYPE html>

<head>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-5RJJVBLRBV"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-5RJJVBLRBV');
</script>

<title>${p.short === 'index' ? 'Jolinna Li' : p.title}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta charset="UTF-8">

${!FILM_GROUPS.has(p.group) && !PHOTOGRAPHY_GROUPS.has(p.group) ? `` : `<meta property='og:title' content="${p.title /* NOTE: double quoted */}" />
<meta property='og:description' content="${page2ogdescription(p)}" />
<meta property='og:image' content="https://jolinnali.github.io/${p.stills[0]}" />`}

<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

<link rel=stylesheet href=style.css>
</head>

<body>
	<div id=header>
		<nav>
			<a short=index id=name href=${short2path('index')}${p.short === 'index' ? ' class=current-page' : ''}>Jolinna Li</a>
			${navstuff(p)}
		</nav>
	</div>
	<div id=content${p.short==='index' ? ' class=index-content' : ''}>
		${p.page}
	</div>
</body>
<script>const short_base = '${p.short}'</script>

<script src="./d3.v7.min.js"></script>
<script src="./d3-dispatch@3.js"></script>
<script src="./d3-quadtree@3.js"></script>
<script src="./d3-timer@3.js"></script>
<script src="./d3-force@3.js"></script>
<script src=script.js></script>
`.replace(/^\t+/mg, '').replace(/$\n+/mg, '')

const generated = await Promise.all(
	pages.map(async p => ({...p, page: await page2page(p)}))
)

const dynamic = generated
	.map(({ short, title, page, group }) => [short, { title, page, group }])
	.to_h()

const describe = async (x, y) => {
	await Deno.writeTextFile(x, y)
	return `wrote to ${x} (${y.length} chars)`
}

const output = [
	...await Promise.all(generated.map(p => describe(`docs/${p.short}.html`, to_html(p)))),
	await describe('docs/site.json', JSON.stringify(dynamic)),
]

console.log(output.join('\n'))

console.log('OK')
