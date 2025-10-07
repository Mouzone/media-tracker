import { fail } from "@sveltejs/kit";
import { supabase } from "$lib/supabaseClient.js";
import uploadImage from "$lib/helper functions/uploadImage.js";

export async function load() {
	let { data, error } = await supabase.from("media").select();
	console.log(data);
	if (data) {
		data = data.map((record) => {
			const publicUrl = supabase.storage
				.from("cover_images")
				.getPublicUrl(record.cover_image_file).data.publicUrl;
			return {
				...record,
				publicUrl,
			};
		});
	}
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
			const cover_image_file = await uploadImage(cover_image);
			const { data: new_record, error: insertError } = await supabase
				.from("media")
				.insert({ title, media_type, cover_image_file })
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
		const cover_image_file = String(data.get("cover_image_file"));
		try {
			if (!cover_image_file) {
				return;
			}
			await supabase.storage
				.from("cover_images")
				.remove([cover_image_file]);
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
		const id = Number(data.get("id"));
		const title = data.get("title");
		const media_type = data.get("media_type");
		// new cover image the user wants
		const cover_image = data.get("cover_image");
		// old url of what is currently rendered
		const cover_image_file = String(data.get("cover_image_file"));

		if (!cover_image_file) {
			return;
		}
		let new_cover_image_file = cover_image_file;
		if (
			cover_image &&
			cover_image instanceof File &&
			cover_image.size !== 0
		) {
			await supabase.storage
				.from("cover_images")
				.remove([cover_image_file]);
			new_cover_image_file = await uploadImage(cover_image);
		}

		// remember to delete the old cover_image from the bucket

		const { data: updateData, error } = await supabase
			.from("media")
			.update({
				title,
				media_type,
				cover_image_file: new_cover_image_file,
			})
			.eq("id", id)
			.select()
			.single();

		return { success: true, updateId: id, updateData };
	},
};
