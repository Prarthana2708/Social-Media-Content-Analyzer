 
import { Client, Databases } from "appwrite";
 
const client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1")  
  .setProject("68b3e39600269886bf3a");

export const databases = new Databases(client);
