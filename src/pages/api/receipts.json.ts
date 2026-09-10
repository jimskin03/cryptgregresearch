import type { APIRoute } from 'astro';
import { receipts } from '@/data/records';
export const GET: APIRoute = () => new Response(JSON.stringify({ receipts }, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
