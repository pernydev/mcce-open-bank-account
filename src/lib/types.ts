export interface Amount {
	amount: string;
	currency: string;
}

export interface Transaction {
	remittanceInformationUnstructured?: string;
	creditorName?: string;
	// field is always present
	transactionAmount: Amount;
	valueDate?: string;
}

export interface APIAccountTransactions {
    transactions: {
        booked: Transaction[];
        pending?: Transaction[];
    };
}

export enum BalanceType {
	INTERIM_AVAILABLE = 'interimAvailable',
}

export interface Balance {
	balanceAmount: Amount;
	balanceType: BalanceType;
}
