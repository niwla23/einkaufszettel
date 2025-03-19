<script lang="ts">
	// we do not talk about this

	export let appearance: 'normal' | 'normal2' | 'danger' | 'success' | 'none' = 'none';
	let userClass = '';
	export { userClass as class };
	export let disabled = false;

	const styledBtnClassNames =
		'w-full rounded-lg px-4 py-2 text-center font-semibold shadow-md transition duration-150 ease-in-out  focus:outline-none focus:ring-2 focus:ring-gray-300';

	const additionalClassNamesPre = {
		normal: 'p-4 bg-white text-gray-800 hover:bg-gray-100',
		normal2: 'p-4 bg-black text-gray-100 hover:bg-gray-800',
		danger: 'p-4 bg-red-700',
		success: 'p-4 bg-green-300 text-white',
		none: ''
	}[appearance];
	const extra = disabled ? ' text-gray-800' : '';

	let btnClassNames = styledBtnClassNames + ' ' + additionalClassNamesPre + extra + ' ' + userClass;
	if (appearance == 'none') {
		btnClassNames = '';
	}
</script>

<button class={btnClassNames} {disabled} on:click>
	<slot />
</button>
