<script>
	import { enhance } from "$app/forms";
	let { record, onClose } = $props();
	const { title = "", media_type = "audio", cover_image_url = "" } = record;
</script>

<form
	method="POST"
	action="?/create"
	enctype="multipart/form-data"
	use:enhance
>
	<img
		src={cover_image_url}
		alt="missing"
	/>

	<label>
		Title
		<input
			name="title"
			autocomplete="off"
			value={title}
			required
		/>
	</label>

	<label>
		Media Type
		<select
			name="media_type"
			value={media_type}
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

	<div id="buttons">
		<button
			type="button"
			onclick={() => onClose()}
		>
			Exit</button
		>
		<button type="submit"> Submit </button>
	</div>
</form>

<style>
	form {
		position: absolute;
		display: flex;
		flex-direction: column;
		gap: 1em;
		background-color: antiquewhite;
		border: 3px solid black;
		border-radius: 20px;
		width: min(30em, 80%);
		padding: 20px;

		align-items: center;
	}
	img {
		width: 20em;
	}
	div#buttons {
		display: flex;
		gap: 1em;
	}
</style>
