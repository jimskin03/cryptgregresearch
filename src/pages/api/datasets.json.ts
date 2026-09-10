import type { APIRoute } from 'astro';
import { datasets } from '@/data/records';
export const GET: APIRoute = () => new Response(JSON.stringify({ datasets }, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
