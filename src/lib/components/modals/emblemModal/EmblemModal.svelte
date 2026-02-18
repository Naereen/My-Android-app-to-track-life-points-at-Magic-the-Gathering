<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { emblemModalOpen, emblemState, closeSelectedEmblem } from '$lib/store/emblem';

	let currentFaceIndex = 0;
	let wasOpen = false;

	$: selected = $emblemState.selected;
	$: faces = selected?.faces ?? [];
	$: currentFace = faces[currentFaceIndex] ?? null;

	$: if ($emblemModalOpen && !wasOpen) {
		currentFaceIndex = 0;
		wasOpen = true;
	}

	$: if (!$emblemModalOpen && wasOpen) {
		wasOpen = false;
	}

	const handleAdvanceOrClose = () => {
		if (!selected) {
			closeSelectedEmblem();
			return;
		}

		if (currentFaceIndex < faces.length - 1) {
			currentFaceIndex += 1;
			return;
		}

		closeSelectedEmblem();
	};
</script>

<div
	class="bg-black/80 absolute w-full h-full top-0 left-0 flex justify-center items-center z-50"
	on:click={handleAdvanceOrClose}
	role="button"
	on:keydown={() => null}
	tabindex="0"
>
	<div
		on:click|stopPropagation={handleAdvanceOrClose}
		class="bg-[#2d2f30] rounded-[1.75rem] w-[92vw] max-h-[90vh] p-3 flex flex-col items-center"
		role="button"
		on:keydown={() => null}
		tabindex="0"
	>
		{#if selected && currentFace}
			<div class="w-full px-1 pt-1 pb-1 text-center text-white">
				<div class="text-xl md:text-2xl font-bold truncate">{selected.name}</div>
				{#if selected.set_name}
					<div class="text-xs text-gray-300">{selected.set_name}</div>
				{/if}
				<div class="text-xs text-gray-400 mt-1">
					{$_('emblem_face_of')} {currentFaceIndex + 1}/{faces.length}
				</div>
			</div>

			{#if currentFace.image}
				<div class="w-full flex justify-center items-center overflow-hidden">
					<img
						src={currentFace.image}
						alt={currentFace.name}
						class="max-h-[74vh] w-auto max-w-full object-contain rounded-xl"
						draggable="false"
					/>
				</div>
			{:else}
				<div class="text-gray-300 text-sm py-12">{$_('emblem_no_image')}</div>
			{/if}

			<div class="text-gray-300 text-sm py-2 text-center">
				{#if faces.length > 1 && currentFaceIndex === 0}
					{$_('emblem_tap_next_face')}
				{:else}
					{$_('emblem_tap_close')}
				{/if}
			</div>
		{/if}
	</div>
</div>
