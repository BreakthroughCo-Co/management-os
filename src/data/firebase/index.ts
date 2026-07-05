/**
 * Alias module: @/data/firebase
 * Re-exports Firebase services from the canonical initialisation module
 * at src/lib/firebase.ts so that both relative and @-alias imports work
 * consistently across the codebase.
 */
import app, { auth, db, storage } from "../../lib/firebase";

export { app, auth, db, storage };
export default app;
