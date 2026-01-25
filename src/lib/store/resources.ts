import { writable, type Writable } from 'svelte/store';

export const resourceCounter: Writable<{ [key in App.Resources.Resource]: number }> = writable({
	white: 0,
	blue: 0,
	black: 0,
	red: 0,
	green: 0,
	waste: 0,
	storm: 0
});

export const setResource = (resourceType: App.Resources.Resource, count: number) => {
	resourceCounter.update((currentResources) => {
		const resources = { ...currentResources };
		resources[resourceType] = count;
		if (resources[resourceType] <= 0) resources[resourceType] = 0;
		return resources;
	});
};

export const resetResources = () => {
	resourceCounter.update((currentResources) => {
		const resources = { ...currentResources };
		for (const resource in resources) {
			resources[resource as App.Resources.Resource] = 0;
		}
		return resources;
	});
};
