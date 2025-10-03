<script lang="ts">
	import type {
		SelectedRecordOptions,
		MediaPageData,
		Record,
	} from "$lib/types";
	import Form from "$lib/components/Form.svelte";
	import RecordThumbnail from "$lib/components/RecordThumbnail.svelte";

	const { data } = $props<{ data: MediaPageData }>();
	let records: Record[] = $state(data.media);

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
	function handleFormSuccess(newRecord: Record) {
		records = [...records, newRecord];
		closeForm();
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
<hr />
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
			onSuccess={handleFormSuccess}
		/>
	{/if}
</ul>

<style>
	#banner {
		font-weight: bold;
		font-size: 6em;
		padding: 0;
		margin: 0;
	}

	ul {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(16em, 1fr));
		grid-template-rows: auto;
		gap: 0;

		padding: 1em;
		justify-items: center;
	}
</style>
