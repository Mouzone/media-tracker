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

<div id="banner">
	Media Tracker
	<button
		type="button"
		id="create"
		onclick={() => create()}
	>
		Add
	</button>
</div>
<ul>
	{#each records as record (record.id)}
		<RecordThumbnail
			{record}
			{selectRecord}
		/>
	{/each}
	{#if isFormVisible}
		<Form
			record={selectedRecord}
			onClose={closeForm}
		/>
	{/if}
</ul>

<style>
	#banner {
		background-color: chartreuse;
		font-weight: bold;
		font-size: 6em;
		padding: 0.4em;
	}

	ul {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(16em, 1fr));
		grid-template-rows: masonry;
		gap: 0;

		padding: 1em;
		justify-items: center;
	}
</style>
