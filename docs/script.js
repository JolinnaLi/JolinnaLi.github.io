
let menu_buttons = [...document.querySelectorAll('#sidebar li')]
menu_buttons = Object.fromEntries(menu_buttons.map(p => [p.id.match(/(but)_(.+)/)?.[2], p]))

let pages = [...document.querySelectorAll('#content > .page')]
pages = pages.map(p => {
	const pageName = p.id.match(/(page|film|installation)_(.+)/)?.[2]

	const menu_button_key =
		p.id.startsWith('film')
		? 'films'
		: p.id.startsWith('installation')
		? 'installation'
		: pageName

	const button = menu_buttons[menu_button_key]

	const h2_title = p.querySelector('h2')?.innerText?.split('|')?.[0]?.trim()
	const pageTitle = menu_button_key === 'home'
		? 'Jolinna Yuan Li'
		: `Jolinna Yuan Li | ${h2_title ?? menu_button_key}`

	return { pageName, button, pageTitle, element: p}
})

/** */

let currBox = null

function makeContentFromBox(box)
{
	const origMedia = box.querySelector('img') ?? box.querySelector('video');
	const media = origMedia.cloneNode()

	const mediaContainer = document.createElement('div');
	mediaContainer.id = "overlay-media-container"
	mediaContainer.appendChild(media)

	// 2. Create the centered content div
	const content = document.createElement('div');
	content.id = 'overlay-content'
	content.appendChild(mediaContainer)

	// 3. Prevent clicks on the content from closing the overlay (optional)
	content.onclick = (e) => e.stopPropagation();
	return content
}

document.querySelectorAll('.img-box').forEach(box => box.onclick = e => {
	console.log(box, e.target, e)
	if (!(e.target.matches('.box') || e.target.matches('img'))) {
		return
	}

	const overlay = document.createElement('div');
	overlay.id = 'overlay'

	// // Apply styles to the overlay
	// Object.assign(overlay.style, {
	// 	position: 'fixed',
	// 	top: '0',
	// 	left: '0',
	// 	width: '100vw',
	// 	height: '100vh',
	// 	backgroundColor: 'rgba(0, 0, 0, 0.6)', // 50% opacity black
	// 	display: 'flex',
	// 	justifyContent: 'center',
	// 	alignItems: 'center',
	// 	zIndex: '9999', // Ensure it sits on top of everything
	// });

	content = makeContentFromBox(box)
	currBox = box

	// 4. Close the overlay when clicking the background
	overlay.onclick = () => {
		document.body.removeChild(overlay);
		currBox = null
	}

	// 5. Assemble and add to the DOM
	overlay.appendChild(content);

	document.body.appendChild(overlay);
})


/******************** */

let currPage = ''

const showPage = pageName => {
	console.log("Show ", pageName)
	pages.filter(p => p.pageName != pageName).forEach(page => {
		if (page.element) page.element.hidden = true
		if (page.button) page.button.className = ''
	})

	pages.filter(p => p.pageName == pageName).forEach(page => {
		if (page.element) page.element.hidden = false
		if (page.button) page.button.className = 'selected-side'

		if (page.pageTitle) {
			document.title = page.pageTitle
		}
	})

	currPage = pageName
}

showPage(window.location.hash ? window.location.hash.slice(1) : 'home')

const switchToPage = butName => {
	const oldPage = currPage
	const newPage = currPage === butName ? 'home' : butName
	showPage(newPage)

	if (oldPage !== newPage) {
		const hash = (currPage == 'home' ? '' : `#${currPage}`)
		history.pushState("", document.title, window.location.pathname + window.location.search + hash)
	}
}

for (const [butName, but] of Object.entries(menu_buttons)) {
	but.onclick = () => switchToPage(butName)
}

namebut.onclick = _ => switchToPage('home')

window.onpopstate = e => {
	showPage(window.location.hash?.slice(1) ?? 'home')
}