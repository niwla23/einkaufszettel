<script lang="ts">
	import UiButton from '$lib/UiButton.svelte';
	import { getAuthedClientPb, pb } from '$lib/helpers';
	import { onMount } from 'svelte';
	import { Avatar } from 'flowbite-svelte';

	let user;
	let lists;

	onMount(async () => {
		await getAuthedClientPb();
		user = await pb.collection('users').getOne(pb.authStore.model.id, { expand: 'lists.ownedBy' });
		// lists = user.expand.lists.map(list => {list, getListUsers(list)});

		lists = await Promise.all(
			user.expand.lists.map(async (list) => {
				const users = await getListUsers(list);
				return { ...list, users };
			})
		);

		console.log(lists);
	});

	async function getListUsers(list) {
		const users = await pb
			.collection('users')
			.getFullList({ filter: pb.filter('lists ~ {:listId}', { listId: list.id }) });
		console.log(users);
		return users;
	}

	function getOwnershipText(list) {
		if (list.ownedBy == user.id) {
			return 'Gehört dir';
		} else {
			return `Gehört ${list.expand.ownedBy.name || list.expand.ownedBy.email}`;
		}
	}
</script>

<div class="p-2">
	<!-- {JSON.stringify(lists)} -->
	<h1 class="pb-2 pt-8 text-3xl font-semibold">Einkaufslisten</h1>
	<ul class="flex flex-col gap-2">
		<li>
			<UiButton>Neue Liste erstellen</UiButton>
		</li>

		{#each lists as list}
			<a href="/lists/{list.id}">
				<li class="flex items-center justify-between rounded-lg bg-white p-2 shadow-md">
					<div>
						{list.name}

						<div class="text-sm text-gray-800">
							{getOwnershipText(list)}
						</div>
					</div>

					<div class="flex">
						{#each list.users as user}
							<Avatar
								stacked
								src={pb.files.getURL(user, user.avatar, { thumb: '100x100' })}
								size="md"
							>
								{user.name.slice(0, 2)}
							</Avatar>
						{/each}
					</div>
				</li>
			</a>
		{/each}
	</ul>
</div>
