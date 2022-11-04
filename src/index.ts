import { google, Auth } from 'googleapis';
import { JSONClient } from 'google-auth-library/build/src/auth/googleauth';
import { authorize } from './auth';
import { SpreadsheetService } from './SpreadsheetService';

const makeDate = (date: Date) => {
    return date.toISOString().split('T')[0]
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
async function listMajors(auth: Auth.OAuth2Client | JSONClient) {
  const sheets = google.sheets({version: 'v4', auth});
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1iG3CDtl14CVftOX5eINp8MJ9pKdqqrubKfpEPzcGUpY',
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