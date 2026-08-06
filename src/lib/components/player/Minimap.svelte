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
    $: meString = String($_('me')); // Keep translated "me" label reactive on locale changes.

    type MinimapRows = number[][];
    type SeatOrientation = App.Player.Orientation;

    const getMinimapRows = (
        playerId: number,
        playerCount: number,
        currentLayout: 'two-by-two' | 'one-two-one' | ''
    ): MinimapRows => {
        switch (playerCount) {
            case 2:
                return [[1], [0]];
            case 3:
                if (playerId === 0) return [[1, 2], [0]];
                else if (playerId === 1) return [[1], [2, 0]];
                else if (playerId === 2) return [[2], [1, 0]];
                else return [];
            case 4:
                return currentLayout === 'two-by-two' ? [[1, 2], [0, 3]] : [[2], [1, 3], [0]];
            case 5:
                return [[2, 3], [1, 4], [0]];
            case 6:
                return currentLayout === 'one-two-one'
                    ? [[3], [2, 4], [1, 5], [0]]
                    : [[2, 3], [1, 4], [0, 5]];
            case 7:
                return [[3, 4], [2, 5], [1, 6], [0]];
            case 8:
                return [[4], [3, 5], [2, 6], [1, 7], [0]];
            default:
                return [];
        }
    };

    $: minimapRows = getMinimapRows(playerIndex, numberOfPlayers, layout);

    const getSeatOrientations = (
        playerCount: number,
        currentLayout: 'two-by-two' | 'one-two-one' | ''
    ): SeatOrientation[] => {
        switch (playerCount) {
            case 2:
                return ['up', 'down'];
            case 3:
                return ['up', 'right', 'left'];
            case 4:
                return currentLayout === 'two-by-two'
                    ? ['right', 'right', 'left', 'left']
                    : ['up', 'right', 'down', 'left'];
            case 5:
                return ['up', 'right', 'right', 'left', 'left'];
            case 6:
                return currentLayout === 'one-two-one'
                    ? ['up', 'right', 'right', 'down', 'left', 'left']
                    : ['right', 'right', 'right', 'left', 'left', 'left'];
            case 7:
                return ['up', 'right', 'right', 'right', 'left', 'left', 'left'];
            case 8:
                return ['up', 'right', 'right', 'right', 'down', 'left', 'left', 'left'];
            default:
                return [];
        }
    };

    const orientationToDegrees = (seatOrientation: SeatOrientation): string => {
        if (seatOrientation === 'left') return '-90deg';
        if (seatOrientation === 'right') return '90deg';
        if (seatOrientation === 'down') return '180deg';
        return '0deg';
    };

    $: seatOrientations = getSeatOrientations(numberOfPlayers, layout);

    $: getTileRotation = (targetIndex: number): string => {
        // Keep seat #1 unrotated as requested, rotate all others according to board layout.
        if (targetIndex === 0) return '0deg';
        const seatOrientation = seatOrientations[targetIndex] ?? 'up';
        return orientationToDegrees(seatOrientation);
    };

    $: getViewerRotation = (): string => {
        // Custom convention requested for the 3-player layout.
        // Player 1 => normal, player 2 => left, player 3 => right.
        if (numberOfPlayers === 3) {
            if (playerIndex === 1) return '0deg';
            if (playerIndex === 2) return '180deg';
            return '0deg';
        }

        // Custom convention requested for the 4-player layout.
        // Player 1 => normal, player 2 => left, player 3 => right, player 4 => upside down.
        if (numberOfPlayers === 4 && layout === 'two-by-two') {
            if (playerIndex === 1) return '0deg';
            if (playerIndex === 2) return '180deg';
            if (playerIndex === 3) return '180deg';
            return '0deg';
        }
        if (numberOfPlayers === 4 && layout === 'one-two-one') {
            if (playerIndex === 1) return '0deg';
            if (playerIndex === 2) return '0deg';
            if (playerIndex === 3) return '180deg';
            return '0deg';
        }

        // Custom convention requested for the 5-player layout.
        if (numberOfPlayers === 5) {
            if (playerIndex === 1) return '0deg';
            if (playerIndex === 2) return '0deg';
            if (playerIndex === 3) return '180deg';
            if (playerIndex === 4) return '180deg';
            return '0deg';
        }

        // Custom convention requested for the 6-player layout.
        if (numberOfPlayers === 6 && layout === 'two-by-two') {
            if (playerIndex === 1) return '0deg';
            if (playerIndex === 2) return '0deg';
            if (playerIndex === 3) return '180deg';
            if (playerIndex === 4) return '180deg';
            if (playerIndex === 5) return '180deg';
            return '0deg';
        }
        if (numberOfPlayers === 6 && layout === 'one-two-one') {
            if (playerIndex === 1) return '0deg';
            if (playerIndex === 2) return '0deg';
            if (playerIndex === 3) return '0deg';
            if (playerIndex === 4) return '180deg';
            if (playerIndex === 5) return '180deg';
            return '0deg';
        }

        // Custom convention requested for the 7-player layout.
        if (numberOfPlayers === 7) {
            if (playerIndex === 1) return '0deg';
            if (playerIndex === 2) return '0deg';
            if (playerIndex === 3) return '0deg';
            if (playerIndex === 4) return '180deg';
            if (playerIndex === 5) return '180deg';
            if (playerIndex === 6) return '180deg';
            return '0deg';
        }

        // Custom convention requested for the 8-player layout.
        if (numberOfPlayers === 8) {
            if (playerIndex === 1) return '0deg';
            if (playerIndex === 2) return '0deg';
            if (playerIndex === 3) return '0deg';
            if (playerIndex === 4) return '180deg';
            if (playerIndex === 5) return '180deg';
            if (playerIndex === 6) return '180deg';
            if (playerIndex === 7) return '180deg';
            return '0deg';
        }

        // Fallback for other layouts: keep previous seat-based behavior.
        return getTileRotation(playerIndex);
    };

    $: rowWidthClass =
        (orientation === 'left' || orientation === 'right')
            ? 'min-w-[2.0rem]'
            : 'min-w-[5.0rem]';

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

    $: getCommanderDamage = (targetIndex: number) =>
        $players[playerIndex]?.statusEffects?.commanderDamage?.[targetIndex] ?? 0;

    $: shouldShowMe = (targetIndex: number) =>
        targetIndex === playerIndex &&
        ($players[targetIndex]?.statusEffects?.commanderDamage?.[targetIndex] ?? -1) <= 0;
