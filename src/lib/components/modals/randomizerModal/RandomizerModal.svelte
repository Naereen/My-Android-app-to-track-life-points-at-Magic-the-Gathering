<script>
	import Deight from '$lib/assets/icons/Deight.svelte';
	import Dfour from '$lib/assets/icons/Dfour.svelte';
	import Dsix from '$lib/assets/icons/Dsix.svelte';
	import Dten from '$lib/assets/icons/Dten.svelte';
	import Dtwelve from '$lib/assets/icons/Dtwelve.svelte';
	import Dtwenty from '$lib/assets/icons/Dtwenty.svelte';
	import Dtwo from '$lib/assets/icons/Dtwo.svelte';
	import CommanderDamage from '$lib/assets/icons/CommanderDamage.svelte';
	import { resetRandomizer, randomizerModalData } from '$lib/store/modal';
	import { appSettings } from '$lib/store/appSettings';
	import { _ } from 'svelte-i18n';
</script>

<div
	class="bg-black/70 absolute w-full h-full top-0 left-0 flex justify-center items-center"
	on:click={resetRandomizer}
	role="button"
	on:keydown={() => null}
	tabindex="0"
>
	<div
		on:click|stopPropagation
		class="bg-[#2d2f30] opacity-100 rounded-[2rem] flex justify-center items-center"
		class:w-40={$randomizerModalData.type !== 'randomPlayer' && $randomizerModalData.type !== 'randomOpponent'}
		class:h-40={$randomizerModalData.type !== 'randomPlayer' && $randomizerModalData.type !== 'randomOpponent'}
		class:w-80={$randomizerModalData.type === 'randomPlayer' || $randomizerModalData.type === 'randomOpponent'}
		class:h-60={$randomizerModalData.type === 'randomPlayer' || $randomizerModalData.type === 'randomOpponent'}
		role="button"
		on:keydown={() => null}
		tabindex="0"
		style="background-image: url({$randomizerModalData.backgroundImage}); background-size: cover; background-position: center;"
	>
		<div
			class="flex flex-col justify-center items-center"
		>
			{#if $randomizerModalData.type === 'randomPlayer' || $randomizerModalData.type === 'randomOpponent'}
				<div
					class="flex flex-col items-center p-4"
					>
					<span class="text-white text-5xl font-bold text-center mt-16">
						<!-- {#if $randomizerModalData.playerId !== null}
							<div class="scale-[3]">
								<CommanderDamage playerIndex={$randomizerModalData.playerId - 1} />
							</div>
						{/if} -->
						{$randomizerModalData.playerName}
					</span>
				</div>
			{:else}
				<div class="h-[49px] mb-8">
					{#if $randomizerModalData.type === 'd2'}
						<Dtwo />
					{:else if $randomizerModalData.type === 'd4'}
						<Dfour />
					{:else if $randomizerModalData.type === 'd6'}
						<Dsix />
					{:else if $randomizerModalData.type === 'd8'}
						<Deight />
					{:else if $randomizerModalData.type === 'd10'}
						<Dten />
					{:else if $randomizerModalData.type === 'd12'}
						<Dtwelve />
					{:else if $randomizerModalData.type === 'd20'}
						<Dtwenty />
					{:else if $randomizerModalData.type === 'custom'}
						{$appSettings.customRandomNumber || 0} - { $_('sided_die') }
					{/if}
				</div>
				<div><p class="text-white text-5xl">{$randomizerModalData.result}</p></div>
			{/if}
		</div>
	</div>
</div>
