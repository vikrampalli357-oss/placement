import type { IncomingMessage, ServerResponse } from 'http'
import { handleChatApi } from '../server/gemini.ts'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await handleChatApi(req, res)
}
