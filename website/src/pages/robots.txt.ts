import type { APIRoute } from 'astro'
import { withBase } from '../lib/paths'

export const GET: APIRoute = ({ site }) =>
  new Response(
    `User-agent: *\nAllow: /\nSitemap: ${new URL(withBase(import.meta.env.BASE_URL, 'sitemap.xml'), site).href}\n`,
  )
