import { env } from '$env/dynamic/private';
import type { APIAccountBalance, APIAccountTransactions, APIJWTToken, Transaction } from '$lib/types';
import { json } from '@sveltejs/kit';

export const POST = async ({ request }) => {
	const cronToken = request.headers.get('x-cron-token');
	// don't need to || '' cronToken;
	// typeof env.CRON_SECRET is always a string, never null
	if (cronToken !== env.CRON_SECRET) {
		return new Response('Unauthorized', { status: 401 });
	}

	console.log('CRON JOB');

	const token = await fetch('https://bankaccountdata.gocardless.com/api/v2/token/new/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			secret_id: env.GCL_SECRET_ID,
			secret_key: env.GCL_SECRET_KEY
		})
	});

	const body: APIJWTToken = await token.json();
	console.log(JSON.stringify(body));
	if (token.status !== 200) {
		return new Response('Failed to get access token', { status: 401 });
	}
	const accessToken = body.access;

	console.log(env.GCL_ACCOUNT_ID);

	const transactionsResp = await fetch(`https://bankaccountdata.gocardless.com/api/v2/accounts/${env.GCL_ACCOUNT_ID}/transactions/`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${accessToken}`
		}
	});
	const transactionsBody: APIAccountTransactions = await transactionsResp.json();
	if (transactionsResp.status !== 200) {
		console.log(transactionsBody);
		return new Response('Failed to get transactions', { status: 500 });
	}


	// TODO: cleaner way to type this?
	const allowedKeys = ['remittanceInformationUnstructured', 'creditorName', 'transactionAmount', 'valueDate'] as (keyof Transaction)[];

	// filter out sensitive data
	const bookedTransactions = transactionsBody.transactions.booked.map(t => {
		console.log(t);

		return Object.fromEntries(
			// array of key-value pairs of allowed key and current transactions' corresponding value,
			// then turn it back into an object (fromEntries)
			allowedKeys.map(key => [key, t[key]])
		);
	});


	const s3 = new Bun.S3Client({
		accessKeyId: env.AWS_ACCESS_KEY_ID,
		secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
		endpoint: env.AWS_ENDPOINT_URL_S3,
		bucket: env.BUCKET_NAME
	});

	const transactions = s3.file('transactions.json');
	await Bun.write(transactions, JSON.stringify({
		transactions: {
			booked: bookedTransactions,
			pending: transactionsBody.transactions.pending
		}
	}));

	const balancesResp = await fetch(`https://bankaccountdata.gocardless.com/api/v2/accounts/${env.GCL_ACCOUNT_ID}/balances/`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${accessToken}`
		}
	});
	const balancesBody: APIAccountBalance = await balancesResp.json();
	if (balancesResp.status !== 200) {
		console.log(balancesBody);
		return new Response('Failed to get balances', { status: 500 });
	}

	const balances = s3.file('balances.json');
	await Bun.write(balances, JSON.stringify({
		balances: balancesBody.balances
	}));

	return json({
		message: 'ok'
	});
};
