<script lang="ts">
	import { page } from '$app/stores';
	import { getAuthedClientPb, pb, updateEntry } from '$lib/helpers';
	import { onMount } from 'svelte';
	import Swal from 'sweetalert2';
	import Icon from '@iconify/svelte';
	import UiButton from '$lib/UiButton.svelte';
	import { Avatar } from 'flowbite-svelte';
	import { Rating } from '@skeletonlabs/skeleton-svelte';

	let listData = {};
	let listEntries = [];

	onMount(async () => {
		await getAuthedClientPb();

		listData = await pb.collection('lists').getOne($page.params.id);

		const listEntriesFetchConfig = {
			filter: pb.filter('list = {:listId}', { listId: $page.params.id }),
			expand: 'addedBy,stores'
		};
		listEntries = (await pb.collection('listEntries').getFullList(listEntriesFetchConfig)).filter(
			(item) => item.amount > 0
		);

		// Subscribe to real-time updates on listEntries.
		await pb.collection('listEntries').subscribe(
			'*',
			function (e) {
				const { action, record } = e;

				// Handle real-time actions.
				if (action === 'create') {
					// Add new item.
					if (record.amount > 0) {
						listEntries = [...listEntries, record];
					}
				} else if (action === 'update' && record.amount > 0) {
					// Update existing item.
					listEntries = listEntries.map((item) => (item.id === record.id ? record : item));
				} else if (action === 'delete' || (action == 'update' && record.amount == 0)) {
					// Remove deleted item.
					listEntries = listEntries.filter((item) => item.id !== record.id);
				}

				console.log(action, record);
			},
			listEntriesFetchConfig
		);
		console.log(listData, listEntries);

		const user = await pb.collection('users').getOne(pb.authStore.model.id);
		if (!user.lists.includes($page.params.id)) {
			await pb.collection('users').update(user.id, { 'lists+': $page.params.id });
		}
	});
</script>

<div class="flex items-center justify-between">
	<h1 class="px-4 text-2xl font-semibold">{listData.name}</h1>
	<div class="flex">
		<a href="{$page.params.id}/addScan" class="p-4">
			<Icon icon="material-symbols:share" height="20" />
		</a>
		<a href="{$page.params.id}/addScan" class="p-4">
			<Icon icon="material-symbols:barcode-scanner-rounded" height="20" />
		</a>
	</div>
</div>

<!-- List -->
<ul class="space-y-4 px-2 pb-4">
	{#each listEntries as item}
		{@const user = item.expand.addedBy}
		<li
			class="flex gap-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md"
		>
			<div class="h-28 w-28 overflow-hidden rounded-lg bg-gray-50">
				<img
					alt="product"
					src={pb.files.getURL(item, item.image)}
					class="h-full w-full object-cover"
				/>
			</div>
			<div class="flex flex-1 flex-col gap-2">
				<div class="text-lg font-medium text-gray-900">{item.name}</div>
				<div class="flex items-center gap-2">
					<button
						class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
						on:click={() => updateEntry(item.id, { amount: item.amount - 1 })}
					>
						-
					</button>
					<input
						type="number"
						class="w-12 rounded-md border bg-gray-50 p-1 text-center focus:border-transparent focus:ring-2 focus:ring-blue-500"
						value={item.amount}
						on:change={(e) => updateEntry(item.id, { amount: e.currentTarget.value })}
					/>
					<button
						class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
						on:click={() => updateEntry(item.id, { amount: item.amount + 1 })}
					>
						+
					</button>
				</div>
				<div>
					<Rating
						value={item.personalRating}
						onValueChange={(e) => updateEntry(item.id, { personalRating: e.value })}
						gap="2"
						controlGap="gap-1"
					/>
				</div>
				<div class="flex justify-between">
					<Avatar src={pb.files.getURL(user, user.avatar, { thumb: '100x100' })} size="md">
						{user.name.slice(0, 2)}
					</Avatar>
					<div class="text-sm text-gray-600">
						{item.expand.stores && item.expand.stores.map((v) => v.name)}
					</div>
					<div>
						<UiButton
							appearance="success"
							on:click={() => updateEntry(item.id, { amount: 0 }, true)}
							><Icon icon="mdi:check" /></UiButton
						>
					</div>
				</div>
			</div>
		</li>
	{/each}
</ul>
