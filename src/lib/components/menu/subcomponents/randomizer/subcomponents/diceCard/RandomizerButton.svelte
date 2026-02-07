<script lang="ts">
	export let text = '';
</script>

<div class="w-24 h-24 rounded-[3rem]">
	<button
		on:click
		on:contextmenu|preventDefault
		draggable="false"
		class="bg-[#2d2f30] w-24 h-24 rounded-3xl flex justify-center items-center"
	>
		<slot />
	</button>
	<p class="text-center text-sm mt-1" style="font-size: 1.1rem;">{text}</p>
</div>
