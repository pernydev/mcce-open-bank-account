<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { fetchSEKUSDRate, SEK_USD_RATE } from '$lib/conversion';
	import { BalanceType, type Balance, type Transaction } from '$lib/types';
	import { onMount } from 'svelte';

	let pendingTransactions: Transaction[] = $state([]);
	let bookedTransactions: Transaction[] = $state([]);
	let balances: Balance[] = $state([]);
	let currencyFormat: 'original' | 'usd' = $state('original');
	let totals: { in: number; out: number } = $derived(
		calculateTotals([...pendingTransactions, ...bookedTransactions])
	);
	let percentageUsed: number = $derived(totals.in === 0 ? 0 : 1 - totals.out / totals.in);

	async function getTransactions() {
		const response = await fetch(env.PUBLIC_TRANSACTIONS_DATA_URL);
		const body = await response.json();
		bookedTransactions = body.transactions.booked;
		pendingTransactions = body.transactions.pending;
	}

	async function getBalances() {
		const response = await fetch(env.PUBLIC_BALANCE_DATA_URL);
		balances = (await response.json()).balances;
	}

	function f(currency: string, amount: string) {
		const int = parseInt(amount);
		if (currencyFormat === 'original' || currency !== 'SEK') {
			const formatter = new Intl.NumberFormat('sw-KE', {
				style: 'currency',
				currency: currency
			});
			return formatter.format(int);
		} else {
			if (SEK_USD_RATE === null) {
				return 'Loading...';
			}
			const formatter = new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: 'USD'
			});
			return formatter.format(int * SEK_USD_RATE);
		}
	}

	function calculateTotals(transactions: Transaction[]): { in: number; out: number } {
		let inAmount = 0;
		let outAmount = 0;
		transactions.forEach((t) => {
			if (!t.transactionAmount) {
				return;
			}

			if (t.transactionAmount.amount.startsWith('-')) {
				outAmount += parseFloat(t.transactionAmount.amount.substring(1));
				return;
			}
			inAmount += parseFloat(t.transactionAmount.amount);
		});
		return { in: inAmount, out: outAmount };
	}

	onMount(async () => {
		await getTransactions();
		await getBalances();
		fetchSEKUSDRate();
	});
</script>

{#snippet balanceCard(balanceType: BalanceType, balance: Balance)}
	{#if balanceType === BalanceType.INTERIM_AVAILABLE}
		<div class="flex min-w-[300px] flex-col gap-2 bg-mantle p-4">
			<span class="text-lg font-bold text-subtext0"> Available </span>
			<span class="text-2xl font-bold">
				{f(balance.balanceAmount.currency, balance.balanceAmount.amount)}
			</span>
		</div>
	{/if}
{/snippet}

{#snippet transactions(transactions: Transaction[])}
	<div class="overflow-x-auto">
		<table class="mt-4 w-full">
			<thead>
				<tr>
					<th class="text-left">Date</th>
					<th class="text-left">Information</th>
					<th class="text-left">Description</th>
					<th class="text-right">Amount</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-mantle">
				{#each transactions as transaction}
					<tr>
						<td class="text-left">{transaction.valueDate || '-'}</td>
						<td class="text-left">{transaction.remittanceInformationUnstructured || '-'}</td>
						<td class="text-left">{transaction.creditorName || '-'}</td>
						<td class="text-right">
							{#if transaction.transactionAmount}
								{f(transaction.transactionAmount.currency, transaction.transactionAmount.amount)}
							{:else}
								-
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/snippet}

<div class="mx-auto max-w-6xl px-2 pt-2 lg:pt-6">
	<h1 class="sr-only">MC:CE Open Bank Account</h1>

	<div class="flex-inline gap-4">
		<button
			class="border border-text p-2 {currencyFormat === 'original'
				? 'bg-text text-mantle'
				: 'bg-mantle text-text'}"
			onclick={() => (currencyFormat = 'original')}
		>
			Original
		</button>
		<button
			class="border border-text p-2 {currencyFormat === 'usd'
				? 'bg-text text-mantle'
				: 'bg-mantle text-text'}"
			onclick={() => (currencyFormat = 'usd')}
		>
			Amounts in USD
		</button>
	</div>

	<div class="mt-4 flex min-h-32 flex-col gap-4 lg:flex-row">
		{#each balances as balance}
			{@render balanceCard(balance.balanceType, balance)}
		{/each}
		<div class="flex-1 bg-mantle p-4">
			<p class="text-md text-subtext-0 mt-2">
				This is an application to view the MC:CE bank account balance and transactions. It is
				Open-Source under GPLv3 and available on
				<a href="https://github.com/pernydev/mcce-open-bank-account" class="text-blue"> GitHub </a>.
				For additional transparency, we post banking statements on
				<a href="https://discord.gg/mojanglawsuit" class="text-blue"> Discord </a>.
			</p>
		</div>
	</div>
	
	<h2 class="mb-2 mt-8 block text-xl font-bold" id="funding-left">Funding left</h2>
	<div class="flex gap-4">
		<span aria-labelledby="funding-left">
			{percentageUsed * 100}%
		</span>
		<div class="relative h-6 w-full bg-mantle" aria-hidden="true">
			<div
				class="absolute left-0 top-0 h-full w-full bg-subtext0"
				style="width: {percentageUsed * 100}%"
			></div>
		</div>
	</div>

	{#if pendingTransactions.length !== 0}
		<h2 class="mb-6 mt-16 text-xl font-bold">Pending Transactions</h2>
		{@render transactions(pendingTransactions)}
	{/if}

	<h2 class="mb-6 mt-16 text-xl font-bold">Booked Transactions</h2>
	{@render transactions(bookedTransactions)}

	<div class="flex gap-8">
		<a href="https://www.exchangerate-api.com" class="mt-8 block text-xs text-blue"
			>Rates By Exchange Rate API</a
		>
		<a href="https://gocardless.com/bank-account-data/" class="mt-8 block text-xs text-blue"
			>Bank Account Data By GoCardless</a
		>
	</div>
</div>
