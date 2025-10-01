<script>
	const { record, selectRecord } = $props();

	let isHovering = $state(false);
</script>

<li>
	<button
		onclick={() => selectRecord(record.id)}
		onmouseenter={() => (isHovering = true)}
		onmouseleave={() => (isHovering = false)}
	>
		<img
			src={record.cover_image_url}
			alt="missing"
		/>
		<p class={{ show: isHovering }}>{record.title}</p>
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

		overflow: hidden;
	}
	img {
		display: block;
		width: 20em;
		height: auto;
	}

	p {
		position: absolute;
		bottom: -15px;
		left: 0;
		width: 100%;

		text-align: center;
		overflow: hidden;
		background-color: black;
		color: white;
		opacity: 60%;
		padding: 10px;
		box-sizing: border-box;

		transform: translateY(100%);

		transition: transform 0.3s ease-out;
	}

	p.show {
		transform: translateY(0);
	}
</style>
