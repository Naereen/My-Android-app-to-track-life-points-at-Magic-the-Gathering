<script lang="ts">
	// The ring-bearer icon toggles its rarity styling based on whether the mechanic is
	// in a maxed state or in its ordinary presentation.
	export let isMax: boolean = false;
</script>

<!-- The icon stays tiny because it is usually paired with a numeric counter. -->
<span style="font-size: 1.25rem;">
	<i class={'ss ss-ltr ss-1x ss-fw ' + (isMax ? 'ss-mythic ss-grad' : 'ss-rare')}></i>
</span>
