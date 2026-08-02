<script lang="ts">
	type HistoryEntry = {
		oldScore: number;
		delta: number;
		timestamp: number;
	};

	const MERGE_WINDOW_MS = 2000;

	export let score: number;
	export let maxLines = 8;
	export let resetToken = 0;

	let currentScore = 0;
	let isInitialized = false;
	let historyEntries: HistoryEntry[] = [];
	let lastResetToken = 0;

	const getHistoryLimit = () => Math.max(0, maxLines - 1);

	const trimHistoryToLimit = () => {
		const limit = getHistoryLimit();
		if (historyEntries.length > limit) {
			historyEntries = historyEntries.slice(historyEntries.length - limit);
		}
	};

	const canMergeEntries = (previous: HistoryEntry, nextOldScore: number, nextDelta: number) => {
		if (Date.now() - previous.timestamp > MERGE_WINDOW_MS) return false;
		// PROPOSAL: If the previous entry's delta and the next delta have different signs, we don't merge them.
		// REASON: This is a good idea, as it prevents merging entries that represent opposite changes in score. We can implement this by checking the sign of the previous delta and the next delta. If they have different signs, we return false to indicate that they should not be merged.
		// ANSWER: It is the opposite of what I wanted.
		// if (Math.sign(previous.delta) !== Math.sign(nextDelta)) return false;
		const previousTo = previous.oldScore + previous.delta;
		if (previousTo !== nextOldScore) return false;
		return true;
	};

	const pushHistoryEntry = (oldScore: number, delta: number) => {
		const previous = historyEntries[historyEntries.length - 1];
		if (previous && canMergeEntries(previous, oldScore, delta)) {
			historyEntries = [
				...historyEntries.slice(0, -1),
				{
					...previous,
					delta: previous.delta + delta,
					timestamp: Date.now()
				}
			];
			trimHistoryToLimit();
			return;
		}

		historyEntries = [...historyEntries, { oldScore, delta, timestamp: Date.now() }];
		trimHistoryToLimit();
	};

	// Public method: clear the history stack and restart from current score baseline.
	export const reset = () => {
		historyEntries = [];
		currentScore = score;
		isInitialized = true;
	};

	// Public method: apply a relative change (+X / -X) to the current score.
	export const updateScore = (delta: number) => {
		if (delta === 0) return;
		pushHistoryEntry(currentScore, delta);
		currentScore += delta;
	};

	// Public method: set an absolute score and record the computed delta.
	export const setScore = (newScore: number) => {
		const delta = newScore - currentScore;
		if (delta === 0) {
			currentScore = newScore;
			return;
		}
		pushHistoryEntry(currentScore, delta);
		currentScore = newScore;
	};

	$: if (!isInitialized) {
		currentScore = score;
		isInitialized = true;
	} else if (score !== currentScore) {
		setScore(score);
	}

	$: if (resetToken !== lastResetToken) {
		lastResetToken = resetToken;
		reset();
	}
</script>

{#if historyEntries.length > 0}
	<div class="history-stack" aria-label="Life change history">
		{#each historyEntries as entry}
			<div class="history-row">
				<span class="old-score">{entry.oldScore}</span>
				<span class="delta" class:delta-positive={entry.delta > 0} class:delta-negative={entry.delta < 0}
					>{entry.delta > 0 ? `+${entry.delta}` : `${entry.delta}`}</span
				>
			</div>
		{/each}

		<div class="history-row current-row">
			<span class="current-score">{currentScore}</span>
		</div>
	</div>
{/if}

<style>
	.history-stack {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: flex-start;
		text-align: left;
		gap: 0.1rem;
		min-height: 9.5rem;
		padding: 0.15rem 0;
		color: #ffffff;
		text-shadow: 0 0 14px rgb(0 0 0 / 0.9);
		font-family: 'Beleren', serif;
	}

	.history-row {
		display: flex;
		align-items: baseline;
		justify-content: flex-start;
		gap: 0.3rem;
		line-height: 1;
		white-space: nowrap;
	}

	.old-score {
		position: relative;
		display: inline-block;
		font-size: 1.0rem;
		opacity: 0.95;
		text-decoration-line: line-through;
		text-decoration-color: transparent;
		text-decoration-thickness: 0.08em;
	}

	.old-score::after {
		content: '';
		position: absolute;
		left: -0.05em;
		right: -0.05em;
		top: 52%;
		height: 0.12em;
		background: currentColor;
		transform: rotate(65deg);
		transform-origin: center;
		pointer-events: none;
	}

	.delta {
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.02em;
	}

	.delta-positive {
		color: #56f59f;
	}

	.delta-negative {
		color: #ff6565;
	}

	.current-row {
		margin-top: 0.1rem;
	}

	.current-score {
		font-size: 1.0rem;
	}
</style>