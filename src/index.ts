import { google, Auth } from 'googleapis';
// import { JSONClient, GoogleAuth } from 'google-auth-library/build/src/auth/googleauth';
import { authorize } from './auth';
import { SpreadsheetService } from './SpreadsheetService';
import { ANNUAL_SPREADSHEET_ID } from '../spreadsheetIds';

const makeDate = (date: Date) => {
    return date.toISOString().split('T')[0]
}

/**
 * TODO -> this is how we find what the friday on annual, come back here
 */
async function listMajors(auth: Auth.OAuth2Client | Auth.GoogleAuth) {
  const sheets = google.sheets({version: 'v4', auth});
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: ANNUAL_SPREADSHEET_ID,
    range: 'Working!B2:BA2',
  });
  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    console.log('No data found.');
    return;
  }
  rows.forEach((row) => {
    row.forEach(date => {
        const budgetDay = new Date(date);
        const targetFriday = new Date()
        targetFriday.setDate(targetFriday.getDate() + 5);
        const nextFriday = 5 - targetFriday.getDay();
        targetFriday.setDate(targetFriday.getDate() + nextFriday);
        if (makeDate(budgetDay)=== makeDate(targetFriday)) {
            console.log(`target friday: ${budgetDay}`)
        } else {
            console.log(`${date}`);
        }

    })
  });
}

authorize().then((auth) => {
    // listMajors(auth)
    const spreadsheetService = new SpreadsheetService(auth);
}).catch(console.error);