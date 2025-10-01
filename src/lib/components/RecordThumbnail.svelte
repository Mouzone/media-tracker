<script>
	const { record, selectRecord } = $props();
</script>

<li>
	<button onclick={() => selectRecord(record.id)}>
		<img
			src={record.cover_image_url}
			alt="missing"
		/>
		<p>{record.title}</p>
	</button>
</li>

<style>
	li {
		list-style: none;
	}
	button {
		background-color: white;
		border: none;
		position: relative;
		display: inline-block;
		line-height: 0;
	}
	img {
		display: block;
		width: 100%;
		height: auto;
	}

	p {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;

		text-align: center;
		overflow: hidden;
		background-color: black;
		color: white;
		opacity: 60%;
		padding: 10px;
		box-sizing: border-box;
	}
</style>
