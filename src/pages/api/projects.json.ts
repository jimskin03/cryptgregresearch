import type { APIRoute } from 'astro';
import { projects } from '@/data/records';
export const GET: APIRoute = () => new Response(JSON.stringify({ projects }, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
