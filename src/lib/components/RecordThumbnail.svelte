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
		height: 10em;
		width: 12em;
	}
	img {
		width: 100%;
	}

	p {
		text-align: center;
		overflow: hidden;
	}
</style>
