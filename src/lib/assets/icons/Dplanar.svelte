<script>
	// The planar die icon is intentionally a tiny adapter around the font glyph so the
	// surrounding modal can animate size, glow, and class state independently.
	export let size = '3.0rem';
	export let finalGlow = false;
</script>

<!-- The dicefont glyph stays semantic: CSS classes decide whether it looks "final". -->
<i
	class="mi mi-planeswalk mi-3x text-white"
	class:dice-final={finalGlow}
	style="font-size: {size};"
></i>
