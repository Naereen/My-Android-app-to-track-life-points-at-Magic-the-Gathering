<script lang="ts">
	export let text = '';
</script>

<div class="w-24 h-24 rounded-[2rem]">
	<button on:click class="bg-[#2d2f30] w-24 h-24 rounded-3xl flex justify-center items-center">
		<slot />
	</button>
	<p class="text-center text-sm mt-1">{text}</p>
</div>
