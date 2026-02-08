<script lang="ts">
    import { players } from '$lib/store/player';
    import { appSettings } from '$lib/store/appSettings';
    import { _ } from 'svelte-i18n';
    import { colorToBg } from '$lib/components/colorToBg';

    export let playerIndex: number;
    export let layout: 'two-by-two' | 'one-two-one' | '' = '';
    export let orientation: App.Player.Orientation = 'up';

    $: numberOfPlayers = $appSettings.playerCount;
    $: meString = String($_( 'me' ));  // the "me" string is used in the minimap to indicate the current player, so we need to reactively update it when the locale changes

    const getBgStyle = (j: number) => {
        const p = $players[j];
        if (!p) return '';
        const bg = p.backgroundImage;
        if (!bg && p.color) return `background: ${colorToBg(p.color)};`;
        if (Array.isArray(bg) && bg[0]) return `background-image: url('${bg[0]}'); background-size: cover; background-position: center;`;
        if (bg && typeof bg === 'string') return `background-image: url('${bg}'); background-size: cover; background-position: center;`;
        return '';
    };
</script>

<!-- FIXME: update the layout of the minimap of each players, to show like in the main app -->
<div class="flex items-center gap-1 pointer-events-auto">
    {#each Array(numberOfPlayers) as _, j}
        <div
        class="w-12 h-10 rounded-md overflow-hidden relative border border-black/60"
        style={getBgStyle(j)}
        title={$players[j]?.playerName}
        >
        {#if j === playerIndex && ($players[j]?.statusEffects?.commanderDamage?.[j] ?? -1) <= 0}
            <div class="absolute inset-x-0 bottom-0 bg-black/40 text-white text-xs text-center leading-4">{meString}</div>
        {:else}
            <div class="absolute inset-x-0 bottom-0 bg-black/40 text-white text-xs text-center leading-4">{$players[playerIndex]?.statusEffects?.commanderDamage?.[j] ?? 0}</div>
        {/if}
        </div>
    {/each}
</div>
