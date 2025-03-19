<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div class="flex min-h-dvh w-full justify-center bg-gray-100">
	<main class="w-full max-w-3xl p-0 font-ui">
		{@render children()}
	</main>
</div>
