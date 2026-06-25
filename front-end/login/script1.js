(function () {
	document.addEventListener('DOMContentLoaded', function () {
		const sections = Array.from(document.querySelectorAll('.signup-section'));
		if (!sections.length) return;

		function show(index) {
			sections.forEach((s, i) => {
				s.style.display = i === index ? 'block' : 'none';
			});
			// hide "previous" on first section
			sections.forEach((s, i) => {
				const prevBtns = s.querySelectorAll('.previous');
				prevBtns.forEach(btn => {
					btn.style.display = i === 0 ? 'none' : '';
				});
			});
		}

		function saveSection(idx) {
			const s = sections[idx];
			const data = {};
			const elements = s.querySelectorAll('input, select, textarea');
			elements.forEach(el => {
				if (!el.name && el.id) el.name = el.id;
				const name = el.name || el.id;
				if (!name) return;
				if (el.type === 'file') {
					const files = Array.from(el.files || []).map(f => f.name);
					data[name] = files;
				} else if (el.type === 'checkbox') {
					data[name] = el.checked;
				} else {
					data[name] = el.value;
				}
			});
			const stored = JSON.parse(localStorage.getItem('signup_data') || '{}');
			stored['section_' + idx] = data;
			localStorage.setItem('signup_data', JSON.stringify(stored));
		}

		// click handling for next / previous
		document.addEventListener('click', function (e) {
			const btn = e.target.closest('button');
			if (!btn) return;
			if (btn.classList.contains('next')) {
				e.preventDefault();
				const section = btn.closest('.signup-section');
				const idx = sections.indexOf(section);
				if (idx === -1) return;
				saveSection(idx);
				const nextIdx = idx + 1;
				if (nextIdx < sections.length) show(nextIdx);
			} else if (btn.classList.contains('previous')) {
				e.preventDefault();
				const section = btn.closest('.signup-section');
				const idx = sections.indexOf(section);
				if (idx === -1) return;
				const prevIdx = Math.max(0, idx - 1);
				show(prevIdx);
			}
		}
    );

		show(0);
	});
})();
