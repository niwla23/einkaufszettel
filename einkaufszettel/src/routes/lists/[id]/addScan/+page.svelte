<script lang="ts">
	import { goto } from '$app/navigation';
	import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import UiButton from '$lib/UiButton.svelte';
	import { getAuthedClientPb, pb, updateEntry } from '$lib/helpers';
	import { Rating } from '@skeletonlabs/skeleton-svelte';

	let scanning = false;
	let torchOn = false;
	let status = 'find_code';
	let ean = '';
	let listEntries = [];

	let html5Qrcode: Html5Qrcode;

	function startScanner() {
		status = 'find_code';
		html5Qrcode.start(
			{ facingMode: 'environment' },
			{
				fps: 10,

				aspectRatio: 1
				// qrbox: { width: 250, height: 250 }
			},
			onScanSuccess,
			null
		);
		scanning = true;
	}

	async function loadList() {
		await getAuthedClientPb();
		const listData = await pb.collection('lists').getOne($page.params.id);

		const listEntriesFetchConfig = {
			filter: pb.filter('list = {:listId} && amount = 0', { listId: $page.params.id }),
			expand: 'addedBy,stores'
		};
		listEntries = await pb.collection('listEntries').getFullList(listEntriesFetchConfig);
		console.log(listData, listEntries);
	}

	async function addItem(id: string) {
		await updateEntry(id, { amount: 1 }, true);
		goto('.');
	}

	onMount(() => {
		html5Qrcode = new Html5Qrcode('reader');
		startScanner();

		loadList();
	});

	function setTorch(powerOn: boolean) {
		if (
			html5Qrcode.getState() === Html5QrcodeScannerState.SCANNING ||
			html5Qrcode.getState() === Html5QrcodeScannerState.PAUSED
		) {
			html5Qrcode.applyVideoConstraints({
				advanced: [{ torch: powerOn }]
			});
			torchOn = powerOn;
		}
	}

	function toggleTorch() {
		setTorch(!torchOn);
	}

	async function amountPlus1() {
		await getAuthedClientPb();
		const entry = await pb
			.collection('listEntries')
			.getFirstListItem(pb.filter('ean = {:ean}', { ean }));
		await pb
			.collection('listEntries')
			.update(entry.id, { amount: entry.amount + 1, addedBy: pb.authStore.model.id });
		goto(`/lists/${$page.params.id}`);
	}

	async function onScanSuccess(decodedText, decodedResult) {
		status = 'Suche Produkt...';
		navigator.vibrate(300);
		setTorch(false);
		await html5Qrcode.stop();
		scanning = false;
		console.log(decodedResult);
		ean = decodedResult.decodedText;

		const exportedCookie = pb.authStore.exportToCookie().replaceAll('HttpOnly; Secure; ', '');
		document.cookie = exportedCookie;
		console.log('set cookie', exportedCookie);

		const result = await fetch('/api/addByEan', {
			method: 'POST',
			body: JSON.stringify({ listId: $page.params.id, ean })
		});

		if (result.status == 409) {
			status = 'already_on_list';
		} else if (result.status == 404) {
			status = 'product_not_found';
		} else if (result.status == 200) {
			goto(`/lists/${$page.params.id}`);
		} else {
			status = 'error';
		}
	}
</script>

<main class="flex min-h-full flex-col gap-4 bg-white">
	<div class="p-2">
		{#if status === 'already_on_list'}
			<p class="text-warning">This product is already on your list.</p>
			<div class="flex gap-2">
				<UiButton appearance="normal" on:click={startScanner}>Scan another</UiButton>
				<UiButton appearance="normal" on:click={amountPlus1}>+1</UiButton>
			</div>
		{:else if status === 'product_not_found'}
			<p class="text-error">Product not found. Please try a different product.</p>
			<UiButton appearance="normal" on:click={startScanner}>Scan another</UiButton>
		{:else if status === 'find_code'}
			<p class="text-info">Bitte Barcode einscannen oder bekanntes Produkt auswählen</p>
		{:else if status === 'error'}
			<p class="text-error">An unexpected error occurred. Please try again later.</p>
			<UiButton appearance="normal" on:click={startScanner}>Scan another</UiButton>
		{/if}
	</div>

	<!-- <div class="fixed bottom-0 left-0 h-32 w-32"> -->
	<div class="flex justify-center">
		<reader id="reader" class="h-[90vw] min-h-[90vw] w-[90vw] bg-gray-500">
			<div>Scanner is loading...</div>
		</reader>
	</div>
	<!-- </div> -->
	<div class="absolute left-[5vw] top-[83vw] p-2">
		<UiButton appearance="normal" on:click={toggleTorch}>
			{torchOn ? 'Licht aus' : 'Licht an'}
		</UiButton>
	</div>
	<div class="flex h-full flex-col justify-between p-2 text-center text-black">
		<a href="."><UiButton appearance="normal2">Zurück zur Liste</UiButton></a>

		<!-- List -->
		<ul class="space-y-4 pb-4 pt-2">
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
						<div class="flex justify-between">
							<div class="text-sm text-gray-600">
								{item.expand.stores && item.expand.stores.map((v) => v.name)}
							</div>
							<div>
								<UiButton appearance="success" on:click={() => addItem(item.id)}
									><Icon icon="mdi:add" /></UiButton
								>
								<Rating
									value={item.personalRating}
									onValueChange={(e) => updateEntry(item.id, { personalRating: e.value })}
								/>
							</div>
						</div>
					</div>
				</li>
			{/each}
		</ul>
	</div>
</main>
