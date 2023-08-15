
import { google, Auth } from 'googleapis';
import { CREDENTIALS_PATH, SCOPES, TOKEN_PATH } from './constants';
import { JSONClient, GoogleAuth } from 'google-auth-library/build/src/auth/googleauth';
import { Impersonated } from 'google-auth-library';
import { authenticate } from '@google-cloud/local-auth';
import * as fs from 'fs';

// If modifying these scopes, delete token.json.
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
 async function loadSavedCredentialsIfExist(): Promise<Auth.Impersonated> {
    try {
      const content = await fs.promises.readFile(TOKEN_PATH);
      const credentials = JSON.parse(content.toString());
      return google.auth.fromJSON(credentials) as Exclude<Impersonated, Auth.GoogleAuth<JSONClient>>;
    } catch (err) {
      return null;
    }
  }
  
  /**
   * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
   *
   * @param {OAuth2Client} client
   * @return {Promise<void>}
   */
  async function saveCredentials(client: Auth.OAuth2Client) {
    const content = await fs.promises.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content.toString());
    console.log(keys);
    const key = keys?.installed || keys?.web;
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token,
    });
    // todo... let's not just write the creds here
    await fs.promises.writeFile(TOKEN_PATH, payload);
  }
  
  /**
   * Load or request or authorization to call APIs.
   *
   */
  export async function authorize(): Promise<Auth.Impersonated | Auth.OAuth2Client> {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
      return client;
    }
    const oAuthClient = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
    });
    if (oAuthClient.credentials) {
      await saveCredentials(oAuthClient);
    }
    return oAuthClient;
  }
  