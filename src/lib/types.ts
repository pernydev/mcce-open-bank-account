export interface Amount {
	amount: string;
	currency: string;
}

export interface Transaction {
	remittanceInformationStructured?: string;
	creditorName?: string;
	transactionAmount?: Amount;
	bookingDate?: string;
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
