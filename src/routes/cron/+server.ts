import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { APIAccountBalance, APIAccountTransactions, APIJWTToken, StoredTransaction, StoredTransactions, Transaction } from '$lib/types';
import { hashTransaction, mergeBookedTransactions } from '$lib/ledger';
import type { S3File } from 'bun';

async function uploadJSON(file: S3File, body: string) {
	const resp = await fetch(file.presign({ method: 'PUT' }), {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-cache'
		},
		body
	});

	if (!resp.ok) {
		throw new Error(`Upload failed (${resp.status}): ${await resp.text()}`);
	}
}

export const POST = async ({ request }) => {
	const cronToken = request.headers.get('x-cron-token');
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

	const allowedKeys = ['remittanceInformationUnstructured', 'creditorName', 'transactionAmount', 'valueDate'] as (keyof Transaction)[];

	const incomingTransactions: (StoredTransaction & { hash: string })[] = await Promise.all(
		transactionsBody.transactions.booked.map(async t => ({
			...Object.fromEntries(
				allowedKeys.map(key => [key, t[key]])
			),
			hash: await hashTransaction(t)
		}))
	);

	const s3 = new Bun.S3Client({
		accessKeyId: env.AWS_ACCESS_KEY_ID,
		secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
		endpoint: env.AWS_ENDPOINT_URL_S3,
		bucket: env.BUCKET_NAME
	});

	const transactions = s3.file('transactions.json');

	let storedTransactions: StoredTransaction[] = [];
	if (await transactions.exists()) {
		try {
			const stored: StoredTransactions = await transactions.json();
			storedTransactions = stored.transactions?.booked ?? [];
		} catch (e) {
			console.error('Failed to read stored transactions', e);
			return new Response('Failed to read stored transactions', { status: 500 });
		}
	}

	const bookedTransactions = mergeBookedTransactions(storedTransactions, incomingTransactions);
	console.log(`${storedTransactions.length} stored + ${incomingTransactions.length} fetched -> ${bookedTransactions.length} booked`);

	await uploadJSON(transactions, JSON.stringify({
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
	await uploadJSON(balances, JSON.stringify({
		balances: balancesBody.balances,
		lastUpdated: new Date().toISOString()
	}));

	return json({
		message: 'ok'
	});
};
