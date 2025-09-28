<script>
	import Form from "$lib/components/Form.svelte";
	const { data } = $props();
</script>

<div id="banner">Media Tracker</div>
<ul>
	<li id="create">Add</li>
	{#each data.media as record}
		<li>
			<img
				src={record.cover_image_url}
				alt="missing"
			/>
			<p>{record.title}</p>
		</li>
	{/each}
</ul>
<Form />

<style>
	#banner {
		background-color: chartreuse;
		font-weight: bold;
		font-size: 8em;
		padding: 0.4em;
	}

	ul {
		display: flex;
		gap: 1em;
	}

	li {
		list-style: none;
		height: 10em;
		width: 12em;
	}
	img {
		width: 100%;
	}
</style>
