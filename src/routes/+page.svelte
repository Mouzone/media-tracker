<script lang="ts">
	import type {
		SelectedRecordOptions,
		MediaPageData,
		Record,
	} from "$lib/types";
	import Form from "$lib/components/Form.svelte";
	import RecordThumbnail from "$lib/components/RecordThumbnail.svelte";
	import AddButton from "$lib/components/AddButton.svelte";

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

	function handleFormDelete(deleteId: number) {
		records = records.filter((r) => r.id !== deleteId);
		closeForm();
	}

	function handleFormUpdate(updateId: number, updateData: Record) {
		records = records.map((r) => {
			if (r.id === updateId) {
				return updateData;
			}
			return r;
		});
		closeForm();
	}
</script>

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
			onDelete={handleFormDelete}
			onUpdate={handleFormUpdate}
		/>
	{/if}
	<AddButton {create} />
</ul>

<style>
	ul {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		grid-template-rows: auto;
		gap: 0;

		padding: 1em;
		justify-items: center;
	}
</style>
