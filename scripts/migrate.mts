import { scriptDb } from "./db.mts";

const { migrate, close } = await scriptDb();
await migrate();
await close();
console.log("Database is up to date.");
