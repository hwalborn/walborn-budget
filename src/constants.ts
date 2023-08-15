import * as path from 'path';

export const TOKEN_PATH = path.join(process.cwd(), 'token.json');
export const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
export const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'];
export const DAILY_EXPENSES_RANGE = 'Daily!C16:E26';
export const DAILY_EXPENSES_RANGE_BUDGET = 'Daily!B17:B27';
export const DAILY_BALANCES_RANGE = 'Daily!B3:C6';
export const EARNINGS_RANGE = 'Earnings!A2:D100';
export const ANNUAL_SHEET = 'Working!'
export const ANNUAL_DATE_RANGE = `${ANNUAL_SHEET}B2:BA2`;