"use strict";
import fetch from 'node-fetch';

async function kraken() {
	let result = await (await fetch('https://api.kraken.com/0/public/Depth?pair=XBTUSD')).json();
	return {
		name: 'kraken',
		bids: result.result.XXBTZUSD.bids,
		asks: result.result.XXBTZUSD.asks
	};
}

async function ftx() {
	let result = await (await fetch('https://ftx.com/api/markets/btc_usd/orderbook')).json();
	return {
		name: 'ftx', 
		bids: result.result.bids,
		asks: result.result.asks
	};
}

async function binance() {
	let result = await (await fetch('https://api.binance.com/api/v3/depth?symbol=BTCUSDT')).json();
	return {
		name: 'binance',
		bids: result.bids,
		asks: result.asks
	};
}

async function coinbase() {
	let result = await (await fetch('https://api-public.sandbox.pro.coinbase.com/products/BTC-USD/book?level=2')).json();
	return {
		name: 'coinbase',
		bids: result.bids,
		asks: result.asks
	};
}

function best(books) {
	let bestBid = {name: books[0].name, price: Number(books[0].bids[0][0])};
	let bestAsk = {name: books[0].name, price: Number(books[0].asks[0][0])};
	for(let i = 1; i < books.length; ++i) {
		if(Number(books[i].bids[0][0]) > bestBid.price) {
			bestBid = {name: books[i].name, price: Number(books[i].bids[0][0])}
		}
		if(Number(books[i].asks[0][0]) < bestAsk.price) {
			bestAsk = {name: books[i].name, price: Number(books[i].asks[0][0])}
		}
	}
	return [bestBid, bestAsk];
}

async function main() {
	let books = await Promise.all([
		kraken(),
		ftx(),
		binance(),
		coinbase()
	]); //technically don't need to wait for all api calls to finish first and then determine best bid / ask. can do it as data arrives asynchronously
	const [bestBid, bestAsk] = best(books);
	if(bestAsk.price < bestBid.price) {
		console.log('arbitrage opportunity @', bestAsk, bestBid);
	}
	setTimeout(main, 1000);
}

main();