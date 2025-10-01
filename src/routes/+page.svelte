<script lang="ts">
	import type {
		SelectedRecordOptions,
		MediaPageData,
		Record,
	} from "$lib/types";
	import Form from "$lib/components/Form.svelte";
	import RecordThumbnail from "$lib/components/RecordThumbnail.svelte";

	const { data } = $props<{ data: MediaPageData }>();
	const records: Record[] = data.media;

	let selectedRecord = $state<SelectedRecordOptions>(null);
	let isFormVisible = $derived(selectedRecord !== null);

	function selectRecord(recordId: Record["id"]) {
		selectedRecord = records.find((r) => r.id === recordId)!;
	}

	function create() {
		selectedRecord = {};
	}

	function closeForm() {
		selectedRecord = null;
	}
</script>

<div id="banner">Media Tracker</div>
<ul>
	<button
		type="button"
		id="create"
		onclick={() => create()}>Add</button
	>
	{#each records as record (record.id)}
		<RecordThumbnail
			{record}
			{selectRecord}
		/>
	{/each}
</ul>

{#if isFormVisible}
	<Form
		record={selectedRecord}
		onClose={closeForm}
	/>
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
</style>
