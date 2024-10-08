
const update_pre = _ => {

	const selected = [...document.querySelectorAll('.selected')]
		.map(e => e.getAttribute('fullPath'))

	output.value = JSON.stringify(selected, null, '\t')
}

for (const fig of document.querySelectorAll('.image')) {
	fig.onclick = _ => {
		const cs = fig.classList
		if (cs.contains('selected')) {
			cs.remove('selected')
		} else {
			cs.add('selected')
		}
		update_pre()
	}
}

const update_via_json_str = str => {
	for (const node of document.querySelectorAll('.selected'))
		node.classList.remove('selected')

	try {
		const j = JSON.parse(str)
		for (const fullPath of j) {
			try {
				document.querySelector(`.image[fullPath='${fullPath}']`).classList.add('selected')
			} catch (_) {
				output.value = `could not select image with path="${fullPath}" . oh no!!!!!!!!!!!!!!!!!`
				return
			}
		}
		update_pre()
	} catch(_) {
		output.value = 'something went wrong :).'
	}
}

fetch('../stills.json').then(r => r.text()).then(update_via_json_str)
