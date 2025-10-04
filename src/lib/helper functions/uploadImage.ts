import { supabase } from "$lib/supabaseClient.js";
import { randomUUID } from "node:crypto";
import path from "node:path";

export default async function createImage(cover_image: File) {
	const uuid = randomUUID();
	const file_extension = path.extname(cover_image.name);
	const file_name = `${uuid}${file_extension}`;

	await supabase.storage.from("cover_images").upload(file_name, cover_image);

	return supabase.storage.from("cover_images").getPublicUrl(file_name)[
		"data"
	]["publicUrl"];
}
