import type { RequestHandler } from "@sveltejs/kit";
import { pb, pbAuth, sendJson } from "$lib/serverHelpers";
import OpenFoodFacts from "openfoodfacts-nodejs";
import PocketBase from "pocketbase"

async function downloadFileAndCreateFormData(url: string | undefined) {

  const form = new FormData();
  if (url) {

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);

    const fileBuffer = await response.arrayBuffer();
    const fileBlob = new Blob([fileBuffer]);

    form.append('image', fileBlob, `off_image_${url.split("/").slice(-1)}`);
  }
  return form;
}



export const POST: RequestHandler = async (event) => {
  const reqBody = await event.request.json()
  const listId = reqBody.listId;
  const ean = reqBody.ean;

  await pbAuth();

  const userPb = new PocketBase("https://einkaufszettel-backend.noteqr.de")
  const cookiesString = event.cookies.getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');
  console.log("cookie", cookiesString, event.cookies.getAll())
  userPb.authStore.loadFromCookie(cookiesString);
  console.log(userPb.authStore.isValid)

  let listEntry;
  try {
    listEntry = await userPb.collection("listEntries").getFirstListItem(userPb.filter("ean = {:ean}", { ean }))
    if (listEntry.amount == 0) {
      await userPb.collection("listEntries").update(listEntry.id, { amount: 1 });
    } else {
      return sendJson({ "error": "already on list" }, 409)
    }
  } catch {
    // @ts-expect-error idk
    const client: OpenFoodFacts.OFF = new OpenFoodFacts();
    const productData = await client.getProduct(ean);
    console.log(productData)
    if (productData.status_verbose == 'product not found') {
      return sendJson({ "error": "product not found" }, 404)
    }
    // console.log(productData)
    const formData = await downloadFileAndCreateFormData(productData.product.image_url)
    formData.set("name", productData.product.product_name)
    formData.set("ean", ean)
    formData.set("amount", "1")
    formData.set("list", listId)
    formData.set("addedBy", userPb.authStore.model.id)
    console.log("creati")
    listEntry = await userPb.collection("listEntries").create(formData)
    console.log("creati2")
  }

  return sendJson({ "error": null }, 200)
}

