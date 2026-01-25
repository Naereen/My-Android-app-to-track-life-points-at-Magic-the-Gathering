<script>
	import Dsix from '$lib/assets/icons/Dsix.svelte';
	import ManaPentagon from '$lib/assets/icons/ManaPentagon.svelte';
	import Reset from '$lib/assets/icons/Reset.svelte';
	import { appSettings } from '$lib/store/appSettings';
	import { resetLifeTotals } from '$lib/store/player';
	import { appState, toggleIsMenuOpen } from '$lib/store/appState';
	import CircularButton from '../shared/circularButton/CircularButton.svelte';
	import Randomizer from './subcomponents/randomizer/Randomizer.svelte';
	import Resources from './subcomponents/resources/Resources.svelte';
	import Settings from './subcomponents/settings/Settings.svelte';
</script>

{#if !$appState.isMenuOpen}
	<div class="flex justify-around py-1.5 items-center" class:h-14={!$appState.isMenuOpen}>
		<div class="flex justify-center items-center flex-grow">
			<button on:click={() => resetLifeTotals(false)} on:contextmenu|preventDefault draggable="false" class="h-10 w-10"><Reset /></button>
		</div>
		<div class="flex justify-center items-center flex-grow">
			<CircularButton
				on:click={() => toggleIsMenuOpen('settings')}
				number={$appSettings.playerCount}
				highlight
			/>
		</div>
		<div class="flex justify-center items-center flex-grow">
			<button on:click={() => toggleIsMenuOpen('resources')} on:contextmenu|preventDefault draggable="false">
				<ManaPentagon />
			</button>
		</div>
		<div class="flex justify-center items-center flex-grow">
			<button on:click={() => toggleIsMenuOpen('randomizer')} on:contextmenu|preventDefault draggable="false">
				<Dsix />
			</button>
		</div>
	</div>
{:else if $appState.activeMenu === 'settings'}
	<Settings on:resetLifeTotals />
{:else if $appState.activeMenu === 'resources'}
	<Resources />
{:else if $appState.activeMenu === 'randomizer'}
	<Randomizer />
{/if}
