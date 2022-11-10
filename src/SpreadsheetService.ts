import { Auth, google } from 'googleapis';
import { JSONClient } from 'google-auth-library/build/src/auth/googleauth';
import { GoogleService } from "./GoogleService";

import { 
    DAILY_EXPENSES_RANGE,
    DAILY_BALANCES_RANGE,
    EARNINGS_RANGE } from "./constants";
import { 
    AccountBalances,
    ExpenseBalances,
    ExpenseKey,
    expenseTypes,
    IncomeAccounts,
    IncomeKey,
    WeeklyRead,
    income as incomeAccounts } from "./types";
import { ANNUAL_SPREADSHEET_ID, CURRENT_WEEKLY_SPREADSHEET_ID, WEEKLY_SPREADSHEET_ID } from '../spreadsheetIds';
import { mockSheetsBatch } from "./mocks";

export class SpreadsheetService extends GoogleService {

    // Properties
    accountBalances: ExpenseBalances | null;
    annualSpreadsheetId = ANNUAL_SPREADSHEET_ID;
    currentWeeklySpreadsheetId: string;
    income: IncomeAccounts | null;
    newWeeklySpreadsheetId: string | null;
    targetDateTitle: string;
    weekEndingDate: Date = new Date();
    weeklySpreadsheetTemplateId = WEEKLY_SPREADSHEET_ID;

    // CTOR
    constructor(auth: Auth.OAuth2Client | JSONClient) {
        super(auth);

        // gotta know which Friday we are doing
        const nextFriday = 5 - this.weekEndingDate.getDay();
        this.weekEndingDate.setDate(this.weekEndingDate.getDate() + nextFriday);
        this.targetDateTitle = this.getTargetTitle();
        this.kickItOff();
    }

    // Private methods
    private getTargetTitle(): string {
        const dateValues = this.weekEndingDate.toDateString().split(' ');
        if (dateValues.length >= 3) {
            return `${dateValues[1]} ${dateValues[2]}`;
        }
        return '';
    }

    private async setWeeklySpreadSheetId(): Promise<void> {
        try {
            // TODO -> hardcoding this for now, will come back and get it dynamically
            const spreadSheetId = await this.getFileId(this.targetDateTitle);
            this.currentWeeklySpreadsheetId = spreadSheetId;
            // this.currentWeeklySpreadsheetId = CURRENT_WEEKLY_SPREADSHEET_ID;
        } catch (error) {
            throw error;
        }
    }

    private async kickItOff(): Promise<void> {
        try {
            await this.setWeeklySpreadSheetId();
            const weeklyValues = await this.getWeeklyValues();
            console.log('FINAL VALUES', weeklyValues);
        } catch (error) {
            console.log(error);
        }
    }

    // Google sheets uses accounting format, so negatives are (100) === -100
    private convertToNumber(val: string): number {
        if (val.trim() !== '-') {
            return Number(val.replace('(', '-').replace(')', '').replace(/,|\$/g, ''))
        }
        return 0;
    }

    private formatReducer<ReturnType>(values: string[][], callback: (reducer: ReturnType, value: string[], index?: number) => ReturnType) {
        const formatted = values.reduce(callback, {});
        return formatted;
    }

    private formatExpenses(expenses: string[][]): ExpenseBalances {
        const reducerFunc = (balances: ExpenseBalances, expense: string[]) => {
            const [amount, , key] = expense;
            if ((expenseTypes as ReadonlyArray<string>).includes(key)) {
                balances[key as ExpenseKey] = this.convertToNumber(amount);
            }
            return balances;
        }
        const expenseBalances = this.formatReducer<ExpenseBalances>(expenses, reducerFunc);
        return expenseBalances;
    }

    private formatBalances(balances: string[][]): AccountBalances {
        const reducerFunc = (formattedBalances: AccountBalances, balance: string[], index: number) => {
            switch (index) {
                case 0:
                    const [checking, pendingChecking] = balance;
                    formattedBalances.CK = this.convertToNumber(checking);
                    formattedBalances.OSCHECK = this.convertToNumber(pendingChecking);
                    break;
                case 1:
                    const [savings] = balance;
                    formattedBalances.SAV = this.convertToNumber(savings);
                    break;
                case 2:
                    const [cash] = balance;
                    formattedBalances.CASH = this.convertToNumber(cash);
                    break;
                case 3:
                    const [credit, creditPending] = balance;
                    formattedBalances.CC = this.convertToNumber(credit);
                    formattedBalances.CCPEND = this.convertToNumber(creditPending);
                default:
                    break;
            }
            return formattedBalances;
        }
        const formatted = this.formatReducer<AccountBalances>(balances, reducerFunc);
        return formatted;
    }

    private formatEarnings(earnings: string[][]): IncomeAccounts {
        const reducerFunc = (formattedEarnings: IncomeAccounts, earning: string[]) => {
            // TODO -> use the account maybe
            const [income, account, , earningType] = earning;
            if (!(incomeAccounts as ReadonlyArray<string>).includes(earningType)) {
                return formattedEarnings;
            }
            const earningTypeKey = earningType as IncomeKey;
            if (!formattedEarnings[earningTypeKey])  {
                formattedEarnings[earningTypeKey] = 0;
            }
            formattedEarnings[earningTypeKey] += this.convertToNumber(income);
            return formattedEarnings;
        }
        const formatted = this.formatReducer<IncomeAccounts>(earnings, reducerFunc);
        return formatted;
    }

    // Methods
    getFinalIncomeFromWeekly(): void {
        throw 'NOT IMPLEMENTED'
    }

    async getWeeklyValues(): Promise<WeeklyRead | undefined> {
        try {
            const sheets = google.sheets({version: 'v4', auth: this.auth});
            const res = await sheets.spreadsheets.values.batchGet({
                spreadsheetId: this.currentWeeklySpreadsheetId,
                ranges:[DAILY_EXPENSES_RANGE, DAILY_BALANCES_RANGE, EARNINGS_RANGE]
            });
            const [expenses, balances, earnings] = res.data.valueRanges;
            // TODO -> just for testing
            // const [expenses, balances, earnings] = await mockSheetsBatch();
            
            return {
                balances: this.formatBalances(balances.values),
                expenses: this.formatExpenses(expenses.values),
                income: this.formatEarnings(earnings.values),
            }
        } catch (error) {
            throw error;
        }
    }

    writeToAnnual(): void {
        throw 'NOT IMPLEMENTED';
    }

    copyWeekly(): void {
        // will probably get a new ID back here and save as prop or return
        throw 'NOT IMPLEMENTED';
    }

    writeAnnualValuesToWeekly(): void {
        throw 'NOT IMPLEMENTED';
    }

    writeStartingBalancesToWeekly(): void {
        throw 'NOT IMPLEMENTED';
    }
}