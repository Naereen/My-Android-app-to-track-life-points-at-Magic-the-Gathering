<script lang="ts">
    import Menu from '../components/menu/Menu.svelte';
    import { appState } from '$lib/store/appState';
    import PlayerHorizontal from '$lib/components/player/PlayerHorizontal.svelte';
	import PlayerVertical from '$lib/components/player/PlayerVertical.svelte';
</script>

<div class="flex flex-col justify-between w-full h-full">
    <div class="w-full pt-2"
        class:h-[32%]={!$appState.isMenuOpen}
        class:pt-2={$appState.isMenuOpen}
    >
        <PlayerVertical orientation="down" id={3} />
    </div>

    <div class="pt-2 flex gap-2 pt-2" class:h-[32%]={!$appState.isMenuOpen}>
        <div class="w-1/2" class:h-full={!$appState.isMenuOpen}>
            <PlayerHorizontal orientation="right" id={2} />
        </div>
        <div class="w-1/2" class:h-full={!$appState.isMenuOpen}>
            <PlayerHorizontal orientation="left" id={4} />
        </div>
    </div>

    <div class="flex-grow">
        <Menu />
    </div>

    <div class="pt-2 flex items-end bg-black sticky bottom-0 pb-2"
        class:h-[32%]={!$appState.isMenuOpen}
        class:pt-2={!$appState.isMenuOpen}
    >
        <PlayerVertical orientation="up" id={1} />
    </div>
</div>
