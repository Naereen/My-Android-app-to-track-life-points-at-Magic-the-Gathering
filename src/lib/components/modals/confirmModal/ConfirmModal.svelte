<script lang="ts">
	import { confirmModalData, respondConfirm } from '$lib/store/modal';
	import X from '$lib/assets/icons/X.svelte';
	import { _ } from 'svelte-i18n';

	export let confirmText = $_('confirm_modal');
	export let cancelText = $_('cancel_modal');

	let checkboxValues: boolean[] = [];
	let radioValue: number = 0;
	let previousIsOpen = false;

	// Reset checkbox and radio values only when modal transitions from closed to open
	$: if ($confirmModalData.isOpen && !previousIsOpen) {
		const labels = $confirmModalData.checkboxLabel;
		const def = $confirmModalData.checkboxDefaultValue;
		if (Array.isArray(labels)) {
			const defs = Array.isArray(def) ? def : [];
			checkboxValues = labels.map((_, i) => defs[i] ?? false);
		} else {
			checkboxValues = [Array.isArray(def) ? (def[0] ?? false) : (def ?? false)];
		}
		radioValue = $confirmModalData.radioDefaultValue ?? 0;
		previousIsOpen = true;
	} else if (!$confirmModalData.isOpen) {
		previousIsOpen = false;
	}

	/**
	 * Returns checkbox payload in the shape expected by confirm modal consumers.
	 * Multi-checkbox mode returns `boolean[]`, single-checkbox mode returns `boolean`.
	 * @returns {unknown} Result produced by getCheckboxValue.
	 * @throws {Error} Propagates runtime errors from dependent browser, network, or store APIs.
	 */
	function getCheckboxValue() {
		return Array.isArray($confirmModalData.checkboxLabel)
			? checkboxValues
			: (checkboxValues[0] ?? false);
	}
</script>

{#if $confirmModalData.isOpen}
	<div
		class="fixed inset-0 z-[200] flex items-center justify-center bg-black/70"
		on:click={() => respondConfirm(false, getCheckboxValue(), radioValue)}
		role="button"
		aria-label="close dialog"
		tabindex="0"
		on:keydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				respondConfirm(false, getCheckboxValue(), radioValue);
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
					respondConfirm(false, getCheckboxValue(), radioValue);
				}
			}}
			class="bg-white max-w-[85%] w-11/12 max-h-120 rounded-[1rem] flex flex-col justify-center items-center text-black p-5 relative overflow-y-auto"
		>
			<button
				class="absolute right-3 top-3"
				on:click={() => respondConfirm(false, getCheckboxValue(), radioValue)}
				on:contextmenu|preventDefault
				draggable="false"><X /></button
			>
			<div class="p-5 text-center max-w-[120%]">
				<p class="text-xl font-bold mb-4">{$confirmModalData.message}</p>
				{#if $confirmModalData.checkboxLabel}
					{#if Array.isArray($confirmModalData.checkboxLabel)}
						<div class="mb-4 flex flex-col items-start gap-2">
							{#each $confirmModalData.checkboxLabel as label, i}
								<div class="flex items-center gap-2">
									<input
										type="checkbox"
										id={'confirm-checkbox-' + i}
										bind:checked={checkboxValues[i]}
									/>
									<label for={'confirm-checkbox-' + i} class="text-sm">{label}</label>
								</div>
							{/each}
						</div>
					{:else}
						<div class="mb-4 flex items-center justify-center gap-2">
							<input type="checkbox" id="confirm-checkbox" bind:checked={checkboxValues[0]} />
							<label for="confirm-checkbox" class="text-sm">{$confirmModalData.checkboxLabel}</label
							>
						</div>
					{/if}
				{/if}
				{#if $confirmModalData.radioOptions && $confirmModalData.radioOptions.length > 0}
					<div class="mb-4 flex flex-col items-start gap-2">
						{#if $confirmModalData.radioGroupLabel}
							<p class="text-sm font-semibold">{$confirmModalData.radioGroupLabel}</p>
						{/if}
						{#each $confirmModalData.radioOptions as option, i}
							<div class="flex items-center gap-2">
								<input
									type="radio"
									id={'confirm-radio-' + i}
									name="confirm-radio-group"
									value={i}
									bind:group={radioValue}
								/>
								<label for={'confirm-radio-' + i} class="text-sm">{option}</label>
							</div>
						{/each}
					</div>
				{/if}
				<div class="flex gap-4 justify-center">
					<button
						class="px-4 py-2 rounded-lg text-lg bg-gray-200"
						on:click={() => respondConfirm(false, getCheckboxValue(), radioValue)}
						>{cancelText}</button
					>
					<button
						class="px-4 py-2 rounded-lg text-lg bg-cyan-600 text-white"
						on:click={() => respondConfirm(true, getCheckboxValue(), radioValue)}
						>{confirmText}</button
					>
				</div>
			</div>
		</div>
	</div>
{/if}
