import { fail } from "@sveltejs/kit";
import { supabase } from "$lib/supabaseClient.js";
import { randomUUID } from "node:crypto";

export async function load() {
	const { data, error } = await supabase.from("media").select();
	return {
		media: data ?? [],
	};
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();

		const title = data.get("title");
		const media_type = data.get("media_type");
		const cover_image = data.get("cover_image");

		if (!cover_image) {
			return;
		}

		try {
			const uuid = randomUUID();
			await supabase.storage
				.from("cover_images")
				.upload(`${uuid}`, cover_image);
			const cover_image_url = supabase.storage
				.from("cover_images")
				.getPublicUrl(uuid)["data"]["publicUrl"];
			await supabase
				.from("media")
				.insert({ title, media_type, cover_image_url });
		} catch (error: any) {
			return fail(422, {
				title,
				error: error.message,
			});
		}
	},
};
