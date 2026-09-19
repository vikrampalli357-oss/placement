import type { IncomingMessage, ServerResponse } from 'http'
import { handleHistoryApi } from '../server/gemini.ts'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await handleHistoryApi(req, res)
}
