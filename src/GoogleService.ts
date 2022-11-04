import { Auth, google } from 'googleapis';
import { JSONClient } from 'google-auth-library/build/src/auth/googleauth';
export class GoogleService {
    auth: Auth.OAuth2Client | JSONClient;
    constructor(auth: Auth.OAuth2Client | JSONClient) {
        this.auth = auth;
        this.findFile();
    }

    findFile() {

        const drive = google.drive({version: 'v3', auth: this.auth});
        const files = drive.files.list({
            q: "name='Nov 4th'"
        });
        console.log(files);
    }
}