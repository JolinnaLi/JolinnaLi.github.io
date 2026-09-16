

console.log(but_films)
// const pages2section = {
// 	'': 'home',
// 	"#film-1": 'films',
// 	"#film-2": 'films',
// 	'#installations': 'installations',
// 	'#bio': 'bio'
// }
console.log(window.pages2section)
const pages2section = window.idToGroup ?? {}
pages2section[''] = 'home'

console.log(pages2section)


const sections = ['home', ...[...document.querySelectorAll('#sidebar li')]
	.map(e => {
		console.log(e.id)
		if (!e.id.match(/^but_\w+/)) throw `Hmm`
		return e.id.slice(4)
	})]
	.map(sectionName => {
		const content = document.querySelector(`#section_${sectionName}`)
		const but = document.querySelector(`#but_${sectionName}`)
		const sidebar = document.querySelector(`#sidebar_${sectionName}`)
		pages2section[sectionName] = sectionName
		// console.log(content)
		return { content, but, sidebar, sectionName }
	})

let currSection = ''

const showSection = sectionName => {
	for (const section of sections) {
		const shouldDisplay = sectionName === section.sectionName

		if (section.content) section.content.hidden = !shouldDisplay
		if (section.sidebar) section.sidebar.hidden = !shouldDisplay
		if (section.but) section.but.style.textDecoration = shouldDisplay ? 'underline' : 'none'
	}
	currSection = sectionName
}



showSection(pages2section[window.location.hash?.slice(1)] ?? 'home')

for (const section of sections) {
	if (section.but) {
		section.but.onclick = () => {
			console.log(currSection,section.sectionName)
			const newSection = currSection === section.sectionName ? 'home' : section.sectionName
			showSection(newSection)
			const hash = (currSection == 'home' ? '' : `#${currSection}`)
			history.pushState("", document.title, window.location.pathname + window.location.search + hash)
		}
	}
}



const minKey = key => xs => xs.reduce((a, b) => key(a) < key(b) ? a : b)
const maxKey = key => xs => xs.reduce((a, b) => key(a) > key(b) ? a : b)

// { id: overlap ratio } => set of id
const getOverlapping = obj =>
	new Set(Object.entries(obj).filter(([idx, ratio]) => ratio > 0).map(([idx]) => +idx))

/***** header observer ****/

const setup_sidebar = (sidebar_id, content_id, section_class) => {
	const sidebar_links = [...document.querySelectorAll(`#${sidebar_id} a`)]
	const content_root = document.querySelector(`#${content_id}`)

	const overlaps = {}
	const section_overlaps = {}

	const observer = new IntersectionObserver(entries => {
		for (const e of entries) {
			overlaps[e.target.myIndex] = e.intersectionRatio
		}

		const overlapping_header_idxes = getOverlapping(overlaps)
		// const overlapping_indexes = new Set(Object.entries(overlaps).filter(([idx, ratio]) => ratio > 0).map(([idx]) => +idx))
		const chosen_idx = overlapping_header_idxes.size === 0
			? Math.min(...getOverlapping(section_overlaps))
			: Math.min(...overlapping_header_idxes)

		sidebar_links.forEach((e, i) => {
			// console.log(i, overlapping_indexes, overlapping_indexes.has(i))
			e.style.textDecoration = i === chosen_idx ? 'underline' : 'none'
		})
	}, {
		root: content_root,
		rootMargin: "0px",
		scrollMargin: "0px",
		threshold: [0, 0.1, 0.2, 0.3, 0.5],
	})

	// ASSUMES THERE IS ONE h1 FOR EACH THING!
	content_root.querySelectorAll(`.${section_class} h1`).forEach((e, i) => {
		e.myIndex = i
		observer.observe(e)
	})

	const section_observer = new IntersectionObserver(entries => {
		for (const e of entries) {
			section_overlaps[e.target.myIndex] = e.intersectionRatio
		}
	}, {
		root: content_root,
		rootMargin: "0px",
		scrollMargin: "0px",
		threshold: [0, 0.1, 0.2, 0.3, 0.5],
	})

	document.querySelectorAll(`.${section_class}`).forEach((e, i) => {
		e.myIndex = i
		section_observer.observe(e)
	})
}

setup_sidebar('sidebar_films', 'film_list_wrapper', 'film')
// um doesnt really work..
// setup_sidebar('sidebar_shows', 'show_list_wrapper', 'film')


// {
// 	const sidebar_links = [...document.querySelectorAll('#sidebar_films a')]

// 	const overlaps = {}
// 	const section_overlaps = {}

// 	const observer = new IntersectionObserver(entries => {
// 		for (const e of entries) {
// 			overlaps[e.target.myIndex] = e.intersectionRatio
// 		}

// 		const overlapping_header_idxes = getOverlapping(overlaps)
// 		// const overlapping_indexes = new Set(Object.entries(overlaps).filter(([idx, ratio]) => ratio > 0).map(([idx]) => +idx))
// 		const chosen_idx = overlapping_header_idxes.size === 0
// 			? Math.min(...getOverlapping(section_overlaps))
// 			: Math.min(...overlapping_header_idxes)

