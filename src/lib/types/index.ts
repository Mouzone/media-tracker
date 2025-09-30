export interface Record {
	id: number;
	title: string;
	media_type: "audio" | "movie" | "tv_show" | "book";
	cover_image_url: string;
	created_at: string;
}

export interface MediaPageData {
	media: Record[];
}

export type SelectedRecordOptions = null | Record | {};
