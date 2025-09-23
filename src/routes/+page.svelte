<form
	method="POST"
	action="?/create"
>
	<label>
		Name
		<input
			name="name"
			autocomplete="off"
			required
		/>
	</label>

	<label>
		Media Type
		<select
			name="media-type"
			required
		>
			<option> Audio </option>
			<option> Book </option>
			<option> TV Show </option>
			<option> Movie </option>
		</select>
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
