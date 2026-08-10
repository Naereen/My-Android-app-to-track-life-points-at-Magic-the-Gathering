<script lang="ts">
	import Arrow from '$lib/assets/icons/Arrow.svelte';
	import Acorn from '$lib/assets/icons/Acorn.svelte';
	import Ascend from '$lib/assets/icons/Ascend.svelte';
	import CommandTax from '$lib/assets/icons/CommandTax.svelte';
	import CommanderDamage from '$lib/assets/icons/CommanderDamage.svelte';
	import Crown from '$lib/assets/icons/Crown.svelte';
	import DayNight from '$lib/assets/icons/DayNight.svelte';
	import Energy from '$lib/assets/icons/Energy.svelte';
	import Experience from '$lib/assets/icons/Experience.svelte';
	import Initiative from '$lib/assets/icons/Initiative.svelte';
	import PoisonIcon from '$lib/assets/icons/Poison.svelte';
	import Rad from '$lib/assets/icons/Rad.svelte';
	import StartYourEngineSpeed from '$lib/assets/icons/StartYourEngineSpeed.svelte';
	import StatusSkull from '$lib/assets/icons/StatusSkull.svelte';
	import Storied from '$lib/assets/icons/Storied.svelte';
	import TheRingerBearer from '$lib/assets/icons/TheRingerBearer.svelte';
	import Ticket from '$lib/assets/icons/Ticket.svelte';
	import { optimize } from '$lib/utils';
	import { toggleIsMenuOpen } from '$lib/store/appState';
	import { appSettings } from '$lib/store/appSettings';
	import { clearGameHistory, gameHistory, type GameHistoryEntry } from '$lib/store/gameHistory';
	import { flushPendingSnapshot, lifeHistory } from '$lib/store/lifeHistory';
	import { openHistoryModal } from '$lib/store/modal';
	import { _ } from 'svelte-i18n';

	$: innerHeight = 0;

	/**
	 * Formats a timestamp into a localized long-date + time string for history rows.
	 * @param {number} timestamp Unix timestamp in milliseconds.
	 * @returns {string} Human-readable date/time label.
	 */
	const formatTime = (timestamp: number) => {
		try {
			const locale = $appSettings.locale || undefined;
			const date = new Date(timestamp);
			const datePart = new Intl.DateTimeFormat(locale, {
				weekday: 'long',
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			}).format(date);
			const timePart = new Intl.DateTimeFormat(locale, {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit'
			}).format(date);
			return `${datePart.charAt(0).toUpperCase()}${datePart.slice(1)} - ${timePart}`;
		} catch (e) {
			return '';
		}
	};

	/**
	 * Resolves a localized label for status keys stored in history payloads.
	 * @param {string | undefined} statusKey Internal status identifier.
	 * @returns {string} Localized status label.
	 */
	const statusLabel = (statusKey: string | undefined) => {
		if (!statusKey) return '';

		if (statusKey === 'monarch') return String($_('monarch'));
		if (statusKey === 'initiative') return String($_('initiative'));
		if (statusKey === 'ascend') return String($_('ascend'));
		if (statusKey === 'dayNight') return String($_('day_night'));
		if (statusKey === 'ko') return String($_('ko'));
		if (statusKey === 'energy') return String($_('energy'));
		if (statusKey === 'experience') return String($_('experience'));
		if (statusKey === 'rad') return String($_('rad'));
		if (statusKey === 'acorn') return String($_('acorn'));
		if (statusKey === 'ticket') return String($_('ticket'));
		if (statusKey === 'commandTax') return String($_('command_tax'));
		if (statusKey === 'ringBearer') return String($_('ring_bearer'));
		if (statusKey === 'storied') return String($_('storied'));
		if (statusKey === 'startYourEngineSpeed') return String($_('start_your_engine_speed'));

		return statusKey;
	};

	/**
	 * Resolves a localized label for mana/resource history entries.
	 * @param {string | undefined} resourceKey Internal resource identifier.
	 * @returns {string} Localized resource label.
	 */
	const resourceLabel = (resourceKey: string | undefined) => {
		if (!resourceKey) return '';

		if (resourceKey === 'white') return String($_('history_resource_white'));
		if (resourceKey === 'blue') return String($_('history_resource_blue'));
		if (resourceKey === 'black') return String($_('history_resource_black'));
		if (resourceKey === 'red') return String($_('history_resource_red'));
		if (resourceKey === 'green') return String($_('history_resource_green'));
		if (resourceKey === 'waste') return String($_('history_resource_waste'));
		if (resourceKey === 'storm') return String($_('history_resource_storm'));

		return resourceKey;
	};

	const statusBooleanIconMap = {
		monarch: Crown,
		initiative: Initiative,
		ascend: Ascend,
		storied: Storied,
		dayNight: DayNight,
		ko: StatusSkull
	} as const;

	const statusNumericIconMap = {
		energy: Energy,
		experience: Experience,
		rad: Rad,
		acorn: Acorn,
		ticket: Ticket,
		commandTax: CommandTax,
		ringBearer: TheRingerBearer,
		startYourEngineSpeed: StartYourEngineSpeed
	} as const;

	// These maps stay local to the menu because the rendering rules are mostly about
	// presentation, not game state. Keeping them close to the formatter reduces drift.

	const resourceIconMap = {
		white: 'white-mana-symbol.webp',
		blue: 'blue-mana-symbol.webp',
		black: 'black-mana-symbol.webp',
		red: 'red-mana-symbol.webp',
		green: 'green-mana-symbol.webp',
		waste: 'waste-mana-symbol.webp',
		storm: 'storm-counter-symbol.webp'
	} as const;

	/**
	 * Formats one `GameHistoryEntry` into a readable line displayed in the list.
	 * @param {GameHistoryEntry} entry Raw history event.
	 * @returns {string} Human-readable description of the event.
	 */
	const formatEntry = (entry: GameHistoryEntry) => {
		const fromValue = entry.payload.from ?? 0;
		const toValue = entry.payload.to ?? 0;

		if (entry.kind === 'positiveLife' || entry.kind === 'negativeLife') {
			const delta =
				typeof fromValue === 'number' && typeof toValue === 'number' ? toValue - fromValue : 0;
			return `${entry.playerName} · ${$_('life')} : ${delta > 0 ? '+' : ''}${delta} (${fromValue} → ${toValue})`;
		}

		if (entry.kind === 'poison') {
			return `${entry.playerName} · ${$_('poison')} : ${fromValue} → ${toValue}`;
		}

		if (entry.kind === 'statusBoolean') {
			return `${entry.playerName} · ${statusLabel(entry.payload.key)} : ${entry.payload.to ? $_('history_state_on') : $_('history_state_off')}`;
		}

		if (entry.kind === 'statusNumeric') {
			return `${entry.playerName} · ${statusLabel(entry.payload.key)} : ${fromValue} → ${toValue}`;
		}

		if (entry.kind === 'commanderDamage') {
			const fromPlayerLabel = entry.payload.fromPlayerName
				? `${$_('history_from')} ${entry.payload.fromPlayerName}`
				: `${$_('history_from_player')} #${entry.payload.fromPlayerId ?? '-'}`;
			const lifePart =
				typeof entry.payload.lifeDelta === 'number' && entry.payload.lifeDelta !== 0
					? ` · ${$_('life')} ${entry.payload.lifeDelta > 0 ? '+' : ''}${entry.payload.lifeDelta}`
					: '';
			return `${entry.playerName} · ${$_('commander_damage')} (${fromPlayerLabel}) : ${fromValue} → ${toValue}${lifePart}`;
		}

		if (entry.kind === 'resourceChange') {
			return `${resourceLabel(entry.payload.key)} : ${fromValue} → ${toValue}`;
		}

		if (entry.kind === 'resourceReset') {
			return String($_('history_resources_cleared'));
		}

		if (entry.kind === 'turnChange') {
			const fromTurn = entry.payload.fromTurn ?? 0;
			const toTurn = entry.payload.toTurn ?? 0;
			const toPlayerName = entry.payload.toPlayerName ?? '';
			const fromPlayerName = entry.playerName;
			const turnLabel = $_('turn');
			if (fromPlayerName) {
				return `${fromPlayerName} · ${turnLabel} ${fromTurn} → ${toPlayerName}, ${turnLabel} ${toTurn}`;
			}
			return `→ ${toPlayerName}, ${turnLabel} ${toTurn}`;
		}

		if (entry.kind === 'gameRestart') {
			return String($_('history_game_restarted') || 'Game restarted');
		}

		if (entry.kind === 'diceRoll') {
			const diceSides = entry.payload.diceSides ?? 0;
			const diceResult = entry.payload.diceResult ?? 0;
			return `${$_('history_dice_roll_prefix')} ${diceSides} ${$_('history_dice_roll_sides')} : ${$_('history_dice_roll_result')} = ${diceResult}`;
		}

		return '';
	};

	/**
	 * Selects the icon descriptor used to render one history row.
	 * @param {GameHistoryEntry} entry History event.
	 * @returns {{component?: unknown; imageSrc?: string; glyph?: string; className: string}}
	 * Icon descriptor with either Svelte component, image, or glyph fallback.
	 */
	const iconForEntry = (entry: GameHistoryEntry) => {
		if (entry.kind === 'positiveLife') {
			return { glyph: '💚', className: 'text-green-200' };
		}

		if (entry.kind === 'negativeLife') {
			return { glyph: '💔', className: 'text-red-200' };
		}

		if (entry.kind === 'poison') {
			return { component: PoisonIcon, className: 'text-lime-300' };
		}

		if (entry.kind === 'statusBoolean') {
			return {
				component: statusBooleanIconMap[entry.payload.key as keyof typeof statusBooleanIconMap],
				className: 'text-sky-300'
			};
		}

		if (entry.kind === 'statusNumeric') {
			return {
				component: statusNumericIconMap[entry.payload.key as keyof typeof statusNumericIconMap],
				className: 'text-sky-300'
			};
		}

		if (entry.kind === 'commanderDamage') {
			// return { component: CommanderDamage, className: 'text-amber-300' };
			return { glyph: '⚔️', className: 'text-amber-300' };
		}

		if (entry.kind === 'turnChange') {
			return { glyph: '🔂', className: 'text-purple-300' };
		}

		if (entry.kind === 'resourceChange') {
			const key = entry.payload.key as keyof typeof resourceIconMap;
			const resourceIcon = resourceIconMap[key];
			// Resource changes are the only history events that need rendered image assets;
			// everything else can be expressed with icons or glyphs.
			if (resourceIcon) {
				return { imageSrc: optimize(resourceIcon), className: 'text-cyan-300' };
			}
			return { glyph: '◈', className: 'text-cyan-300' };
		}

		if (entry.kind === 'resourceReset') {
			return { glyph: '◈', className: 'text-cyan-300' };
		}

		if (entry.kind === 'gameRestart') {
			return { glyph: '↻', className: 'text-orange-300' };
		}

		if (entry.kind === 'diceRoll') {
			return { glyph: '🎲', className: 'text-yellow-300' };
		}

		return { glyph: '•', className: 'text-gray-300' };
	};

	/**
	 * Returns the optional Svelte component icon for a history entry.
	 * @param {GameHistoryEntry} entry History event.
	 * @returns {unknown} Component constructor when available.
	 */
	const iconComponent = (entry: GameHistoryEntry) => iconForEntry(entry).component;

	/**
	 * Returns the optional image icon source for a history entry.
	 * @param {GameHistoryEntry} entry History event.
	 * @returns {string | undefined} Image source when available.
	 */
	const iconImageSrc = (entry: GameHistoryEntry) => iconForEntry(entry).imageSrc;

	/**
	 * Returns the glyph fallback for a history entry icon.
	 * @param {GameHistoryEntry} entry History event.
	 * @returns {string | undefined} Unicode glyph when no component/image is used.
	 */
	const iconGlyph = (entry: GameHistoryEntry) => iconForEntry(entry).glyph;

	/**
	 * Returns CSS text-color class associated with entry icon.
	 * @param {GameHistoryEntry} entry History event.
	 * @returns {string} Tailwind class name.
	 */
	const iconClassName = (entry: GameHistoryEntry) => iconForEntry(entry).className;

	/**
	 * Flags entries that should use Keyrune-like icon shell sizing.
	 * @param {GameHistoryEntry} entry History event.
	 * @returns {boolean} True for boolean/numeric status icons.
	 */
	const isKeyruneIcon = (entry: GameHistoryEntry) =>
		entry.kind === 'statusBoolean' || entry.kind === 'statusNumeric';

	/**
	 * Hides status entries for disabled optional mechanics (Acorn/Ticket).
	 * @param {GameHistoryEntry} entry History event.
	 * @returns {boolean} True when the row should not be displayed.
	 */
	const isHiddenStatusEntry = (entry: GameHistoryEntry) => {
		if (entry.kind !== 'statusNumeric') return false;
		if (entry.payload.key === 'acorn' && !$appSettings.enableAcornMode) return true;
		if (entry.payload.key === 'ticket' && !$appSettings.enableTicketMode) return true;
		return false;
	};

	$: visibleGameHistory = $gameHistory.filter((entry) => !isHiddenStatusEntry(entry));

	// The list is inverted in DOM order so the newest action reads as the topmost row,
	// which matches how players scan a live game log during play.

	/**
	 * Flushes pending life snapshots then opens the life-chart modal.
	 */
	const showLifeChart = () => {
		flushPendingSnapshot();
		openHistoryModal('life');
	};

	const showTurnTimeStats = () => {
		openHistoryModal('turnTime');
	};
