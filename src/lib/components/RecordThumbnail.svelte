<script>
	const { record, selectRecord } = $props();
</script>

<li>
	<button onclick={() => selectRecord(record.id)}>
		<img
			src={record.publicUrl}
			alt="missing"
		/>
		<p>{record.title}</p>
	</button>
</li>

<style>
	li {
		list-style: none;
		padding: 0;
	}
	button {
		background-color: white;
		border: none;
		position: relative;
		display: inline-block;
		line-height: 0;
		padding: 0;
	}
	img {
		display: block;
		object-fit: cover;
	}

	p {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;

		text-align: center;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		background-color: black;
		color: white;
		opacity: 80%;
		padding: 10px;
		box-sizing: border-box;

		transform: translateY(100%);

		transition: transform 0.3s ease-in-out;
	}

	button:hover p {
		transform: translateY(0);
	}
</style>
