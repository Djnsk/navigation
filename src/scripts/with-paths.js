import { MapWithPaths } from './map-with-paths.js';

window.MWP = new MapWithPaths();

let j = 0;

for (let i = 1; i < 5; i++) {
	$.ajax({
		url: `/api/data/floors/${i}.json`,
		method: 'GET'
	}).then(function (data) {
		MWP.loadFromJSON(data, i);
		
		if (++j == 4) {
			MWP.changeFloor(1);
			MWP.redrawFiltered([]);
		}
	});
}
