import type { IncomingMessage, ServerResponse } from 'http'
import { handleChatApi } from '../server/gemini'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await handleChatApi(req, res)
}