</script>

<svelte:window bind:innerHeight />

<div
	class="w-full overflow-scroll scrollbar-hidden h-full"
	style="max-height: {innerHeight - ($appSettings.playerCount >= 5 ? 110 : 80)}px;"
>
	<div class="flex flex-col">
		<div
			class="w-full text-center flex px-4 flex-col justify-between items-center my-4 py-2 sticky top-[-1px] bg-black z-10"
		>
			<button
				on:click={() => toggleIsMenuOpen('')}
				on:contextmenu|preventDefault
				draggable="false"
				class="text-white absolute left-0 pl-4"
			>
				<Arrow />
			</button>
			<span class="text-white text-center text-3xl">{$_('game_history')}</span>
		</div>

		<div class="mb-4 flex flex-wrap justify-center gap-3">
			<button
				on:click={showLifeChart}
				disabled={$lifeHistory.length === 0}
				class="px-3 py-1 rounded-full border border-fuchsia-500/50 text-fuchsia-200 text-xl bg-fuchsia-950/30 hover:bg-fuchsia-950/50 disabled:opacity-40 disabled:cursor-not-allowed"
			>
				{$_('history_life_chart_open_button') || 'Open life chart'}
			</button>
			<button
				on:click={showTurnTimeStats}
				class="px-3 py-1 rounded-full border border-sky-500/50 text-sky-200 text-xl bg-sky-950/30 hover:bg-sky-950/50"
			>
				{$_('history_turn_time_open_button') || 'Turn time stats'}
			</button>
		</div>

		<div class="w-full px-4 pb-5 text-white">
			{#if visibleGameHistory.length === 0}
				<div class="text-center text-gray-300">
					{$_('game_history_empty') || 'No changes recorded yet.'}
				</div>
			{:else}
				<ul class="space-y-1.5 space-y-reverse flex flex-col-reverse">
					{#each visibleGameHistory as entry (entry.id)}
						<li class="bg-gray-900/95 border border-gray-800 rounded-lg px-2.5 py-2 text-sm">
							<div class="flex gap-2">
								<div
									class={`history-icon-shell ${isKeyruneIcon(entry) ? 'history-icon-shell--keyrune' : ''} mt-auto mb-auto w-9 h-9 shrink-0 flex items-center justify-center select-none ${iconClassName(entry)}`}
								>
									{#if iconComponent(entry)}
										<svelte:component this={iconComponent(entry)} />
									{:else if iconImageSrc(entry)}
										<img
											srcset={iconImageSrc(entry)}
											alt="resource icon"
											class="h-7 w-7 object-contain"
										/>
									{:else}
										<span class="text-4xl leading-none">{iconGlyph(entry)}</span>
									{/if}
								</div>
								<div class="min-w-0 flex-1">
									<div class="text-gray-400 text-1.25rem">{formatTime(entry.timestamp)}</div>
									<div class="break-words text-xl">{formatEntry(entry)}</div>
								</div>
							</div>
						</li>
					{/each}
				</ul>
			{/if}

			<div class="mt-4 flex flex-wrap justify-center gap-3">
				<button
					on:click={clearGameHistory}
					disabled={visibleGameHistory.length === 0}
					class="px-3 py-1 rounded-full border border-gray-700 text-gray-300 text-xs bg-black/30 hover:bg-black/50 disabled:opacity-40 disabled:cursor-not-allowed"
				>
					{$_('game_history_clear_button') || 'Clear current history'}
				</button>
			</div>
		</div>
	</div>
</div>
