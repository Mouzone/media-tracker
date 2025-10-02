import { fail } from "@sveltejs/kit";
import { supabase } from "$lib/supabaseClient.js";
import { randomUUID } from "node:crypto";
import path from "node:path";

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

		if (!cover_image || !(cover_image instanceof Blob)) {
			return;
		}

		try {
			const uuid = randomUUID();
			const file_extension = path.extname(cover_image.name);
			const file_name = `${uuid}${file_extension}`;

			await supabase.storage
				.from("cover_images")
				.upload(file_name, cover_image);

			const cover_image_url = supabase.storage
				.from("cover_images")
				.getPublicUrl(file_name)["data"]["publicUrl"];

			const { data: new_record, error: insertError } = await supabase
				.from("media")
				.insert({ title, media_type, cover_image_url })
				.select()
				.single();

			if (insertError) {
				throw new Error(insertError.message);
			}

			return { success: true, record: new_record };
		} catch (error: any) {
			return fail(422, {
				title,
				error: error.message,
			});
		}
	},
};
