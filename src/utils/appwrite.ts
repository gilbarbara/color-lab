import { Account, Client, TablesDB } from 'appwrite';

import { API_ENDPOINT, PROJECT_ID } from '~/config/appwrite';

export const client = new Client().setEndpoint(API_ENDPOINT).setProject(PROJECT_ID);

export const account = new Account(client);
export const databases = new TablesDB(client);

export { ID } from 'appwrite';
