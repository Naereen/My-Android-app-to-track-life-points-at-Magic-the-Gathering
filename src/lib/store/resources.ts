import { type Writable } from 'svelte/store';
import { persist } from './persist';
import { addGameHistoryEntry } from './gameHistory';

export const resourceCounter: Writable<{ [key in App.Resources.Resource]: number }> = persist(
	'resourceCounter',
	{
		white: 0,
		blue: 0,
		black: 0,
		red: 0,
		green: 0,
		waste: 0,
		storm: 0
	}
);

export const setResource = (resourceType: App.Resources.Resource, count: number) => {
	const nextCount = Math.max(0, Math.trunc(count));
	let previousCount = 0;
	let changed = false;

	resourceCounter.update((currentResources) => {
		const resources = { ...currentResources };
		previousCount = resources[resourceType] ?? 0;
		if (previousCount === nextCount) {
			return resources;
		}

		resources[resourceType] = nextCount;
		changed = true;
		return resources;
	});

	if (changed) {
		addGameHistoryEntry({
			playerId: 0,
			playerName: '',
			kind: 'resourceChange',
			payload: {
				key: resourceType,
				from: previousCount,
				to: nextCount
			}
		});
	}
};

export const resetResources = () => {
	let changed = false;

	resourceCounter.update((currentResources) => {
		const resources = { ...currentResources };
		for (const resource in resources) {
			if (resources[resource as App.Resources.Resource] !== 0) {
				changed = true;
			}
			resources[resource as App.Resources.Resource] = 0;
		}
		return resources;
	});

	if (changed) {
		addGameHistoryEntry({
			playerId: 0,
			playerName: '',
			kind: 'resourceReset',
			payload: {}
		});
	}
};
