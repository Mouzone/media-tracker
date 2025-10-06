<script>
	const { create } = $props();
</script>

<button
	type="button"
	id="create"
	onclick={() => create()}
>
	<svg
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<rect
			x="11"
			y="2"
			width="2"
			height="20"
			fill="currentColor"
		/>
		<rect
			x="2"
			y="11"
			width="20"
			height="2"
			fill="currentColor"
		/>
	</svg>
</button>

<style>
	button {
		width: 3em;
		height: 3em;
		margin: 0 1em 1em 0;
		position: fixed;
		bottom: 0;
		right: 0;
		border: none;
		background-color: white;
		border-radius: 50%;
		box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.3);
	}
</style>
