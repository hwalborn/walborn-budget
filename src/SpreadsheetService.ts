import { Auth, google, sheets_v4 } from 'googleapis';
import { JSONClient } from 'google-auth-library/build/src/auth/googleauth';
import { GoogleService } from "./GoogleService";

import { 
    DAILY_EXPENSES_RANGE,
    DAILY_BALANCES_RANGE,
    EARNINGS_RANGE, 
    ANNUAL_DATE_RANGE,
    ANNUAL_SHEET,
    DAILY_EXPENSES_RANGE_BUDGET} from "./constants";
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
    nextWeekEndingDate: Date;
    targetDateTitle: string;
    weekEndingDate: Date = new Date();
    weeklySpreadsheetTemplateId = WEEKLY_SPREADSHEET_ID;
    service: sheets_v4.Sheets;

    // CTOR
    constructor(auth: Auth.OAuth2Client | Auth.Impersonated) {
        super(auth);

        // gotta know which Friday we are doing
        const nextFriday = 5 - this.weekEndingDate.getDay();
        this.weekEndingDate.setDate(this.weekEndingDate.getDate() + nextFriday);
        this.nextWeekEndingDate = new Date(this.weekEndingDate);
        this.nextWeekEndingDate.setDate(this.weekEndingDate.getDate() + 7);
        this.targetDateTitle = this.getTargetTitle();
        const service = google.sheets({version: 'v4', auth});
        this.service = service;
        this.kickItOff();
    }

    // Private methods
    private formatDateTitle(date: Date): string {
        const dateValues = date.toDateString().split(' ');
        if (dateValues.length >= 3) {
            return `${dateValues[1]} ${dateValues[2]}`;
        }
        return '';

    }
    private getTargetTitle(): string {
        return this.formatDateTitle(this.weekEndingDate);
    }

    private getNewTitle(): string {
        return this.formatDateTitle(this.nextWeekEndingDate);
    }

    private async setWeeklySpreadSheetId(): Promise<void> {
        try {
            const spreadSheetId = await this.getFileId(this.targetDateTitle);
            this.currentWeeklySpreadsheetId = spreadSheetId;
            // TESTING -> hardcoding this for now, will come back and get it dynamically
            // this.currentWeeklySpreadsheetId = CURRENT_WEEKLY_SPREADSHEET_ID;
        } catch (error) {
            throw error;
        }
    }

    private async kickItOff(): Promise<void> {
        try {
            await this.setWeeklySpreadSheetId();
            const weeklyValues = await this.getWeeklyValues();
            // await this.writeToAnnual(weeklyValues);
            await this.copyWeekly();
            this.writeAnnualValuesToWeekly();
            const huh = 123;
        } catch (error) {
            console.log(error);
        }
    }

    // read helper functions
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
                // amounts come in as negative, but we want to write them as positive in the annual
                balances[key as ExpenseKey] = this.convertToNumber(amount) * -1;
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

    // write helper functions
    private async findAnnualColumn(): Promise<number> {
        try {
            const res = await this.service.spreadsheets.values.get({
              spreadsheetId: ANNUAL_SPREADSHEET_ID,
              range: ANNUAL_DATE_RANGE,
            });
            const rows = res.data.values;
            if (!rows || rows.length === 0) {
              console.log('No data found.');
              return;
            }
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                for (let j = 0; j < row.length; j++) {
                    const date = row[j];
                    const budgetDay = new Date(date);
                    if (this.makeDate(budgetDay) === this.makeDate(this.weekEndingDate)) {
                        return j;
                    }
                }
            }
            throw new Error(`no column for ${this.weekEndingDate} found`);
        } catch (error) {
            console.error(error);
        }
    }

    private getColumnName(index: number): string {
        // I'm lifting this from here: https://stackoverflow.com/a/21231012
        let temp, letter = '';
        while (index > 0) {
            temp = (index - 1) % 26;
            letter = String.fromCharCode(temp + 65) + letter;
            index = (index - temp - 1) / 26;
        }
        return letter;
    }

    private makeDate(date: Date): string {
        return date.toISOString().split('T')[0]
    }

    private formatValues(values: WeeklyRead): number[][] {
        const { income, expenses } = values;
        const formattedValues = [[
            income.WORK || 0,
            income.OTHER || 0,
            null,
            null,
            expenses.RU || 0,
            expenses.GA || 0,
            expenses.SHOP || 0,
            expenses.RB || 0,
            expenses.ENT || 0,
            expenses.TRAV || 0,
            expenses.TRANS || 0,
            expenses.CELL || 0,
            expenses.SL || 0,
            expenses.MD || 0,
            expenses.MISC || 0
        ]]
        return formattedValues;
    }

    // Methods
    getFinalIncomeFromWeekly(): void {
        throw 'NOT IMPLEMENTED'
    }

    async getWeeklyValues(): Promise<WeeklyRead | undefined> {
        try {
            const res = await this.service.spreadsheets.values.batchGet({
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

    async writeToAnnual(values: WeeklyRead): Promise<void> {
        try {
            const column = await this.findAnnualColumn();
            const columnName = this.getColumnName(column + 2);
            const range = `${ANNUAL_SHEET}${columnName}5:${columnName}19`
            const body = {
                majorDimension: 'COLUMNS',
                values: this.formatValues(values)
            }
            await this.service.spreadsheets.values.update({
              spreadsheetId: ANNUAL_SPREADSHEET_ID,
              range: range,
              requestBody: body,
              valueInputOption: 'RAW'
            });
        } catch (error) {
            console.error(error);
        }
    }

    async copyWeekly(): Promise<void> {
        try {
            // will probably get a new ID back here and save as prop or return
            const newTitle = this.getNewTitle();
            this.newWeeklySpreadsheetId = await this.copyFile(this.weeklySpreadsheetTemplateId, newTitle);
        } catch (error) {
            console.error(error)
        }
    }

    async writeAnnualValuesToWeekly(): Promise<void> {
        try {
            if (!this.newWeeklySpreadsheetId) {
                throw new Error('NEED TO MAKE NEW SPREADSHEET FIRST');
            }
            const column = await this.findAnnualColumn();
            const columnName = this.getColumnName(column + 3);
            const range = `${ANNUAL_SHEET}${columnName}9:${columnName}19`
            const res = await this.service.spreadsheets.values.get({
                spreadsheetId: this.annualSpreadsheetId,
                range
            });
            if (!res.data) {
                throw new Error(`NO DATA FROM ANNUAL SPREADSHEET FOR ${this.nextWeekEndingDate}`);
            }
            const body = {
                values: res.data.values
            }
            await this.service.spreadsheets.values.update({
              spreadsheetId: this.newWeeklySpreadsheetId,
              range: DAILY_EXPENSES_RANGE_BUDGET,
              requestBody: body,
              valueInputOption: 'RAW'
            });
            // TODO -> just for testing
            // const [expenses, balances, earnings] = await mockSheetsBatch();
        } catch (error) {
            console.error(error);
        }
    }

    writeStartingBalancesToWeekly(): void {
        throw 'NOT IMPLEMENTED';
    }
}