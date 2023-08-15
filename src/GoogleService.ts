import { Auth, drive_v3, google } from 'googleapis';
import { BUDGET_DETAILS_FOLDER_ID, BUDGET_FOLDER_ID, DETAILS_PARENT_FOLDER_ID } from '../spreadsheetIds';
import { title } from 'process';
export class GoogleService {
    auth: Auth.OAuth2Client | Auth.Impersonated;
    drive: drive_v3.Drive;
    constructor(auth: Auth.OAuth2Client | Auth.Impersonated) {
        this.auth = auth;
        this.drive = google.drive({version: 'v3', auth: this.auth});
    }

    getFileId(name: string): Promise<string> {
        return new Promise(async (res, rej) => {
            try {

                // We could grab the folder id this way...could be something we cache
                // const folder = await drive.files.list({
                //     q: `name='2023' and parents in '${BUDGET_DETAILS_FOLDER_ID}'`
                // });

                // this is just a query tacked on to the end of the request... the 'parents in' is
                // the directory that my budget is located -> My Drive/Budget/Details/<Current_Year>
                const files = await this.drive.files.list({
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

    async copyFile(fileId: string, name?: string): Promise<string> {
        try {
            const options: {parents: string[], name?: string} = {
                // Should probably do this dynamically
                parents: [DETAILS_PARENT_FOLDER_ID]
            }
            if (name) {
                options.name = name;
            }
            const copy = await this.drive.files.copy({
                fileId,
                requestBody: options
            });
            return copy.data.id;
        } catch (error) {
            console.error(error);
        }
    }
}