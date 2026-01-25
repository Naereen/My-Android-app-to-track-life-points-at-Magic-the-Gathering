<script lang="ts">
    import Menu from '../components/menu/Menu.svelte';
    import { appState } from '$lib/store/appState';
    import PlayerHorizontal from '$lib/components/player/PlayerHorizontal.svelte';
</script>

<div class="flex flex-col justify-between relative h-full">
    <div class="w-full flex justify-center bg-black sticky top-0">
        <div class="w-full px-2">
            <div class="flex justify-center">
                <PlayerHorizontal orientation="left" id={3} />
            </div>
        </div>
    </div>

    <div class="flex-grow">
        <Menu />
    </div>

    <div class="w-full flex flex-col gap-2 bg-black sticky bottom-0 pb-2">
        <div class="w-full flex justify-between gap-2 px-2">
            <div class="w-1/2">
                <PlayerHorizontal orientation="right" id={2} />
            </div>
            <div class="w-1/2">
                <PlayerHorizontal orientation="left" id={4} />
            </div>
        </div>
        <div class="w-full flex justify-center px-2">
            <PlayerHorizontal orientation="left" id={1} />
        </div>
    </div>
</div>
