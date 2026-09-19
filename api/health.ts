import type { IncomingMessage, ServerResponse } from 'http'
import { handleHealthApi } from '../server/gemini.ts'

export default function handler(req: IncomingMessage, res: ServerResponse) {
  handleHealthApi(req, res)
}
