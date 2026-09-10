import type { APIRoute } from 'astro';
import { evidence } from '@/data/records';
export const GET: APIRoute = () => new Response(JSON.stringify({ evidence }, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
