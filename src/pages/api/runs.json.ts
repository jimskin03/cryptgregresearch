import type { APIRoute } from 'astro';
import { runs } from '@/data/records';
export const GET: APIRoute = () => new Response(JSON.stringify({ runs }, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
