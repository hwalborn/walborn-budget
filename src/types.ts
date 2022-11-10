// the keys here are the same as the account type in the spreadsheet
export const expenseTypes = ['RU', 'GA', 'SHOP', 'RB', 'ENT', 'TRAV', 'TRANS', 'CELL', 'SL', 'MD', 'MISC'] as const;
export const income = ['WORK', 'OTHER'] as const;
export const accounts = ['CK', 'CC', 'CCPEND', 'OSCHECK', 'SAV', 'CASH'] as const;

export type ExpenseKey = typeof expenseTypes[number];
export type ExpenseBalances = {
    [K in ExpenseKey]?: number;
};
export type ExpenseRecord = Record<ExpenseKey, number>;

export type IncomeKey = typeof income[number];
export type IncomeAccounts = {
    [K in IncomeKey]?: number;
};

export type AccountKey = typeof accounts[number];
export type AccountBalances = {
    [K in AccountKey]?: number;
};

export type WeeklyRead = {
    balances: AccountBalances;
    expenses: ExpenseBalances;
    income: IncomeAccounts;
}