import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleChatApi } from '../server/gemini.js'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await handleChatApi(req, res)
}
