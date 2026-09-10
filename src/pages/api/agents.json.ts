import type { APIRoute } from 'astro';
import { agents } from '@/data/records';
export const GET: APIRoute = () => new Response(JSON.stringify({ agents }, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
