<script lang="ts">
	import { afterUpdate } from 'svelte';
	import type { GameSnapshot, PlayerState } from '$lib/store/lifeHistory';

	export let snapshots: GameSnapshot[] = [];
	export let defaultStartingLife = 40;
	export let emptyStateText = 'No life history recorded yet.';

	type ChartPoint = {
		x: number;
		y: number;
		life: number;
		timestamp: number;
	};

	type PlayerSeries = {
		id: number;
		name: string;
		color: string;
		path: string;
		points: ChartPoint[];
	};

	const viewBoxWidth = 1000;
	const viewBoxHeight = 500;
	const padding = {
		top: 28,
		right: 28,
		bottom: 54,
		left: 68
	};

	let pathElements: SVGPathElement[] = [];
	const lastAnimatedPathByIndex = new Map<number, string>();

	const innerWidth = viewBoxWidth - padding.left - padding.right;
	const innerHeight = viewBoxHeight - padding.top - padding.bottom;

	const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

	const formatElapsed = (milliseconds: number) => {
		const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		if (minutes >= 60) {
			const hours = Math.floor(minutes / 60);
			const remainingMinutes = minutes % 60;
			return `${hours}h ${String(remainingMinutes).padStart(2, '0')}m`;
		}
		if (minutes > 0) {
			return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
		}
		return `${seconds}s`;
	};

	const minLife = snapshots.length
		? Math.min(0, ...snapshots.flatMap((snapshot) => snapshot.players.map((player) => player.life)))
		: 0;
	const maxLife = snapshots.length
		? Math.max(
				defaultStartingLife,
				...snapshots.flatMap((snapshot) => snapshot.players.map((player) => player.life))
			)
		: defaultStartingLife;
	const yMin = Math.floor(minLife / 10) * 10;
	const yMax = Math.max(10, Math.ceil(maxLife / 10) * 10);
	const yRange = Math.max(10, yMax - yMin);
	const firstTimestamp = snapshots[0]?.timestamp ?? 0;
	const lastTimestamp = snapshots[snapshots.length - 1]?.timestamp ?? firstTimestamp;
	const durationMs = Math.max(1, lastTimestamp - firstTimestamp);
	const yTicks = Array.from(
		{ length: Math.floor((yMax - yMin) / 10) + 1 },
		(_, index) => yMin + index * 10
	);

	const xForTimestamp = (timestamp: number) => {
		if (snapshots.length <= 1) return padding.left;
		const progress = clamp((timestamp - firstTimestamp) / durationMs, 0, 1);
		return padding.left + progress * innerWidth;
	};

	const yForLife = (life: number) => {
		const progress = (life - yMin) / yRange;
		return padding.top + innerHeight - progress * innerHeight;
	};

	const linePathFromPoints = (points: ChartPoint[]) => {
		if (points.length === 0) return '';
		if (points.length === 1) {
			const only = points[0];
			return `M ${only.x} ${only.y} L ${only.x + 0.01} ${only.y}`;
		}

		return points
			.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
			.join(' ');
	};

	const playersById = new Map<number, PlayerState>();
	for (const snapshot of snapshots) {
		for (const player of snapshot.players) {
			playersById.set(player.id, player);
		}
	}

	const series: PlayerSeries[] = Array.from(playersById.values())
		.sort((left, right) => left.id - right.id)
		.map((player) => {
			const points = snapshots
				.map((snapshot) => {
					const state = snapshot.players.find((entry) => entry.id === player.id);
					if (!state) return null;
					return {
						x: xForTimestamp(snapshot.timestamp),
						y: yForLife(state.life),
						life: state.life,
						timestamp: snapshot.timestamp
					};
				})
				.filter((point): point is ChartPoint => point !== null);

			return {
				id: player.id,
				name: player.name,
				color: player.color,
				points,
				path: linePathFromPoints(points)
			};
		});

	const latestPoints = series
		.map((entry) => ({
			id: entry.id,
			name: entry.name,
			color: entry.color,
			point: entry.points[entry.points.length - 1] ?? null
		}))
		.filter(
			(entry): entry is { id: number; name: string; color: string; point: ChartPoint } =>
				entry.point !== null
		);

	afterUpdate(() => {
		pathElements.forEach((element, index) => {
			const path = series[index]?.path ?? '';
			if (!element || !path || lastAnimatedPathByIndex.get(index) === path) {
				return;
			}

			lastAnimatedPathByIndex.set(index, path);
			const length = element.getTotalLength();
			element.style.transition = 'none';
			element.style.strokeDasharray = `${length}`;
			element.style.strokeDashoffset = `${length}`;
			requestAnimationFrame(() => {
				element.style.transition = 'stroke-dashoffset 420ms ease-out';
				element.style.strokeDashoffset = '0';
			});
		});
	});
</script>

{#if snapshots.length === 0}
	<div
		class="flex h-full min-h-[18rem] items-center justify-center rounded-2xl border border-dashed border-gray-700 bg-gray-900/60 text-center text-sm text-gray-400"
	>
		{emptyStateText}
	</div>
{:else}
	<div class="h-full w-full rounded-2xl bg-gray-900/70 p-3">
		<svg
			viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
			class="h-full min-h-[20rem] w-full overflow-visible"
		>
			<defs>
				<filter id="chart-glow" x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation="3" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>

			{#each yTicks as tick}
				{@const y = yForLife(tick)}
				<line
					x1={padding.left}
					y1={y}
					x2={viewBoxWidth - padding.right}
					y2={y}
					stroke="#374151"
					stroke-width="1"
					stroke-dasharray="4 8"
				/>
				<text x={padding.left - 14} y={y + 5} fill="#9ca3af" font-size="14" text-anchor="end">
					{tick}
				</text>
			{/each}

			<line
				x1={padding.left}
				y1={padding.top}
				x2={padding.left}
				y2={viewBoxHeight - padding.bottom}
				stroke="#6b7280"
				stroke-width="1.5"
			/>
			<line
				x1={padding.left}
				y1={viewBoxHeight - padding.bottom}
				x2={viewBoxWidth - padding.right}
				y2={viewBoxHeight - padding.bottom}
				stroke="#6b7280"
				stroke-width="1.5"
			/>

			<text
				x={padding.left}
				y={viewBoxHeight - 18}
				fill="#9ca3af"
				font-size="14"
				text-anchor="start"
			>
				0s
			</text>
			<text
				x={viewBoxWidth - padding.right}
				y={viewBoxHeight - 18}
				fill="#9ca3af"
				font-size="14"
				text-anchor="end"
			>
				{formatElapsed(lastTimestamp - firstTimestamp)}
			</text>

			{#each series as entry, index (entry.id)}
				<path
					bind:this={pathElements[index]}
					d={entry.path}
					fill="none"
					stroke={entry.color}
					stroke-width="3"
					stroke-linecap="round"
					stroke-linejoin="round"
					filter="url(#chart-glow)"
				/>
			{/each}

			{#each latestPoints as entry (entry.id)}
				<circle
					cx={entry.point.x}
					cy={entry.point.y}
					r="5.5"
					fill={entry.color}
					stroke="#111827"
					stroke-width="2"
				/>
				<text
					x={entry.point.x + 10}
					y={entry.point.y - 10}
					fill={entry.color}
					font-size="13"
					font-weight="600"
				>
					{entry.name}: {entry.point.life}
				</text>
			{/each}
		</svg>
	</div>
{/if}
