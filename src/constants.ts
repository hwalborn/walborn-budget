import * as path from 'path';

export const TOKEN_PATH = path.join(process.cwd(), 'token.json');
export const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
export const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly', 'https://www.googleapis.com/auth/drive.metadata.readonly'];
export const DAILY_EXPENSES_RANGE = 'Daily!C16:E26';
export const DAILY_BALANCES_RANGE = 'Daily!B3:C6';
export const EARNINGS_RANGE = 'Earnings!A2:D100';