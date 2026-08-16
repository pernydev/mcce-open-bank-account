import type { StoredTransaction, Transaction, TransactionIdentifiers } from '$lib/types';

async function digest(input: string): Promise<string> {
	const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
	return Array.from(new Uint8Array(bytes))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export async function hashTransaction(
	transaction: Transaction & TransactionIdentifiers
): Promise<string> {
	const id =
		transaction.internalTransactionId ?? transaction.transactionId ?? transaction.endToEndId;

	if (id !== undefined) {
		return digest(`id:${id}`);
	}

	return digest(
		[
			'fields',
			transaction.valueDate ?? '',
			transaction.transactionAmount?.amount ?? '',
			transaction.transactionAmount?.currency ?? '',
			transaction.creditorName ?? '',
			transaction.remittanceInformationUnstructured ?? ''
		].join('|')
	);
}

export function mergeBookedTransactions(
	stored: StoredTransaction[],
	incoming: (StoredTransaction & { hash: string })[]
): StoredTransaction[] {
	const unhashed = stored.filter((t) => t.hash === undefined);
	const byHash = new Map(
		stored
			.filter((t): t is StoredTransaction & { hash: string } => t.hash !== undefined)
			.map((t) => [t.hash, t])
	);

	for (const transaction of incoming) {
		if (!byHash.has(transaction.hash)) {
			byHash.set(transaction.hash, transaction);
		}
	}

	return [...unhashed, ...byHash.values()].sort((a, b) =>
		(b.valueDate ?? '').localeCompare(a.valueDate ?? '')
	);
}
