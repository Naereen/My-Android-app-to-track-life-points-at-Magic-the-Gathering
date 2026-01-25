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
				tempLifeDiff: number;
				poison?: number;
				highlighted: boolean;
				isFirst: boolean;
			};
		}
		namespace Resources {
			type Resource = 'white' | 'blue' | 'black' | 'red' | 'green' | 'waste' | 'storm';
		}
	}
}

export {};
