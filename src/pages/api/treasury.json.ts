import type { APIRoute } from 'astro';
import { treasury } from '@/data/records';
export const GET: APIRoute = () => new Response(JSON.stringify(treasury, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
