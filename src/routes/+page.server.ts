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
			const cover_image_url = await uploadImage(cover_image);
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
		const cover_image_url = String(data.get("cover_image_url"));
		try {
			if (!cover_image_url) {
				return;
			}
			await supabase.storage
				.from("cover_images")
				.remove([cover_image_url]);
			const { data: recordToRemove, error: deleteError } = await supabase
				.from("media")
				.delete()
				.eq("id", id);

			// also delete the stored cover image
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
		// new cover image the user wants
		const cover_image = data.get("cover_image");
		// old url of what is currently rendered
		const cover_image_url = String(data.get("cover_image_url"));

		if (!cover_image_url) {
			return;
		}
		let new_cover_image_url = cover_image_url;
		if (cover_image && cover_image instanceof Blob) {
			await supabase.storage
				.from("cover_images")
				.remove([cover_image_url]);
			new_cover_image_url = await uploadImage(cover_image);
		}

		// remember to delete the old cover_image from the bucket

		const { data: updateData, error } = await supabase
			.from("media")
			.update({ title, media_type, cover_image_url: new_cover_image_url })
			.eq("id", id)
			.select()
			.single();

		console.log(updateData);
		return { success: 200, updateId: id, updateData };
	},
};
