import type { APIRoute } from 'astro';
import { land } from '@/data/records';
export const GET: APIRoute = () => new Response(JSON.stringify(land, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
