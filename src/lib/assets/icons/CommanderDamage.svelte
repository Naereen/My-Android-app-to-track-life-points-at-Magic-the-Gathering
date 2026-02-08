<script lang="ts">
	// Map player index to icon set
	export let playerIndex: number = 0;
	const iconSets = ['brb', 'btd', 'arn', 'ulg', 'mrd', 'ust'];
	$: iconSet = iconSets[playerIndex % iconSets.length];
	const effects = [
		// 'ss-common ss-foil', 'ss-uncommon ss-grad', 'ss-rare ss-grad',
		'ss-mythic ss-grad'
	];
	$: effect = effects[playerIndex % effects.length];
</script>

<span style="font-size: 1.25rem; display: inline-flex; align-items: center;">
	<i class="ss ss-{iconSet} ss-1x ss-fw {effect}"></i>
</span>
