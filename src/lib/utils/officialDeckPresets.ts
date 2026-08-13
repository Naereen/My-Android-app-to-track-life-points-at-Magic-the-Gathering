export type OfficialDeckPreset = {
	code: string;
	name: string;
	cardCount: number;
};

export const planechaseOfficialPresets: OfficialDeckPreset[] = [
	{ code: 'OPCA', name: 'Planechase Anthology (2016)', cardCount: 86 },
	{ code: 'MOC', name: 'March of the Machine (2023)', cardCount: 50 },
	{ code: 'WHO', name: 'Doctor Who (2023)', cardCount: 40 },
	{ code: 'PUNK', name: 'Black Lotus Unknown Planechase (2024)', cardCount: 10 },
	{ code: 'PSSC', name: 'Secret Lair Showcase Planes (2024)', cardCount: 10 }
];

export const archenemyOfficialPresets: OfficialDeckPreset[] = [
	{ code: 'OARC', name: 'Archenemy (2010)', cardCount: 45 },
	{ code: 'OE01', name: 'Archenemy: Nicol Bolas (2017)', cardCount: 20 },
	{ code: 'DSC', name: 'Duskmourn Commander (2024)', cardCount: 40 },
 { code: 'DCI', name: 'DCI Promos', cardCount: 5 },
];
