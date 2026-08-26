import annotations from '../src/lib/annotations.toml';
import type { Annotation } from '../src/lib/annotations';
import type { StoredTransactions } from '../src/lib/types';

const byHash = annotations as Record<string, Annotation>;

const resp = await fetch('https://mcce-cdn.perny.dev/transactions.json');
if (!resp.ok) {
	console.error(`Failed to fetch transactions (${resp.status})`);
	process.exit(1);
}

const body: StoredTransactions = await resp.json();

for (const t of body.transactions.booked) {
	const annotation = t.hash === undefined ? undefined : byHash[t.hash];
	console.log(
		[
			t.valueDate ?? '????-??-??',
			`${t.transactionAmount?.amount ?? '?'} ${t.transactionAmount?.currency ?? ''}`.padStart(12),
			(t.hash ?? '<no hash>').slice(0, 16),
			annotation?.description ??
				(t.remittanceInformationUnstructured || t.creditorName || '(unannotated)')
		].join('  ')
	);
	if (t.hash !== undefined && byHash[t.hash] === undefined) {
		console.log(`    [${t.hash}]`);
	}
}
