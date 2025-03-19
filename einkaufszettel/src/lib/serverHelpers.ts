import { env } from "$env/dynamic/private"
import PocketBase from "pocketbase"

export const pb = new PocketBase("https://einkaufszettel-backend.noteqr.de")

export async function pbAuth() {
  await pb.admins.authWithPassword(env.PB_USER, env.PB_PASSWORD)
}

export function sendJson(data: unknown, status?: number) {
  return new Response(JSON.stringify(data), { status: status || 200 })
}

