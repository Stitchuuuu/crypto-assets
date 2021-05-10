
(() => {
	const isBrowser = !(typeof self === 'undefined')
	const axios = isBrowser ? window.axios : require('axios')
	if (!axios) {
		console.error('axios library is required.')
		return
	}
	if (!process) process = { env: { } }

	async function coinmarketListCoins(options) {
		const opts = {
			key: process.env.CMC_PRO_API_KEY,
			symbols: process.env.SYMBOLS || true,
			currency: process.env.CURRENCY || 'EUR',
			...options
		}
		const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/map'
		if (!opts.key) {
			throw new Error('You must precise the key.')
		}
		const list = []
		let hasMore = true
		let start = 1
		while (hasMore) {
			const data = await axios.get(url, {
				params: {
					limit: 5000,
					start,
				},
				headers: {
					'X-CMC_PRO_API_KEY': opts.key,
				}
			}).then(response => response.data)
			if (!data.data || data.data.length < 5000 || !Array.isArray(data.data)) {
				hasMore = false
			}
			if (!data.data || !Array.isArray(data.data)) continue
			for (const item of data.data) {
				list.push(item)
			}
			start += 5000
		}
		return list
	}
	async function isWritable(p) {
		return new Promise(resolve => {
			fs.access(p, fs.constants.W_OK, (err) => {
				resolve(!err)
			})
		})
	}
	
	async function coinmarketQuotes(options) {
		const opts = {
			key: process.env.CMC_PRO_API_KEY,
			symbols: process.env.SYMBOLS || true,
			currency: process.env.CURRENCY || 'EUR',
			...options
		}
		const url = opts.symbols === true ? 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=5000' : 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest'
		if (!opts.key) {
			throw new Error('You must precise the key.')
		}
		const params = {
			convert: opts.currency,
		}
		if (opts.symbols && opts.symbols !== true) {
			params.symbol = Array.isArray(opts.symbols) ? opts.symbols.join(',') : opts.symbols
		}
		const data = await axios.get(url, {
			params,
			headers: {
				'X-CMC_PRO_API_KEY': opts.key,
			}
		}).then(response => ({ status: response.data.status, data: Object.values(response.data.data) }))
		if (data.status.error_message) {
			throw new Error(data.status.error_message)
		}
		return data
	}
	
	let interval = -1

	/**
	 * Get the last quotes of the desired currencies
	 * 
	 * Options:
	 * - key: CoinMarket API Key
	 * - currency: currency to convert to (EUR, USD, ...)
	 * - symbols: the symbols to search
	 */	
	async function getQuotes(options) {
		const data = await coinmarketQuotes(options)
		const list = []
		const quotes = {}
		const currency = Object.keys(data.data[0].quote)[0]
		for (const c of data.data) {
			const value = c.quote[currency].price
			const item = { value, updatedAt: c.last_updated, name: c.name, symbol: c.symbol }
			quotes[c.symbol] = { currency, value, updatedAt: item.updatedAt }
			list.push(item)
		}
		return {
			$data: data,
			list,
			quotes,
			currency,
		}
	}
	/**
	 * Returns the whole list of crypto available in 
	 * Options:
	 * - key: CoinMarket API Key
	 */
	async function getCoinList(options) {
		const data = await coinmarketListCoins(options)
		return {
			$data: {
				...data,
				updatedAt: new Date(),
			},
			list: data.map(c => ({
				symbol: c.symbol,
				name: c.name,
				slug: c.slug,
			})),
			updatedAt: new Date()
		}
	}
	if (!isBrowser) {
		module.exports = {
			getCoinList,
			getQuotes,
		}
	} else {
		self.$coinmarket = {
			getCoinList,
			getQuotes,
		}
	}
})()
