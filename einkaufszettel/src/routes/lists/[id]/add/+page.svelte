<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getAuthedClientPb, pb } from '$lib/helpers';
	import UiButton from '$lib/UiButton.svelte';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let listData;
	let knownProducts = [];

	onMount(async () => {
		await getAuthedClientPb();

		listData = await pb.collection('lists').getOne($page.params.id);

		const listEntriesFetchConfig = {
			filter: pb.filter('list = {:listId}', { listId: $page.params.id }),
			expand: 'addedBy,stores'
		};
		knownProducts = await pb.collection('listEntries').getFullList(listEntriesFetchConfig);
	});

	async function addExistingProduct(productId) {
		pb.collection('listEntries').update(productId, { 'amount+': 1 });
		goto('.');
	}
</script>

<main>
	<h1 class="px-2 pb-2 pt-4 text-2xl">Produkt hinzufügen</h1>
	<div class="px-2 pb-4">
		<div class="flex gap-2">
			<input
				type="search"
				placeholder="Produkt suchen..."
				class="flex-1 rounded-lg border border-gray-200 p-2"
			/>
			<UiButton appearance="normal" class="w-auto" on:click={() => goto('addScan')}>
				<Icon icon="mdi:barcode-scan" class="h-5 w-5" />
			</UiButton>
		</div>
	</div>
	<ul class="space-y-4 px-2 pb-4">
		{#each knownProducts as item}
			{@const user = item.expand.addedBy}
			<button
				class="flex w-full gap-4 rounded-lg border border-gray-100 bg-white p-4 text-left shadow-sm transition-all hover:shadow-md"
				on:click={() => addExistingProduct(item.id)}
			>
				<div class="h-16 w-16 overflow-hidden rounded-lg bg-gray-50">
					<img
						alt="product"
						src={pb.files.getURL(item, item.image)}
						class="h-full w-full object-cover"
					/>
				</div>
				<div class="flex flex-1 flex-col gap-2">
					<div class="text-lg font-medium text-gray-900">
						<span>{item.name}</span>
						{#if item.amount > 0}
							<span><Icon icon="mdi:check-circle" /></span>
						{/if}
					</div>
				</div>
			</button>
		{/each}
	</ul>
</main>
