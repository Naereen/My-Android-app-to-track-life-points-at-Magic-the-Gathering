<script lang="ts">
	import { confirmModalData, respondConfirm } from '$lib/store/modal';
	import X from '$lib/assets/icons/X.svelte';
	import { _ } from 'svelte-i18n';

	export let confirmText = $_('confirm_modal');
	export let cancelText = $_('cancel_modal');
</script>

{#if $confirmModalData.isOpen}
	<div
		class="bg-black/70 absolute w-full h-full top-0 left-0 flex justify-center items-center"
		on:click={() => respondConfirm(false)}
		role="button"
		aria-label="close dialog"
		tabindex="0"
		on:keydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				respondConfirm(false);
			}
		}}
	>
		<div
			on:click|stopPropagation
			role="dialog"
			aria-modal="true"
			tabindex="0"
			on:keydown={(e) => {
				if (e.key === 'Escape') {
					respondConfirm(false);
				}
			}}
			class="bg-white max-w-80 w-11/12 max-h-80 rounded-[1rem] flex flex-col justify-center items-center text-black p-4 relative"
		>
			<button class="absolute right-3 top-3" on:click={() => respondConfirm(false)} on:contextmenu|preventDefault draggable="false"><X /></button>
			<div class="p-4 text-center">
				<p class="text-lg font-semibold mb-4">{$confirmModalData.message}</p>
				<div class="flex gap-4 justify-center">
					<button class="px-4 py-2 rounded-lg text-lg bg-gray-200" on:click={() => respondConfirm(false)}>{cancelText}</button>
					<button class="px-4 py-2 rounded-lg text-lg bg-red-600 text-white" on:click={() => respondConfirm(true)}>{confirmText}</button>
				</div>
			</div>
		</div>
	</div>
{/if}
