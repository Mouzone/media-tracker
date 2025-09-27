<script>
	import { enhance } from "$app/forms";
</script>

<form
	method="POST"
	action="?/create"
	enctype="multipart/form-data"
	use:enhance
>
	<label>
		Title
		<input
			name="title"
			autocomplete="off"
			required
		/>
	</label>

	<label>
		Media Type
		<select
			name="media_type"
			required
		>
			<option value="audio"> Audio </option>
			<option value="book"> Book </option>
			<option value="tv_show"> TV Show </option>
			<option value="movie"> Movie </option>
		</select>
	</label>

	<label>
		Cover Image
		<input
			name="cover_image"
			accept="image"
			type="file"
			required
		/>
	</label>

	<button type="submit"> Submit </button>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}
</style>
