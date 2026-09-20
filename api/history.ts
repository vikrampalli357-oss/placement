import type { IncomingMessage, ServerResponse } from 'http'
import { handleHistoryApi } from '../server/gemini'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await handleHistoryApi(req, res)
}
