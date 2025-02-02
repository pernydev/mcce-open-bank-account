import { env } from '$env/dynamic/private';
import type { Transaction } from '$lib/types';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const cronToken = request.headers.get('x-cron-token');
    if ((cronToken || "") !== env.CRON_SECRET) {
        return new Response('Unauthorized', { status: 401 });   
    }

    console.log("CRON JOB");

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
    const bodyString = await token.text();
    console.log(bodyString);
    const body = JSON.parse(bodyString);
    if (token.status !== 200) {
        return new Response('Failed to get access token', { status: 401 });
    }
    const accessToken = body.access;

    const transactionsResp = await fetch(`https://bankaccountdata.gocardless.com/api/v2/accounts/${env.GCL_ACCOUNT_ID}/transactions/`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
        }
    });
    const transactionsBody = await transactionsResp.json();
    if (transactionsResp.status !== 200) {
        console.log(transactionsBody);
        return new Response('Failed to get transactions', { status: 500 });
    }

    // filter out sensitive data
    const bookedTransactions: Transaction[] = []
    transactionsBody.transactions.booked.forEach(t => {
        console.log(t);
        bookedTransactions.push({
            remittanceInformationStructured: t.remittanceInformationStructured,
            creditorName: t.creditorName,
            transactionAmount: t.transactionAmount,
            bookingDate: t.bookingDate,
            valueDate: t.valueDate
        });
        return t;
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

    const balancesResp = await fetch(`https://bankaccountdata.gocardless.com/api/v2/accounts/${GCL_ACCOUNT_ID}/balances/`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
        }
    });
    const balancesBody = await balancesResp.json();
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
