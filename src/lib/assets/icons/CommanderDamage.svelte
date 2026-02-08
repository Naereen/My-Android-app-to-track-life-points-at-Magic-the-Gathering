<script lang="ts">
	// Use the player index
	export let playerIndex: number = 0;
	// Allow passing a color prop to customize the icon color (e.g. for dark mode)
	export let color: string = 'inherit';
	// Allow passing additional CSS classes for effects like gradients or foils
	export let extraEffects: string = '';
	// Allow passing additional CSS for rotation or other transformations
	export let extraRotationEffect: string = '';
	// Map player index to icon set
	const iconSets = [
		'ss-brb',  // Battle Royale
		'ss-van',  // Vanguard
		'ss-mom',  // March of the Machines
		'ss-ulg',  // Urza's Legacy
		'ss-mrd',  // Mirrodin
		'ss-nms'   // Nemesis
	];
	$: iconSet = iconSets[playerIndex % iconSets.length];
	const effects = [
		// 'ss-common ',
		// 'ss-uncommon ',
		// 'ss-rare ',
		// 'ss-timeshifted ',
		'ss-mythic '
		+ 'ss-grad '
		// + 'ss-foil '
	];
	const rotationEffects = [
		'transform: rotate(-45deg);',
		'transform: rotate(0deg);',
		'transform: rotate(-45deg);',
		'transform: rotate(22deg);',
		'transform: rotate(22deg);',
		'transform: rotate(-45deg);',
		'transform: rotate(0deg);'
	];
	$: effect = effects[playerIndex % effects.length];
	$: rotationEffect = extraRotationEffect ? extraRotationEffect : rotationEffects[playerIndex % rotationEffects.length];
</script>

<span style="font-size: 1.25rem; color: {color}; display: inline-grid; align-items: center;">
	<i class="ss {iconSet} ss-1x ss-fw {effect} {extraEffects}" style="{rotationEffect}"></i>
</span>
