<script lang="ts">
    import { players } from '$lib/store/player';
    import { appSettings } from '$lib/store/appSettings';
    import { _ } from 'svelte-i18n';
    import { openPlayerModal } from '$lib/store/modal';
    import { colorToBg } from '$lib/components/colorToBg';

    export let playerIndex: number;
    export let layout: 'two-by-two' | 'one-two-one' | '' = '';
    export let orientation: App.Player.Orientation = 'up';

    $: numberOfPlayers = $appSettings.playerCount;
    $: meString = String($_( 'me' ));  // the "me" string is used in the minimap to indicate the current player, so we need to reactively update it when the locale changes

    $: bgRotation = orientation === 'left' ? '-90deg' : orientation === 'right' ? '90deg' : '0deg';

    $: getBgStyle = (j: number) => {
        const p = $players[j];
        if (!p) return '';
        const bg = p.backgroundImage;
        if (!bg && p.color) return `background: ${colorToBg(p.color)};`;
        if (Array.isArray(bg) && bg.length === 1) return `background-image: url('${bg[0]}'); background-size: cover; background-position: center;`;
        if (Array.isArray(bg) && bg.length === 2) return `background-image: url('${bg[0]}'), url('${bg[1]}'); background-size: cover; background-position: center;`;
        if (bg && typeof bg === 'string') return `background-image: url('${bg}'); background-size: cover; background-position: center;`;
        return '';
    };
</script>

<!-- FIXME: update the layout of the minimap of each players, to show like in the main app -->
<div
    class="items-center gap-0 pointer-events-auto flex"
    class:grid={(numberOfPlayers > 4 && layout !== 'two-by-two' && (orientation === 'left' || orientation === 'right'))}
    class:grid-cols-3={(numberOfPlayers > 4 && layout !== 'two-by-two' && (orientation === 'left' || orientation === 'right'))}
>
    {#each Array(numberOfPlayers) as _, j}
        <div
        class:w-12={orientation === 'up' || orientation === 'down'}
        class:h-9={(orientation === 'up' || orientation === 'down') || (numberOfPlayers >= 5)}
        class:w-10={orientation === 'left' || orientation === 'right'}
        class:h-10={(orientation === 'left' || orientation === 'right') && numberOfPlayers <= 4}
        class="max-w-14 max-h-12 rounded-md overflow-hidden relative border border-black/60"
        style={getBgStyle(j)}
        style:transform={`rotate(${bgRotation})`}
        title={$players[j]?.playerName}
        on:click={() => $players[j] && openPlayerModal($players[j].id, 'commander')}
        role="button"
        >
            {#if j === playerIndex && ($players[j]?.statusEffects?.commanderDamage?.[j] ?? -1) <= 0}
                <div class="bottom-0 text-white text-base text-center"
                    class:rotation-270={orientation === 'left' || orientation === 'right'}
                    class:-rotation-90={orientation === 'up'}
                >{meString}</div>
            {:else}
                <div class="bottom-0 text-white text-base text-center"
                    class:rotation-270={orientation === 'left' || orientation === 'right'}
                    class:-rotation-90={orientation === 'up'}
                >{$players[playerIndex]?.statusEffects?.commanderDamage?.[j] ?? 0}</div>
            {/if}
        </div>
    {/each}
</div>
