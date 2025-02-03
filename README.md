# MC:CE Open Bank Account
![image](https://github.com/user-attachments/assets/83e7a1fb-ae3c-4865-82ae-b01541d8e55c)

This is an application to view the MC:CE bank account balance and transactions.

This application consists of two parts:
- Frontend: Connects to a CDN with JSON files containing the data
- Backend (Cron): Fetches the data from GoCardless and stores it in S3

## Setup

1. Install [Bun](https://bun.sh/)
2. Clone the repository
3. Copy `.env.example` to `.env`
4. (Optional) Change the `PUBLIC_BALANCE_DATA_URL` and `PUBLIC_TRANSACTIONS_DATA_URL` to point to your own JSON files, by default they point to our CDN containing the data for the MC:CE account
5. Run `bun install` to install dependencies
6. Run `bun --bun run dev` to start the development server

## Contributing

Contributions are welcome! Please open an issue before starting work on a pull request. You can ping me (@perny) on Discord if you have any questions!
