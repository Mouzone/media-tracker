import { fail } from "@sveltejs/kit";
import { supabase } from "$lib/supabaseClient.js";

export const actions = {
	create: async ({ cookies, request }) => {
		const { title, media_type } = await request.formData();

		const { error } = await supabase
			.from("media")
			.insert([{ title, media_type }]);
		try {
		} catch (error) {
			return fail(422, {
				title,
				error: error.message,
			});
		}
	},
};
