import { ANNUAL_SPREADSHEET_ID, WEEKLY_SPREADSHEET_ID } from "./constants";
import { AccountBalances, IncomeAccounts } from "./types";
import { Auth } from 'googleapis';
import { JSONClient } from 'google-auth-library/build/src/auth/googleauth';
import { GoogleService } from "./GoogleService";

export class SpreadsheetService extends GoogleService {

    // Properties
    accountBalances: AccountBalances | null;
    annualSpreadsheetId = ANNUAL_SPREADSHEET_ID;
    currentWeeklySpreadsheetId: string;
    income: IncomeAccounts | null;
    newWeeklySpreadsheetId: string | null;
    weekEndingDate: Date = new Date();
    weeklySpreadsheetTemplateId = WEEKLY_SPREADSHEET_ID;

    // CTOR
    constructor(auth: Auth.OAuth2Client | JSONClient) {
        super(auth);

        // gotta know which Friday we are doing
        const nextFriday = 5 - this.weekEndingDate.getDay();
        this.weekEndingDate.setDate(this.weekEndingDate.getDate() + nextFriday);
        this.currentWeeklySpreadsheetId = this.getWeeklySpreadsheetId();
    }

    // Private methods
    // this will be a helper function
    private readValuesFromSheet<T, T2>(options: T2): T {
        throw 'METHOD NOT IMPLEMENTED';
    }

    private getWeeklySpreadsheetId(): string {
        throw 'NOT IMPLEMENTED';
    }

    // Methods
    // ALL OF THESE PROBABLY NEED TO RETURN PROMISES
    getFinalValuesFromWeekly(): void {
        throw 'NOT IMPLEMENTED';
    }

    getFinalIncomeFromWeekly(): void {
        throw 'NOT IMPLEMENTED'
    }

    writeToAnnual(): void {
        throw 'NOT IMPLEMENTED';
    }

    copyWeekly(): void {
        // will probably get a new ID back here and save as prop
        throw 'NOT IMPLEMENTED';
    }

    copyAnnualValuesToWeekly(): void {
        throw 'NOT IMPLEMENTED';
    }

    copyStartingBalancesToWeekly(): void {
        throw 'NOT IMPLEMENTED';
    }
}