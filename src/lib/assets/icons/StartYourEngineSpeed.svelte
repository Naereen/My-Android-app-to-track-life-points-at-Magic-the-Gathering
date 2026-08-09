<script lang="ts">
	// Speed-related badge can appear in normal or "maxed" styling, so the icon selects the
	// rarity sheet classes at render time instead of hard-coding one variant.
	export let isMax: boolean = false;
</script>

<!-- This symbol uses the font icon sheet because the mechanic is mostly about compactness,
     not about showing a standalone SVG illustration. -->
<span style="font-size: 1.25rem;">
	<i class={"ss ss-dft ss-1x ss-fw " + (isMax ? 'ss-mythic ss-grad' : 'ss-rare')}></i>
</span>
