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
	INTERIM_BOOKED = 'interimBooked'
}

export interface Balance {
	balanceAmount: Amount;
	balanceType: BalanceType;
}
