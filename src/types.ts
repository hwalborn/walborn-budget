// the keys here are the same as the account type in the spreadsheet
const accountTypes = ['RU', 'GA', 'SHOP', 'RB', 'ENT', 'TRAV', 'TRANS', 'CELL', 'SL', 'MD', 'MISC'] as const;
const income = ['WORK', 'OTHER'] as const;
const allAccounts = [...accountTypes, ...income]

export type AccountKey = typeof accountTypes[number];
export type AccountBalances = {
    [K in AccountKey]: number;
};

export type IncomeKey = typeof income[number];
export type IncomeAccounts = {
    [K in IncomeKey]: number;
};