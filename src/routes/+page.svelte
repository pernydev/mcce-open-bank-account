<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { SEK_USD_RATE } from '$lib/constants';
	import { BalanceType, type Balance, type Transaction } from '$lib/types';
	import { onMount } from 'svelte';
	let pendingTransactions: Transaction[] = $state([]);
	let bookedTransactions: Transaction[] = $state([]);
	let balances: Balance[] = $state([]);
	let currencyFormat: 'original' | 'usd' = $state('original');

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
			const formatter = new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: 'USD'
			});
			return formatter.format(int * SEK_USD_RATE);
		}
	}

	onMount(async () => {
		await getTransactions();
		await getBalances();
	});
</script>

{#snippet balanceCard(balanceType: BalanceType, balance: Balance)}
	<div class="min§w-[300px] flex flex-col gap-2 bg-mantle p-4">
		<span class="text-lg font-bold text-subtext0">
			{#if balanceType === BalanceType.INTERIM_AVAILABLE}
				Interim Available
			{:else if balanceType === BalanceType.INTERIM_BOOKED}
				Interim Booked
			{/if}
		</span>
		<span class="text-2xl font-bold">
			{f(balance.balanceAmount.currency, balance.balanceAmount.amount)}
		</span>
	</div>
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
						<td class="text-left">{transaction.bookingDate || '-'}</td>
						<td class="text-left">{transaction.remittanceInformationStructured || '-'}</td>
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
			</p>
		</div>
	</div>

	<h2 class="mb-6 mt-16 text-xl font-bold">Pending Transactions</h2>
	{@render transactions(pendingTransactions)}
	<h2 class="mb-6 mt-16 text-xl font-bold">Booked Transactions</h2>
	{@render transactions(bookedTransactions)}
</div>
