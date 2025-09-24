<script>
	const { data } = $props();
</script>

<div id="banner">Media Tracker</div>
<div>
	{#each data.media as record}
		<li>{record.title}</li>
	{/each}
</div>

<style>
	#banner {
		background-color: chartreuse;
		font-weight: bold;
		font-size: 8em;
		padding: 0.4em;
	}
</style>
