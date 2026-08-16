export interface Amount {
	amount: string;
	currency: string;
}

export interface Transaction {
	remittanceInformationUnstructured?: string;
	creditorName?: string;
	transactionAmount?: Amount;
	valueDate?: string;
}

export type StoredTransaction = Transaction & { hash?: string };

export interface StoredTransactions {
	transactions: {
		booked: StoredTransaction[];
		pending?: Transaction[];
	};
}

export interface TransactionIdentifiers {
	internalTransactionId?: string;
	transactionId?: string;
	endToEndId?: string;
}

export enum BalanceType {
	INTERIM_AVAILABLE = 'interimAvailable',
}

export interface Balance {
	balanceAmount: Amount;
	balanceType: BalanceType;
}

export interface APIAccountTransactions {
	transactions: {
		booked: (Transaction & TransactionIdentifiers)[];
		pending?: Transaction[];
	};
}

export interface APIAccountBalance {
	balances: object;
}

export interface StoredBalances {
	balances: Balance[];
	lastUpdated: string;
}

export interface APIJWTToken {
	access: string;
}
