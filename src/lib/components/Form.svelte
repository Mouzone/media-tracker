<script>
	import { enhance } from "$app/forms";
	let { record, onClose, onSuccess, onDelete, onUpdate } = $props();
	const {
		id = "",
		title = "",
		media_type = "audio",
		cover_image_url = "",
	} = record;
	let isEdit = cover_image_url !== "";
</script>

<form
	method="POST"
	action="?/create"
	enctype="multipart/form-data"
	use:enhance={() => {
		return async ({ result, update }) => {
			if (result.type === "success") {
				if (result.data?.record) {
					onSuccess(result.data.record);
				} else if (result.data?.deleteId) {
					onDelete(result.data.deleteId);
				} else if (result.data?.updateId) {
					onUpdate(result.data.updateId, result.data.updateData);
				}
			} else {
				await update();
			}
		};
	}}
>
	{#if cover_image_url}
		<img
			src={cover_image_url}
			alt="missing"
		/>
	{/if}
	{#if isEdit}
		<input
			type="hidden"
			name="id"
			value={id}
		/>
		<input
			type="hidden"
			name="cover_image_url"
			value={cover_image_url}
		/>
	{/if}
	<div id="form-inputs">
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
				required={!isEdit}
			/>
		</label>

		<div id="buttons">
			{#if isEdit}
				<button formaction="?/delete"> Delete </button>
			{/if}
			<button
				type="button"
				onclick={() => onClose()}
			>
				Exit</button
			>
			{#if isEdit}
				<button formaction="?/update"> Update </button>
			{:else}
				<button type="submit"> Submit </button>
			{/if}
		</div>
	</div>
</form>

<style>
	form {
		position: fixed;
		display: flex;
		gap: 1em;
		background-color: white;
		box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.3);
		padding: 20px;
		border-radius: 10px;

		align-items: center;
	}
	img {
		width: 20em;
	}
	div#form-inputs {
		display: flex;
		flex-direction: column;
		gap: 2em;
	}
	div#buttons {
		display: flex;
		gap: 1em;
	}
</style>
