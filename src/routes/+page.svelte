<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { fetchSEKUSDRate, SEK_USD_RATE } from '$lib/conversion';
	import { BalanceType, type Balance, type StoredBalances, type Transaction } from '$lib/types';
	import { onMount } from 'svelte';

	let pendingTransactions: Transaction[] = $state([]);
	let bookedTransactions: Transaction[] = $state([]);
	let balances: Balance[] = $state([]);
	let lastUpdated: string | null = $state(null);
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
		const body: StoredBalances = await response.json();
		balances = body.balances;
		lastUpdated = body.lastUpdated ?? null;
	}

	function formatLastUpdated(timestamp: string) {
		const formatter = new Intl.DateTimeFormat(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
		return formatter.format(new Date(timestamp));
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

	function isOutgoing(transaction: Transaction): boolean {
		return transaction.transactionAmount?.amount.startsWith('-') ?? false;
	}

	function formatTotal(amount: number, currency: string) {
		return f(currency, String(amount));
	}

	function currencyOf(transactions: Transaction[]): string {
		return transactions.find((t) => t.transactionAmount)?.transactionAmount?.currency ?? 'SEK';
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
		<div class="panel balance">
			<span class="balance-label">Available</span>
			<span class="balance-amount">
				{f(balance.balanceAmount.currency, balance.balanceAmount.amount)}
			</span>
		</div>
	{/if}
{/snippet}

{#snippet transactions(transactions: Transaction[])}
	{@const sums = calculateTotals(transactions)}
	{@const currency = currencyOf(transactions)}
	<div class="panel totals">
		<div class="total is-in">
			<span class="total-label">Total in</span>
			<span class="total-amount">
				<span class="direction" aria-hidden="true">+</span>{formatTotal(sums.in, currency)}
			</span>
		</div>
		<div class="total is-out">
			<span class="total-label">Total out</span>
			<span class="total-amount">
				<span class="direction" aria-hidden="true">−</span>{formatTotal(sums.out, currency)}
			</span>
		</div>
	</div>
	<div class="table-scroll">
		<table>
			<thead>
				<tr>
					<th class="left">Date</th>
					<th class="left">Information</th>
					<th class="left">Description</th>
					<th class="right">Amount</th>
				</tr>
			</thead>
			<tbody>
				{#each transactions as transaction}
					{@const out = isOutgoing(transaction)}
					<tr class={out ? 'is-out' : 'is-in'}>
						<td class="left">{transaction.valueDate || '-'}</td>
						<td class="left">{transaction.remittanceInformationUnstructured || '-'}</td>
						<td class="left">{transaction.creditorName || '-'}</td>
						<td class="right amount">
							{#if transaction.transactionAmount}
								<span class="direction" aria-hidden="true">{out ? '−' : '+'}</span>
								<span class="visually-hidden">{out ? 'Outgoing' : 'Incoming'}</span>
								{f(
									transaction.transactionAmount.currency,
									transaction.transactionAmount.amount.replace('-', '')
								)}
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

<div class="wrap">
	<header class="page-head">
		<h1>Open bank account</h1>
		<p class="lede">
			A read-only view of the account holding the community funds, showing what is left and
			every single movement in &amp; out.
		</p>
	</header>


	<noscript>
		This site relies on Javascript to retreive bank account data. You can manually view the JSON-formatted data. <a href="https://mcce-cdn.perny.dev/balances.json">Balances</a>
		- <a href="https://mcce-cdn.perny.dev/transactions.json">Transactions</a>
	</noscript>

	<yesscript>
	<div class="currency-toggle" role="group" aria-label="Currency format">
		<button
			class="mc-btn"
			class:active={currencyFormat === 'original'}
			aria-pressed={currencyFormat === 'original'}
			onclick={() => (currencyFormat = 'original')}
		>
			<span class="face">Amounts in original currency</span>
		</button>
		<button
			class="mc-btn"
			class:active={currencyFormat === 'usd'}
			aria-pressed={currencyFormat === 'usd'}
			onclick={() => (currencyFormat = 'usd')}
		>
			<span class="face">Amounts in USD</span>
		</button>
	</div>

	<div class="top-row">
		{#each balances as balance}
			{@render balanceCard(balance.balanceType, balance)}
		{/each}
		<div class="panel about">
			<p>
				This is an application to view the MC:CE bank account balance and transactions. It is
				Open-Source under GPLv3 and available on
				<a href="https://github.com/pernydev/mcce-open-bank-account">GitHub</a>. For additional
				transparency, we post banking statements on
				<a href="https://discord.gg/mojanglawsuit">Discord</a>.
			</p>
			{#if lastUpdated}
				<p class="updated">
					Last updated <time datetime={lastUpdated}>{formatLastUpdated(lastUpdated)}</time>
				</p>
			{/if}
		</div>
	</div>

	<section>
		<h2 id="funding-left">Funding left</h2>
		<div class="funding">
			<span class="funding-value" aria-labelledby="funding-left">
				{Math.round(percentageUsed * 100)}%
			</span>
			<div class="meter" aria-hidden="true">
				<div class="meter-fill" style="width: {percentageUsed * 100}%"></div>
			</div>
		</div>
	</section>

	{#if pendingTransactions.length !== 0}
		<section>
			<h2>Pending transactions</h2>
			{@render transactions(pendingTransactions)}
		</section>
	{/if}

	<section>
		<h2>Booked transactions</h2>
		{@render transactions(bookedTransactions)}
	</section>
	</yesscript>

	<p class="credits">
		<a href="https://www.exchangerate-api.com">Rates by Exchange Rate API</a>
		<a href="https://gocardless.com/bank-account-data/">Bank account data by GoCardless</a>
	</p>
</div>

<style>
	.page-head {
		margin-block: 3rem 2rem;
	}

	.lede {
		color: var(--text-dim);
		margin-top: 0.75rem;
		max-width: var(--measure);
	}

	.currency-toggle {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.mc-btn {
		--face: var(--grey-5);
		--lip-top: var(--grey-4);
		--lip-bottom: var(--off-black);
		display: inline-block;
		padding: 0;
		background: none;
		border: 0;
		font-family: var(--pixel);
		cursor: pointer;
	}

	.mc-btn.active {
		--face: var(--green-5);
		--lip-top: #47983a;
		--lip-bottom: var(--green-6);
	}

	.face {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 2.75rem;
		padding: 0.75rem 1.25rem;
		background: var(--face);
		border: 2px solid var(--off-black);
		box-shadow:
			0 4px 0 0 rgb(0 0 0 / 0.25),
			inset 0 6px 0 0 var(--lip-top),
			inset 0 -6px 0 0 var(--lip-bottom);
		color: #fff;
		text-shadow: 2px 2px 0 rgb(0 0 0 / 0.55);
		font-size: 1rem;
		line-height: 1.2;
		letter-spacing: 0.02em;
	}

	.mc-btn:hover .face,
	.mc-btn:focus-visible .face {
		background:
			linear-gradient(0deg, rgb(255 255 255 / 0.2), rgb(255 255 255 / 0.2)), var(--face);
	}

	.mc-btn:focus-visible .face {
		outline: 2px solid #fff;
		outline-offset: 2px;
	}

	.mc-btn:active .face {
		background: linear-gradient(0deg, rgb(0 0 0 / 0.1), rgb(0 0 0 / 0.1)), var(--face);
		box-shadow:
			0 0 0 0 rgb(0 0 0 / 0.25),
			inset 0 6px 0 0 var(--lip-top),
			inset 0 -6px 0 0 var(--lip-bottom);
		transform: translateY(4px);
	}

	.top-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.balance {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		justify-content: center;
	}

	.balance-label {
		font-family: var(--pixel);
		font-size: 0.95rem;
		letter-spacing: 0.04em;
		color: var(--text-dim);
	}

	.balance-amount {
		font-family: var(--pixel);
		font-size: clamp(1.5rem, 4vw, 2rem);
		line-height: 1.2;
		color: var(--accent);
		text-shadow: 2px 2px 0 rgb(0 0 0 / 0.55);
	}

	.about p {
		font-size: 0.92rem;
		color: var(--text-dim);
	}

	.about .updated {
		margin-top: 0.75rem;
		font-size: 0.85rem;
	}

	section {
		margin-top: 3rem;
	}

	section h2 {
		margin-bottom: 0.85rem;
	}

	.funding {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.funding-value {
		font-family: var(--pixel);
		font-size: 1.05rem;
		min-width: 4ch;
	}

	.meter {
		position: relative;
		height: 1.5rem;
		width: 100%;
		background: var(--grey-6);
		border: 2px solid;
		border-color: var(--off-black) var(--grey-4) var(--grey-4) var(--off-black);
	}

	.meter-fill {
		position: absolute;
		inset: 0 auto 0 0;
		background: var(--green-5);
		box-shadow:
			inset 0 4px 0 0 var(--green-4),
			inset 0 -4px 0 0 var(--green-6);
	}

	.table-scroll {
		overflow-x: auto;
		border: 2px solid var(--off-black);
		box-shadow:
			inset 0 4px 0 0 var(--grey-5),
			inset 0 -4px 0 0 var(--off-black);
		background: var(--bg-raised);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.92rem;
	}

	th {
		font-family: var(--pixel);
		font-weight: normal;
		font-size: 0.9rem;
		letter-spacing: 0.04em;
		color: var(--text-dim);
		border-bottom: 2px solid var(--grey-5);
		padding: 0.85rem 1rem;
		white-space: nowrap;
	}

	td {
		padding: 0.7rem 1rem;
		color: var(--text-dim);
		vertical-align: top;
	}

	tbody tr + tr td {
		border-top: 1px solid var(--grey-5);
	}

	tbody tr:hover td {
		background: rgb(255 255 255 / 0.03);
		color: var(--text);
	}

	tbody td:first-child {
		border-left: 4px solid transparent;
	}

	tbody .is-in td:first-child {
		border-left-color: var(--green-5);
	}

	tbody .is-out td:first-child {
		border-left-color: var(--brown-3);
	}

	.amount {
		font-family: var(--pixel);
		white-space: nowrap;
		color: var(--text);
	}

	.is-in .amount {
		color: var(--green-2);
	}

	.is-out .amount {
		color: var(--grey-2);
	}

	.direction {
		display: inline-block;
		min-width: 1ch;
		margin-right: 0.15em;
	}

	.totals {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.total {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding-left: 0.85rem;
		border-left: 4px solid transparent;
	}

	.total.is-in {
		border-left-color: var(--green-5);
	}

	.total.is-out {
		border-left-color: var(--brown-3);
	}

	.total-label {
		font-family: var(--pixel);
		font-size: 0.9rem;
		letter-spacing: 0.04em;
		color: var(--text-dim);
	}

	.total-amount {
		font-family: var(--pixel);
		font-size: 1.35rem;
		line-height: 1.2;
		white-space: nowrap;
		text-shadow: 2px 2px 0 rgb(0 0 0 / 0.55);
	}

	.is-in .total-amount {
		color: var(--green-2);
	}

	.is-out .total-amount {
		color: var(--grey-2);
	}

	.left {
		text-align: left;
	}

	.right {
		text-align: right;
	}

	.credits {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 2rem;
		margin-top: 2rem;
		font-size: 0.8rem;
	}
</style>
