import { fail } from "@sveltejs/kit";
import { supabase } from "$lib/supabaseClient.js";
import uploadImage from "$lib/helper functions/uploadImage.js";

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
			const cover_image_url = uploadImage(cover_image);
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
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get("id");

		try {
			const { data: recordToRemove, error: deleteError } = await supabase
				.from("media")
				.delete()
				.eq("id", id);

			if (deleteError) {
				throw new Error(deleteError.message);
			}

			return { success: true, deleteId: Number(id) };
		} catch (error: any) {
			return fail(500, { error: error.message });
		}
	},
	update: async ({ request }) => {
		const data = await request.formData();
		const id = data.get("id");
		const title = data.get("title");
		const media_type = data.get("media_type");
		const cover_image = data.get("cover_image");

		if (!cover_image || !(cover_image instanceof Blob)) {
			return;
		}

		const cover_image_url = uploadImage(cover_image);
	},
};
