import { Auth, google } from 'googleapis';
import { JSONClient } from 'google-auth-library/build/src/auth/googleauth';
import { BUDGET_FOLDER_ID } from '../spreadsheetIds';
export class GoogleService {
    auth: Auth.OAuth2Client | JSONClient;
    constructor(auth: Auth.OAuth2Client | JSONClient) {
        this.auth = auth;
    }

    getFileId(name: string): Promise<string> {
        return new Promise(async (res, rej) => {
            try {
                const drive = google.drive({version: 'v3', auth: this.auth});

                // this is just a query tacked on to the end of the request... the 'parents in' is
                // the directory that my budget is located -> My Drive/Budget/Details/<Current_Year>
                const files = await drive.files.list({
                    q: `name='${name}' and parents in '${BUDGET_FOLDER_ID}'`
                });
                const id = files?.data?.files?.[0]?.id;
                if (!id) {
                    throw new Error(`id for ${name} not found`);
                }
                res(id);
            } catch (error) {
                rej(error);
            }
        });
    }
}