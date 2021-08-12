"use strict";
import fetch from 'node-fetch';

let bids = {};
let asks = {};
//todo: make functions return bids and asks to avoid global variable
async function kraken() {
	let result = await (await fetch('https://api.kraken.com/0/public/Depth?pair=XBTUSD')).json();
	bids.kraken = result.result.XXBTZUSD.bids;
	asks.kraken = result.result.XXBTZUSD.asks;
}

async function ftx() {
	let result = await (await fetch('https://ftx.com/api/markets/btc_usd/orderbook')).json();
	bids.ftx = result.result.bids;
	asks.ftx = result.result.asks;
}

async function main() {
	await Promise.all([
		kraken(),
		ftx()
	]);
	let bestBid = {
		exchange: 'kraken',
		price: Number(bids.kraken[0][0]),
		amount: Number(bids.kraken[0][1])
	};
	for(const exchange in bids) {
		if(Number(bids[exchange][0][0]) > bestBid.price) {
			bestBid.exchange = exchange;
			bestBid.price = Number(bids[exchange][0][0]);
			bestBid.amount = Number(bids[exchange][0][1]);
		}
	}
	let bestAsk = {
		exchange: 'kraken',
		price: Number(asks.kraken[0][0]),
		amount: Number(asks.kraken[0][1])
	};
	for(const exchange in asks) {
		if(Number(asks[exchange][0][0]) > bestAsk.price) {
			bestAsk.exchange = exchange;
			bestAsk.price = Number(asks[exchange][0][0]);
			bestAsk.amount = Number(asks[exchange][0][1]);
		}
	}
	console.log(bestAsk, bestBid);
	if(bestAsk.price < bestBid.price && bestAsk.exchange !== bestBid.exchange) {
		console.log('arbitrage opportunity @', bestAsk, bestBid);
	}
	setTimeout(main, 1000);
}

main();