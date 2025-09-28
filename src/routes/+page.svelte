<script>
	import Form from "$lib/components/Form.svelte";
	const { data } = $props();
	let showForm = $state(false);

	function toggleForm() {
		showForm = !showForm;
	}
</script>

<div id="banner">Media Tracker</div>
<ul>
	<button
		type="button"
		id="create"
		onclick={() => toggleForm()}>Add</button
	>
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

{#if showForm}
	<Form />
{/if}

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
