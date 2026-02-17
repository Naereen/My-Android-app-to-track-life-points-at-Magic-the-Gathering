<script lang="ts">
    import { players } from '$lib/store/player';
    import { appSettings } from '$lib/store/appSettings';
    import { _ } from 'svelte-i18n';
    import { openPlayerModal } from '$lib/store/modal';
    import { colorToBg } from '$lib/components/colorToBg';

    // import MinimapTwoPlayer from './MinimapTwoPlayer.svelte';
    // import MinimapThreePlayer from './MinimapThreePlayer.svelte';
    // import MinimapFourPlayerTwoByTwo from './MinimapFourPlayerTwoByTwo.svelte';
    // import MinimapFourPlayerOneTwoOne from './MinimapFourPlayerOneTwoOne.svelte';
    // import MinimapFivePlayer from './MinimapFivePlayer.svelte';
    // import MinimapSixPlayerTwo from './MinimapSixPlayerTwo.svelte';
    // import MinimapSixPlayerOne from './MinimapSixPlayerOne.svelte';

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
    class="items-center gap-0 pointer-events-auto flex items-center justify-center"
    class:grid={(numberOfPlayers > 4 && layout !== 'two-by-two' && (orientation === 'left' || orientation === 'right'))}
    class:grid-cols-3={(numberOfPlayers > 4 && layout !== 'two-by-two' && (orientation === 'left' || orientation === 'right'))}
>
    {#each Array(numberOfPlayers) as _, j}
        <div
        class:w-11={orientation === 'up' || orientation === 'down'}
        class:h-8={(orientation === 'up' || orientation === 'down') || (numberOfPlayers >= 5)}
        class:w-9={orientation === 'left' || orientation === 'right'}
        class:h-9={(orientation === 'left' || orientation === 'right') && numberOfPlayers <= 4}
        class="max-w-13 max-h-11 rounded-md overflow-hidden relative border border-black/60 flex items-center justify-center"
        style={getBgStyle(j)}
        style:transform={`rotate(${bgRotation})`}
        title={$players[j]?.playerName}
        on:click={() => openPlayerModal(playerIndex + 1, 'commander')}
        role="button"
        >
            <div class="text-white text-base text-center"
                class:rotation-270={orientation === 'left' || orientation === 'right'}
                class:-rotation-90={orientation === 'up'}
            >
                {#if j === playerIndex && ($players[j]?.statusEffects?.commanderDamage?.[j] ?? -1) <= 0}
                    {meString}
                {:else}
                    {$players[playerIndex]?.statusEffects?.commanderDamage?.[j] ?? 0}
                {/if}
            </div>
        </div>
    {/each}
</div>

<!-- Include all the different Minimap layouts, for different player counts and layouts -->
<div
    on:click={() => openPlayerModal(playerIndex + 1, 'commander')}
    role="button"
    tabindex="0"
    >
    {#if numberOfPlayers === 2}
        <!-- XXX: It's logical to not include the minimap if there is only two players: Commander damage is not a thing in any Dual format! -->
        <!-- <MinimapTwoPlayer {playerIndex} {orientation} /> -->
    {:else if numberOfPlayers === 3}
        <!-- <MinimapThreePlayer {playerIndex} {orientation} /> -->
    {:else if numberOfPlayers === 4}
        {#if layout === 'two-by-two'}
            <!-- <MinimapFourPlayerTwoByTwo {playerIndex} {orientation} /> -->
        {:else}
            <!-- <MinimapFourPlayerOneTwoOne {playerIndex} {orientation} /> -->
        {/if}
    {:else if numberOfPlayers === 5}
        <!-- <MinimapFivePlayer {playerIndex} {orientation} /> -->
    {:else if numberOfPlayers === 6}
        {#if layout === 'one-two-one'}
            <!-- <MinimapSixPlayerOne {playerIndex} {orientation} /> -->
        {:else}
            <!-- <MinimapSixPlayerTwo {playerIndex} {orientation} /> -->
        {/if}
    {/if}
</div>
