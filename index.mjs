"use strict";
import fetch from 'node-fetch';

const bookPollingInterval = 1000; //1 second
const feePollingInterval = 1000 * 60 * 60; //1 hour

async function kraken() {
	let result = await (await fetch('https://api.kraken.com/0/public/Depth?pair=XBTUSD')).json();
	return {
		name: 'kraken',
		bids: result.result.XXBTZUSD.bids,
		asks: result.result.XXBTZUSD.asks
	};
}

async function kraken_fees() {
	let result = await (await fetch('https://api.kraken.com/0/public/AssetPairs?pair=XXBTZUSD')).json();
	return Number(result.result.XXBTZUSD.fees[0][1]);
}

async function ftx() {
	let result = await (await fetch('https://ftx.com/api/markets/btc_usd/orderbook')).json();
	return {
		name: 'ftx', 
		bids: result.result.bids,
		asks: result.result.asks
	};
}

async function ftx_fees() {
	//todo: actual authenticated API call
	return 0.15;
}

async function binance() {
	let result = await (await fetch('https://api.binance.com/api/v3/depth?symbol=BTCUSDT')).json();
	return {
		name: 'binance',
		bids: result.bids,
		asks: result.asks
	};
}

async function binance_fees() {
	//todo: actual authenticated API call
	return 0.29
}

async function coinbase() {
	let result = await (await fetch('https://api-public.sandbox.pro.coinbase.com/products/BTC-USD/book?level=2')).json();
	return {
		name: 'coinbase',
		bids: result.bids,
		asks: result.asks
	};
}

async function coinbase_fees() {
	//todo: actual authenticated API call
	return 0.22;
}

function best(books) {
	let bestBid = {name: books[0].name, price: Number(books[0].bids[0][0]), amount: Number(books[0].bids[0][1])};
	let bestAsk = {name: books[0].name, price: Number(books[0].asks[0][0]), amount: Number(books[0].asks[0][1])};
	for(let i = 1; i < books.length; ++i) {
		let bidPrice = Number(books[i].bids[0][0]);
		if(bidPrice > bestBid.price) {
			bestBid = {name: books[i].name, price: bidPrice, amount: Number(books[0].bids[0][1])};
		}
		let askPrice = Number(books[i].asks[0][0]);
		if(askPrice < bestAsk.price) {
			bestAsk = {name: books[i].name, price: askPrice, amount: Number(books[0].asks[0][1])};
		}
	}
	return [bestBid, bestAsk];
}

async function placeMarketOrder(amount, where, type) {
	console.log(amount, where, type);
	//assume always successful for now
	//need to keep track of how much bought / sold to rebalance accounts and change fee (it scales with volume). Or, consult authenticated API?
	//format amount to correct number of digits ("https://api.kraken.com/0/public/Assets")
	//use big.js to avoid floating point imprecision issues with multiplication and addition
}

let fees = {};

async function update_fees() {
	[fees.kraken, fees.ftx, fees.binance, fees.coinbase] = await Promise.all([
		kraken_fees(),
		ftx_fees(),
		binance_fees(),
		coinbase_fees()
	]);
	setTimeout(update_fees, feePollingInterval);
}

await update_fees();

async function main() {
	let books = await Promise.all([
		kraken(),
		ftx(),
		binance(),
		coinbase()
	]); //technically don't need to wait for all api calls to finish first and then determine best bid / ask. can do it as data arrives asynchronously
	const [bestBid, bestAsk] = best(books);
	if(bestAsk.price * (1 + fees[bestAsk.name]) < bestBid.price * (1 - fees[bestBid.name])) {
		console.log('arbitrage opportunity @', bestAsk, bestBid);
		console.log(fees)
		let amount = Math.min(bestAsk.amount, bestBid.amount);
		//technically amount doesn't matter since fee is percentage of amount, so just transact more often?
		await Promise.all([
			placeMarketOrder(amount * bestAsk.price, bestAsk.name, 'buy'),
			placeMarketOrder(amount, bestBid.name, 'sell')
		]);
		//profited, fees
	}
	setTimeout(main, bookPollingInterval);
}

main();