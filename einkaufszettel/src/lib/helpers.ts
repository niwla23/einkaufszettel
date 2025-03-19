import PocketBase from "pocketbase"
import Swal from "sweetalert2"

export const pb = new PocketBase("https://einkaufszettel-backend.noteqr.de")

export async function getAuthedClientPb() {
  // await pb.admins.authWithPassword(env.PB_USER, env.PB_PASSWORD)
  console.log(pb.authStore.model && pb.authStore.isValid)
  if (!pb.authStore.model || !pb.authStore.isValid) {
    await Swal.fire("please login :)))")
    console.log("google login start")
    await pb.collection("users").authWithOAuth2({ provider: 'google' })
  }
  return pb
}


export async function updateEntry(id: string, data: object, force = false) {
  data.addedBy = pb.authStore.model.id;
  if (data.amount < 1) {
    if (!force) {
      const result = await Swal.fire({ title: 'Löschen?', showCancelButton: true });
      if (!result.isConfirmed) {
        data.amount = 1;
      }
    }
    pb.collection('listEntries').update(id, data);
  } else {
    pb.collection('listEntries').update(id, data);
  }
}
