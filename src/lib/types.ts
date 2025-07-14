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

export enum BalanceType {
	INTERIM_AVAILABLE = 'interimAvailable',
}

export interface Balance {
	balanceAmount: Amount;
	balanceType: BalanceType;
}

export interface APIAccountTransactions {
	transactions: {
		booked: Transaction[];
		pending?: Transaction[];
	};
}

export interface APIAccountBalance {
	balances: object;
}

export interface APIJWTToken {
	access: string;
}
