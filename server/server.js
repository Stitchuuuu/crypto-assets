const axios = require('axios')
const fs = require('fs');
const path = require('path')
const { getCoinList, getQuotes } = require('./coinmarket')

const QUOTES_FOLDER = path.join(__dirname, 'data', 'quotes')
const DATA_FOLDER = path.join(__dirname, 'data')

async function isWritable(p) {
	return new Promise(resolve => {
		fs.access(p, fs.constants.W_OK, (err) => {
			resolve(!err)
		})
	})
}

async function updateCurrencies() {
	const data = await getQuotes()
	for (const [symbol, item] of Object.entries(data.quotes)) {
		fs.writeFileSync(path.join(QUOTES_FOLDER, `${symbol}.json`), JSON.stringify(item))
	}
	fs.writeFileSync(path.join(QUOTES_FOLDER, '__data.json'), JSON.stringify({ ...data.$data, currency: data.currency }))
	fs.writeFileSync(path.join(QUOTES_FOLDER, '__all.json'), JSON.stringify({ data: data.list, currency: data.currency }))
}
async function updateCoinList() {
	const data = await getCoinList()
	fs.writeFileSync(path.join(DATA_FOLDER, 'crypto-list.full.json'), JSON.stringify({ data: data.$data, updatedAt: new Date() }))
	fs.writeFileSync(path.join(DATA_FOLDER, 'crypto-list.json'), JSON.stringify({ data: data.list, updatedAt: new Date() }))
}
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

async function trycatchUpdateCurrencies() {
	try {
		console.log(new Date(), 'getting quote currencies...')
		await updateCurrencies()
		console.log(new Date(), 'getting quote currencies... ok !')
	} catch (err) {
		console.log(new Date(), 'getting quote currencies... failed !')
		console.error(new Date(), 'ERROR', err)
	}
}
async function trycatchUpdateCoinList() {
	try {
		console.log(new Date(), 'getting crypto list...')
		await updateCoinList()
		console.log(new Date(), 'getting crypto list... ok !')
	} catch (err) {
		console.log(new Date(), 'getting crypto list... failed !')
		console.error(new Date(), 'ERROR', err)
	}
}

async function main() {
	if (!await isWritable(QUOTES_FOLDER)) {
		console.error(`Allow write access to current user to '${QUOTES_FOLDER}'`)
		process.exit()
	}
	if (!await isWritable(DATA_FOLDER)) {
		console.error(`Allow write access to current user to '${DATA_FOLDER}'`)
		process.exit()
	}
	await trycatchUpdateCoinList()
	await trycatchUpdateCurrencies()
	if (process.env.AUTO_UPDATE) {
		const timeout = parseFloat(process.env.AUTO_UPDATE)
		const intervalListCoins = process.env.AUTO_UPDATE_LIST ? parseFloat(process.env.AUTO_UPDATE_LIST) : 60*4
		setInterval(async() => {
			await trycatchUpdateCoinList()
		}, intervalListCoins * 60 * 1000)
		while (true) {
			await sleep(timeout * 60 * 1000)
			await trycatchUpdateCurrencies()
		}
	}
}
main()