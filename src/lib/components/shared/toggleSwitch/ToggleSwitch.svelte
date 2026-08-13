<script lang="ts">
	export let checked: boolean = false;
	export let disabled: boolean = false;
</script>

<div class="relative flex-shrink-0">
	<input type="checkbox" class="sr-only peer" {checked} {disabled} on:change />
	<div
		class="w-11 h-6 rounded-full peer transition-colors
			{disabled ? 'opacity-40 cursor-not-allowed' : ''}
			bg-gray-600 peer-checked:bg-blue-500
			after:content-[''] after:absolute after:top-0.5 after:left-[2px]
			after:bg-white after:rounded-full after:h-5 after:w-5
			after:transition-all peer-checked:after:translate-x-full"
	/>
</div>
