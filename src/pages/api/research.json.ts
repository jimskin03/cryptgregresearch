import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
export const GET: APIRoute = async () => { const research = await getCollection('research'); return new Response(JSON.stringify({ research: research.map(({ data, id }) => { const { id: _frontmatterId, ...metadata } = data; return { id, ...metadata, date: data.date.toISOString() }; }) }, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } }); };
