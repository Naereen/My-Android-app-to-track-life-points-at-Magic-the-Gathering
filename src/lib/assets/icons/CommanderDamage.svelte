<script lang="ts">
	// Map player index to icon set
	export let playerIndex: number = 0;
	const iconSets = ['brb', 'btb', 'arn', 'ulg', 'mrd', 'mkm'];
	$: iconSet = iconSets[playerIndex % iconSets.length];
</script>

<span style="font-size: 1.25rem;">
	<i class="ss ss-{iconSet} ss-1x ss-fw ss-mythic ss-grad"></i>
</span>
