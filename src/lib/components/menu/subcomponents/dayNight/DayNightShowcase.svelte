<script lang="ts">
	import { dayNightShowcase } from '$lib/store/dayNightShowcase';
	import { _ } from 'svelte-i18n';

	$: phase = $dayNightShowcase.phase;
	$: isDay = phase === 'day';
	$: phaseLabel = String($_(isDay ? 'day' : 'night') ?? (isDay ? 'Day' : 'Night'));
</script>

{#if $dayNightShowcase.visible}
	<div
		class="pointer-events-none fixed inset-0 z-[190] flex items-center justify-center bg-black/55 p-5 backdrop-blur-sm"
	>
		<div
			class={`showcase-shell ${isDay ? 'showcase-shell-day' : 'showcase-shell-night'}`}
			role="status"
			aria-live="polite"
			aria-label={`${String($_('day_night') ?? 'Day / Night')}: ${phaseLabel}`}
		>
			<div class="showcase-frame">
				<div class={`showcase-art ${isDay ? 'showcase-art-day' : 'showcase-art-night'}`}>
					<div class="showcase-glow" aria-hidden="true"></div>
					<div class="showcase-stars" aria-hidden="true"></div>
					<div class="showcase-orb" aria-hidden="true"></div>

					<div class="relative z-10 flex w-full flex-col items-center gap-3 text-center">
						<p class="text-xs font-semibold uppercase tracking-[0.45em] text-white/80">
							{$_('day_night') ?? 'Day / Night'}
						</p>
						<div class="showcase-emblem">
							<span class="text-6xl leading-none drop-shadow-[0_0_18px_rgba(255,255,255,0.35)]">
								{isDay ? '☀️' : '🌙'}
							</span>
						</div>
						<div class="rounded-full border border-white/20 bg-black/25 px-5 py-2 shadow-lg">
							<p class="text-2xl font-black uppercase tracking-[0.3em] text-white">
								{phaseLabel}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.showcase-shell {
		width: min(100%, 23rem);
		animation: showcase-enter 240ms ease-out;
		filter: drop-shadow(0 30px 50px rgba(0, 0, 0, 0.55));
	}

	.showcase-frame {
		border-radius: 1.9rem;
		padding: 0.45rem;
		background: linear-gradient(145deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.18)),
			linear-gradient(145deg, rgba(255, 214, 102, 0.45), rgba(125, 211, 252, 0.25));
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.65),
			0 0 0 1px rgba(255, 255, 255, 0.14);
	}

	.showcase-art {
		position: relative;
		overflow: hidden;
		min-height: 25rem;
		border-radius: 1.55rem;
		padding: 2rem 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.16);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
	}

	.showcase-shell-day .showcase-frame {
		background: linear-gradient(160deg, rgba(254, 243, 199, 0.95), rgba(224, 242, 254, 0.45)),
			linear-gradient(145deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.18));
	}

	.showcase-shell-night .showcase-frame {
		background: linear-gradient(160deg, rgba(196, 181, 253, 0.82), rgba(148, 163, 184, 0.35)),
			linear-gradient(145deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.18));
	}

	.showcase-art-day {
		background: radial-gradient(
				circle at 50% 22%,
				rgba(255, 248, 196, 0.95),
				rgba(255, 248, 196, 0.06) 23%
			),
			linear-gradient(
				180deg,
				rgba(59, 130, 246, 0.95) 0%,
				rgba(125, 211, 252, 0.9) 42%,
				rgba(254, 243, 199, 0.96) 100%
			);
	}

	.showcase-art-night {
		background: radial-gradient(
				circle at 50% 18%,
				rgba(248, 250, 252, 0.2),
				rgba(248, 250, 252, 0) 20%
			),
			linear-gradient(
				180deg,
				rgba(15, 23, 42, 0.98) 0%,
				rgba(49, 46, 129, 0.95) 50%,
				rgba(88, 28, 135, 0.92) 100%
			);
	}

	.showcase-glow {
		position: absolute;
		inset: auto -18% -28% -18%;
		height: 52%;
		border-radius: 9999px 9999px 0 0;
		background: rgba(17, 24, 39, 0.18);
		backdrop-filter: blur(1px);
	}

	.showcase-shell-day .showcase-glow {
		background: radial-gradient(
				circle at 50% 15%,
				rgba(255, 248, 196, 0.45),
				rgba(255, 248, 196, 0) 55%
			),
			linear-gradient(180deg, rgba(251, 191, 36, 0.18), rgba(30, 64, 175, 0.28));
	}

	.showcase-shell-night .showcase-glow {
		background: radial-gradient(
				circle at 50% 15%,
				rgba(216, 180, 254, 0.28),
				rgba(216, 180, 254, 0) 55%
			),
			linear-gradient(180deg, rgba(15, 23, 42, 0.18), rgba(76, 29, 149, 0.38));
	}

	.showcase-stars {
		position: absolute;
		inset: 0;
		background-image: radial-gradient(
				circle at 18% 22%,
				rgba(255, 255, 255, 0.82) 0 0.13rem,
				transparent 0.14rem
			),
			radial-gradient(circle at 76% 18%, rgba(255, 255, 255, 0.72) 0 0.1rem, transparent 0.11rem),
			radial-gradient(circle at 24% 58%, rgba(255, 255, 255, 0.35) 0 0.09rem, transparent 0.1rem),
			radial-gradient(circle at 82% 46%, rgba(255, 255, 255, 0.3) 0 0.08rem, transparent 0.09rem);
		opacity: 0.2;
	}

	.showcase-shell-night .showcase-stars {
		opacity: 0.85;
	}

	.showcase-shell-day .showcase-stars {
		opacity: 0.12;
	}

	.showcase-orb {
		position: absolute;
		left: 50%;
		top: 19%;
		height: 7.5rem;
		width: 7.5rem;
		transform: translateX(-50%);
		border-radius: 9999px;
		box-shadow: 0 0 40px rgba(255, 255, 255, 0.3);
	}

	.showcase-shell-day .showcase-orb {
		background: radial-gradient(
			circle,
			rgba(255, 255, 255, 0.98) 0%,
			rgba(254, 243, 199, 0.95) 38%,
			rgba(251, 191, 36, 0.75) 65%,
			rgba(251, 191, 36, 0) 100%
		);
	}

	.showcase-shell-night .showcase-orb {
		background: radial-gradient(
			circle at 38% 38%,
			rgba(255, 255, 255, 0.98) 0%,
			rgba(226, 232, 240, 0.95) 38%,
			rgba(196, 181, 253, 0.55) 66%,
			rgba(196, 181, 253, 0) 100%
		);
	}

	.showcase-emblem {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 8.5rem;
		width: 8.5rem;
		border-radius: 9999px;
		border: 0.35rem solid rgba(255, 255, 255, 0.82);
		background: radial-gradient(
				circle at 35% 35%,
				rgba(255, 255, 255, 0.3),
				rgba(255, 255, 255, 0) 55%
			),
			rgba(15, 23, 42, 0.48);
		box-shadow:
			0 12px 30px rgba(15, 23, 42, 0.35),
			inset 0 0 18px rgba(255, 255, 255, 0.12);
	}

	@keyframes showcase-enter {
		from {
			opacity: 0;
			transform: translateY(0.75rem) scale(0.94);
		}

		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
</style>
