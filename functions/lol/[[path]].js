
export async function onRequest({ request }) {
	try {
		const url = new URL(request.url);
		const parts = url.pathname.split('/').filter(Boolean);

		if (parts.length === 0) {
			return new Response(JSON.stringify({ error: 'missing path' }), {
				status: 400,
				headers: defaultHeaders()
			});
		}

		// last segment expected like `163.js` or `163`
		const last = parts[parts.length - 1];
		const id = last.endsWith('.js') ? last.slice(0, -3) : last;
		if (!id) {
			return new Response(JSON.stringify({ error: 'invalid id' }), {
				status: 400,
				headers: defaultHeaders()
			});
		}

		const target = `https://game.gtimg.cn/images/lol/act/img/js/hero/${id}.js`;
		const r = await fetch(target);
		if (!r.ok) {
			return new Response(JSON.stringify({ error: 'upstream fetch failed', status: r.status }), {
				status: 502,
				headers: defaultHeaders()
			});
		}

		const text = await r.text();

		// Try robust JSON extraction (some JS files may include padding)
		let payload = null;
		try {
			payload = JSON.parse(text);
		} catch (e) {
			// attempt to find the first { and last }
			const first = text.indexOf('{');
			const lastBrace = text.lastIndexOf('}');
			if (first !== -1 && lastBrace !== -1 && lastBrace > first) {
				const sub = text.slice(first, lastBrace + 1);
				try {
					payload = JSON.parse(sub);
				} catch (e2) {
					// give up
					return new Response(JSON.stringify({ error: 'invalid upstream JSON' }), {
						status: 502,
						headers: defaultHeaders()
					});
				}
			} else {
				return new Response(JSON.stringify({ error: 'invalid upstream content' }), {
					status: 502,
					headers: defaultHeaders()
				});
			}
		}

		// payload may be the object with `hero` key or already the hero
		const hero = payload && payload.hero ? payload.hero : payload;

			// Convert hero object into an array suitable for Directus autocomplete.
			// The array items include an `id` and `title`, and retain original hero properties.
			const heroObj = hero || {};
			const heroArray = [
				Object.assign({
					id: heroObj.heroId ?? id,
					title: heroObj.name ?? ''
				}, heroObj)
			];

			const result = {
				file: target,
				hero: heroArray
			};

		return new Response(JSON.stringify(result, null, 2), {
			headers: defaultHeaders()
		});
	} catch (err) {
		console.error('lol handler error', err);
		return new Response(JSON.stringify({ error: 'internal error' }), {
			status: 500,
			headers: defaultHeaders()
		});
	}
}

function defaultHeaders() {
	return {
		'Content-Type': 'application/json;charset=UTF-8',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET,OPTIONS',
		'Cache-Control': 's-maxage=3600, stale-while-revalidate=59'
	};
}
