import { auth, toNextJsHandler } from "@server/lib/auth"; // path to your auth file

export const { POST, GET } = toNextJsHandler(auth);