import { fail } from "@sveltejs/kit";
import { supabase } from "$lib/supabaseClient.js";

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

		try {
			await supabase.from("media").insert({ title, media_type });
		} catch (error: any) {
			return fail(422, {
				title,
				error: error.message,
			});
		}
	},
};