// 		sidebar_links.forEach((e, i) => {
// 			// console.log(i, overlapping_indexes, overlapping_indexes.has(i))
// 			e.style.textDecoration = i === chosen_idx ? 'underline' : 'none'
// 		})
// 	}, {
// 		root: document.querySelector("#film_list_wrapper"),
// 		rootMargin: "0px",
// 		scrollMargin: "0px",
// 		threshold: [0, 0.1, 0.2, 0.3, 0.5],
// 	})

// 	document.querySelectorAll(".film h1").forEach((e, i) => {
// 		e.myIndex = i
// 		observer.observe(e)
// 	})

// 	const section_observer = new IntersectionObserver(entries => {
// 		for (const e of entries) {
// 			section_overlaps[e.target.myIndex] = e.intersectionRatio
// 		}
// 	}, {
// 		root: document.querySelector("#film_list_wrapper"),
// 		rootMargin: "0px",
// 		scrollMargin: "0px",
// 		threshold: [0, 0.1, 0.2, 0.3, 0.5],
// 	})

// 	document.querySelectorAll(".film").forEach((e, i) => {
// 		e.myIndex = i
// 		section_observer.observe(e)
// 	})
// }

/********************a */

// const lbut_svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")


const lbut_svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
lbut_svg.innerHTML = `<svg viewBox="0 0 1 1" xmlns="http://www.w3.org/2000/svg">
  <polygon points="0,0.5 1,0 1,1" />
</svg>`

const rbut_svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
rbut_svg.innerHTML = `<svg viewBox="0 0 1 1" xmlns="http://www.w3.org/2000/svg">
  <polygon points="0,0 1,0.5 0,1" />
</svg>`

document.querySelectorAll(".stills_slide").forEach(element => {
	// console.log(e)
	const stills_wrapper = element.querySelector('.stills_wrapper')
	const stills = element.querySelector('.stills')
	const imgs = stills.querySelectorAll("img")

	const number_spans = [...imgs].map((e, i) => {
		const span = document.createElement('span')
		span.innerText = `.`
		return span
	})
	const numbers = document.createElement('div')
	numbers.className = 'stills_slide_numbers'
	number_spans.forEach(n => numbers.appendChild(n))

	const lBut = document.createElement('button')
	const rBut = document.createElement('button')
	lBut.className = 'stills_lbut'
	rBut.className = 'stills_rbut'
	lBut.appendChild(lbut_svg.cloneNode(true))
	rBut.appendChild(rbut_svg.cloneNode(true))
	// stills.appendChild(lBut)
	// stills.appendChild(rBut)

	element.insertBefore(lBut, stills_wrapper)
	element.appendChild(rBut)
	element.appendChild(numbers)

	// console.log(imgs)
	const overlaps = {}
	const observer = new IntersectionObserver(entries => {
		for (const e of entries) {
			overlaps[e.target.myIndex] = e.intersectionRatio
		}

		// TODO: support more than 1 in viewport at time with 100%

		const overlapping_indexes = new Set(Object.entries(overlaps).filter(([idx, ratio]) => ratio > 0).map(([idx]) => +idx))
		number_spans.forEach((e, i) => {
			e.style.fontWeight = overlapping_indexes.has(i) ? 'bold' : 'normal'
		})
		// TODO: how to tell the index?
	}, {
		root: stills,
		rootMargin: "0px",
		scrollMargin: "0px",
		threshold: [0, 0.1, 0.2, 0.3, 0.5],
	})

	imgs.forEach((e, i) => {
		e.myIndex = i
		observer.observe(e)
	})

	// Necessary for initial stills that are larger than stills container
	imgs[0].scrollIntoView({block: "nearest", inline: "center"})

	rBut.onclick = e => {
		const overlapping_indexes = new Set(Object.entries(overlaps).filter(([idx, ratio]) => ratio > 0).map(([idx]) => +idx))
		let rightIndex = Math.max(...overlapping_indexes)
		if (overlapping_indexes.size === 1) rightIndex += 1
		if (rightIndex >= imgs.length) return // at the end
		imgs[rightIndex].scrollIntoView({block: "nearest", inline: "center"})


	}
	lBut.onclick = e => {
		const overlapping_indexes = new Set(Object.entries(overlaps).filter(([idx, ratio]) => ratio > 0).map(([idx]) => +idx))
		let leftIndex = Math.min(...overlapping_indexes)
		if (overlapping_indexes.size === 1) leftIndex -= 1
		if (leftIndex < 0) return // at the end
		imgs[leftIndex].scrollIntoView({block: "nearest", inline: "center"})
	}
})

window.onpopstate = e => {
	if (window.location.hash) {
		showSection(pages2section[window.location.hash?.slice(1)] ?? 'home')
		document.querySelector(window.location.hash)?.scrollIntoView()
	}
}