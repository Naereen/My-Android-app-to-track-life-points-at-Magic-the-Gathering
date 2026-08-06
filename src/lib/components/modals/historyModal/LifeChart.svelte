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
		visibleMarkerIndices: Set<number>;
		markerKind: number;
		dashArray: string;
	};

	const viewBoxWidth = 1000;
	const viewBoxHeight = 900;
	const padding = {
		top: 0,
		right: 36,
		bottom: 0,
		left: 20
	};

	let pathElements: SVGPathElement[] = [];
	const lastAnimatedPathByIndex = new Map<number, string>();
	const markerStroke = '#e5e7eb';
	const dashPatterns = ['0', '8 6', '3 5', '10 4 2 4', '2 4', '14 5', '6 3 1 3', '12 3 3 3'];

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

	const formatFiveMinuteTickLabel = (milliseconds: number) => {
		const totalMinutes = Math.floor(milliseconds / 60000);
		if (totalMinutes < 60) {
			return `${totalMinutes}m`;
		}

		const hours = Math.floor(totalMinutes / 60);
		const remainingMinutes = totalMinutes % 60;
		return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`;
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
	const xTickIntervalMs = 5 * 60 * 1000;
	const yTicks = Array.from(
		{ length: Math.floor((yMax - yMin) / 10) + 1 },
		(_, index) => yMin + index * 10
	);
	const xTicksMs = Array.from(
		{ length: Math.floor(durationMs / xTickIntervalMs) },
		(_, index) => (index + 1) * xTickIntervalMs
	).filter((value) => value < durationMs);
	const xTicksMsWithoutLast = xTicksMs.slice(0, -1);

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

	const getVisibleMarkerIndices = (points: ChartPoint[]) => {
		const visible = new Set<number>();
		if (points.length === 0) return visible;

		for (let index = 0; index < points.length; index++) {
			if (index === 0 || index === points.length - 1) {
				visible.add(index);
				continue;
			}

			const previous = points[index - 1];
			const current = points[index];
			const next = points[index + 1];

			const hasSameLifeAsNeighbors = previous.life === current.life && current.life === next.life;
			if (!hasSameLifeAsNeighbors) {
				visible.add(index);
			}
		}

		return visible;
	};

	const markerPolygonPoints = (kind: number, size: number) => {
		switch (kind % 8) {
			case 2:
				return `0,-${size} ${size},0 0,${size} -${size},0`;
			case 3:
				return `0,-${size} ${size},${size} -${size},${size}`;
			case 4:
				return `${-size},-${size / 2} ${size},-${size / 2} ${size},${size / 2} ${-size},${size / 2}`;
			case 5:
				return `0,-${size} ${size},-${size / 4} ${size / 2},${size} -${size / 2},${size} -${size},-${size / 4}`;
			case 6:
				return `0,-${size} ${size},-${size / 3} ${size},${size / 3} 0,${size} -${size},${size / 3} -${size},-${size / 3}`;
			case 7:
				return `0,-${size} ${size},0 ${size / 2},${size} -${size / 2},${size} -${size},0`;
			default:
				return '';
		}
	};

	const playersById = new Map<number, PlayerState>();
	for (const snapshot of snapshots) {
		for (const player of snapshot.players) {
			playersById.set(player.id, player);
		}
	}

	const series: PlayerSeries[] = Array.from(playersById.values())
		.sort((left, right) => left.id - right.id)
		.map((player, index) => {
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
				path: linePathFromPoints(points),
				visibleMarkerIndices: getVisibleMarkerIndices(points),
				markerKind: index % 8,
				dashArray: dashPatterns[index % dashPatterns.length]
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
					stroke={tick === 0 ? '#d1d5db' : '#374151'}
					stroke-width={tick === 0 ? 3 : 1}
					stroke-dasharray={tick === 0 ? undefined : '4 8'}
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

			{#each xTicksMsWithoutLast as tickMs (tickMs)}
				{@const tickX = padding.left + (tickMs / durationMs) * innerWidth}
				<line
					x1={tickX}
					y1={viewBoxHeight - padding.bottom}
					x2={tickX}
					y2={viewBoxHeight - padding.bottom - 10}
					stroke="#6b7280"
					stroke-width="1.2"
				/>
				<text x={tickX} y={viewBoxHeight - 26} fill="#9ca3af" font-size="12" text-anchor="middle">
					{formatFiveMinuteTickLabel(tickMs)}
				</text>
			{/each}

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
				font-size="30"
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
					stroke-dasharray={entry.dashArray}
					stroke-linecap="round"
					stroke-linejoin="round"
					filter="url(#chart-glow)"
				/>
				{#each entry.points as point, pointIndex (`${entry.id}-${point.timestamp}-${pointIndex}`)}
					{#if entry.visibleMarkerIndices.has(pointIndex)}
						<g transform={`translate(${point.x} ${point.y})`}>
							{#if entry.markerKind === 0}
								<circle r="4.6" fill={entry.color} stroke={markerStroke} stroke-width="1.4" />
							{:else if entry.markerKind === 1}
								<rect
									x="-4.25"
									y="-4.25"
									width="8.5"
									height="8.5"
									fill={entry.color}
									stroke={markerStroke}
									stroke-width="1.4"
									rx="1.5"
								/>
							{:else if entry.markerKind === 2}
								<polygon
									points={markerPolygonPoints(entry.markerKind, 5)}
									fill={entry.color}
									stroke={markerStroke}
									stroke-width="1.4"
								/>
							{:else if entry.markerKind === 3}
								<polygon
									points={markerPolygonPoints(entry.markerKind, 5)}
									fill={entry.color}
									stroke={markerStroke}
									stroke-width="1.4"
								/>
							{:else if entry.markerKind === 4}
								<polygon
									points={markerPolygonPoints(entry.markerKind, 5)}
									fill={entry.color}
									stroke={markerStroke}
									stroke-width="1.4"
								/>
							{:else if entry.markerKind === 5}
								<polygon
									points={markerPolygonPoints(entry.markerKind, 5)}
									fill={entry.color}
									stroke={markerStroke}
									stroke-width="1.4"
								/>
							{:else if entry.markerKind === 6}
								<polygon
									points={markerPolygonPoints(entry.markerKind, 5)}
									fill={entry.color}
									stroke={markerStroke}
									stroke-width="1.4"
								/>
							{:else}
								<polygon
									points={markerPolygonPoints(entry.markerKind, 5)}
									fill={entry.color}
									stroke={markerStroke}
									stroke-width="1.4"
								/>
							{/if}
						</g>
					{/if}
				{/each}
			{/each}

			{#each latestPoints as entry (entry.id)}
				<text
					x={entry.point.x - 70}
					y={entry.point.y - 10}
					fill={entry.color}
					font-size="25"
					font-weight="600"
				>
					{entry.name} : {entry.point.life}
				</text>
			{/each}
		</svg>
	</div>
{/if}
