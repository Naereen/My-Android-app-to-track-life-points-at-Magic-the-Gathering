// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		namespace AppState {
			type Menu = 'settings' | 'resources' | 'randomizer' | '';
		}
		namespace Player {
			type LifeMoveType = 'subtract' | 'add';
			type Orientation = 'up' | 'down' | 'left' | 'right';

			type Data = {
				id: number;
				lifeTotal: number;
				playerName: string;
				color: string;
				backgroundImage?: string | null;
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

export {};
