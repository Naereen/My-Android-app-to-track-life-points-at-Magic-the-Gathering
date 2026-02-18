// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		namespace AppState {
			type Menu = 'settings' | 'resources' | 'randomizer' | 'emblem' | 'history' | '';
		}

		namespace Settings {
			type PlayerCount = 2 | 3 | 4 | 5 | 6;
			type FourPlayerLayout = 'matrix' | 'stacked';
			type SixPlayerLayout = 'one' | 'two';

			type Data = {
				playerCount: PlayerCount;
				fourPlayerLayout: FourPlayerLayout;
				sixPlayerLayout: SixPlayerLayout;

				startingLife: number;
				allowNegativeLife: boolean;
				showTempLife: boolean;
				showLifeChangeAnimations: boolean;

				showPoison: boolean;
				showCommanderDamage: boolean;
				showStatusEffects: boolean;

				orientation: Player.Orientation;
				keepScreenOn: boolean;
				enableVibration: boolean;
				theme: 'system' | 'light' | 'dark';
				language: string;

				showResourcesPanel: boolean;
				resourceOrder: App.Resources.Resource[];
				resourceCounts: Record<App.Resources.Resource, number>;

				defaultBackground?: string | null;
				enableBackgroundAttribution: boolean;

				autoRotateLayout: boolean;
				layoutZoom: number;

				// misc
				confirmOnReset: boolean;
				confirmOnPlayerRemove: boolean;
			};
		}
		namespace Player {
			type LifeMoveType = 'subtract' | 'add';
			type Orientation = 'up' | 'down' | 'left' | 'right';

			type Data = {
				id: number;
				lifeTotal: number;
				playerName: string;
				color: string;
				backgroundImage?: string | string[] | null;
				tempLifeDiff: number;
				backgroundArtist?: string | null;
				backgroundSet?: string | null;
				poison?: number;
				statusEffects?: {
					monarch?: boolean;
					initiative?: boolean;
					ascend?: boolean;
					dayNight?: boolean;
					ko?: boolean;
					energy?: number;
					experience?: number;
					rad?: number;
					acorn?: number;
					ticket?: number;
					commandTax?: number;
					commanderDamage?: number[];
					ringBearer?: number;
					startYourEngineSpeed?: number;
					// allow indexing for custom/unknown status keys
					[key: string]: boolean | number | number[] | undefined;
				};
				allowNegativeLife?: boolean;
				highlighted: boolean;
				isFirst: boolean;
				isDead: boolean;
			};
		}

		namespace Resources {
			type Resource = 'white' | 'blue' | 'black' | 'red' | 'green' | 'waste' | 'storm';
		}
	}
}

export { App };
