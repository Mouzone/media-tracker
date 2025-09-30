<script lang="ts">
	import type {
		SelectedRecordOptions,
		MediaPageData,
		Record,
	} from "$lib/types";
	import Form from "$lib/components/Form.svelte";
	const { data } = $props<{ data: MediaPageData }>();
	const records: Record[] = data.media;

	let selectedRecord = $state<SelectedRecordOptions>(null);
	let isFormVisible = $derived(selectedRecord !== null);

	function selectRecord(recordId: Record["id"]) {
		selectedRecord = records.find((r) => r.id === recordId);
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
		<li>
			<button onclick={() => selectRecord(record.id)}>
				<img
					src={record.cover_image_url}
					alt="missing"
				/>
				<p>{record.title}</p>
			</button>
		</li>
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