</script>

<div
    class={`pointer-events-auto rounded-md border border-black/70 bg-black/50 p-0.5 ${rowWidthClass} max-h-14 max-w-14 overflow-hidden`}
    role="button"
    tabindex="0"
    on:click={() => openPlayerModal(playerIndex + 1, 'commander')}
    on:keydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openPlayerModal(playerIndex + 1, 'commander');
        }
    }}
>
    <div class="flex flex-col gap-0.5">
        {#each minimapRows as row}
            <div class="flex gap-0.5" class:justify-center={row.length === 1}>
                {#each row as targetIndex}
                    <div
                        class="h-6 min-h-6 max-h-12 min-w-0 max-w-12 rounded-sm overflow-hidden border border-black/60 relative flex items-center justify-center"
                        class:w-full={row.length === 1}
                        class:w-6={row.length > 1}
                        class:h-full={row.length === 1}
                        class:flex-1={row.length > 1}
                        title={$players[targetIndex]?.playerName}
                    >
                        <div
                            class="absolute inset-0"
                            style={`transform: rotate(${getViewerRotation(targetIndex)}); ${getBgStyle(targetIndex)}`}
                        ></div>
                        <div
                            class="relative z-10 text-white text-[10px] leading-none text-center font-semibold px-0.5"
                            style={`transform: rotate(${getViewerRotation(targetIndex)});`}
                        >
                            {#if shouldShowMe(targetIndex)}
                                {meString}
                            {:else}
                                {getCommanderDamage(targetIndex)}
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        {/each}
    </div>
</div>
