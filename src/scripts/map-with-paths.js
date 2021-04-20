import { MapScroll, MAP_WIDTH, MAP_HEIGHT } from './map.js';

export const POINT_RADIUS = 4;
export const GRID_STEP = 16;
export const GRID_OFFSET_X = 2;
export const GRID_OFFSET_Y = 3;

export class MapWithPaths extends MapScroll {
	constructor () {
		super();
		this.points = [];
		this.pointsCount = 0;
		const map = this;
		this.pathMode = false;
		this.pathData = {
			from: {
				floor: 1,
				path: []
			},
			to: {
				floor: 1,
				path: []
			}
		}

		$('.map--editable__load').click(function(ev) {
			let t = document.createElement('input');
			t.type = 'file';
			t.accept = 'application/JSON';

			$(t).click();

			t.addEventListener('change', function(ev) {
				let file = this.files[0];
				let reader = new FileReader();

				reader.addEventListener('load', function(ev) {
					let text = ev.target.result;
					map.loadFromJSON(JSON.parse(text));
					$(t).remove();
				});

				reader.readAsText(file);
			});
		}); 
		map.redrawFiltered([]);
	}

	initFloorButtons() {
		var $buttons = $(`.floor-button`);
		var map = this;

		$(`.floor-button[data-floor="${map.currentFloor}"]`).addClass('floor-button--active');

		$buttons.click(function(ev) {
			if (!this.classList.contains('floor-button--disabled')) {
				$buttons.removeClass('floor-button--active');
				$(this).addClass('floor-button--active'); 
				map.changeFloor(Number(this.getAttribute('data-floor')));

				let t = map.pathMode?
					map.currentFloor == map.pathData.from.floor?
						map.pathData.from.path:
							map.currentFloor == map.pathData.to.floor? map.pathData.to.path:
								[] : [];

				map.redrawFiltered(t);
			} else {
				map.pathMode = false;
				$buttons.removeClass('floor-button--disabled');
				$buttons.removeClass('floor-button--active');
				$(this).addClass('floor-button--active');
				map.changeFloor(Number(this.getAttribute('data-floor')));
				map.redrawFiltered([]);
			}
		});
	}

	loadFromJSON(data, floor) {
		const map = this;

		this.points = [];
		this.pointsCount = 0;

		if (!this.floorPoints && floor) {
			this.floorPoints = {};
			this.floorPointCounts = {};
		}

		data.points.forEach(p => {
			map.addPoint(p);
		});

		if (floor) {
			this.floorPoints[floor] = this.points;
			this.floorPointCounts[floor] = data.count;
		}

		this.pointsCount = data.count;
	}

	changeFloor(newFloor) {
		const map = this;

		map.currentFloor = newFloor;

		if (this.floorPoints) {
			this.points = [...this.floorPoints[newFloor]];
			this.pointsCount = this.floorPointCounts[newFloor];
		}
	}

	addPoint(point) {
		if (!point.aid) point.aid = '';
		this.points.push(point);
	}

	addNewPoint(x, y) {
		const id = this.pointsCount++;
		const P = {
			x: x, y: y, id: id, connections: [], name: '', aid: ''
		};

		this.addPoint(P);
	}

	drawPoint(x, y, color = '#ff0000') {
		this.ctx.beginPath();
		this.ctx.strokeStyle = '#000000';
		this.ctx.arc(x, y, POINT_RADIUS, 0, 2 * Math.PI, false);
		this.ctx.fillStyle = color;
		this.ctx.fill();
		this.ctx.stroke();
	}

	getPointById(id) {
		return this.points.filter(k => k.id == id)[0];
	}

	getPointIndex(id) {
		let p = this.getPointById(id);

		return this.points.indexOf(p);
	}

	redraw() {
		super.redraw()
		const map = this;

		this.points.forEach(function(value, index, arr) {

			value.connections.forEach(con => {
				if (con > value.id) {
					let conPoint = map.points.filter(k => k.id == con)[0];

					if (conPoint) {
						map.ctx.beginPath();
						map.ctx.moveTo(value.x, value.y);
						map.ctx.lineTo(conPoint.x, conPoint.y);
						map.ctx.strokeStyle = '#ff6666';
						map.ctx.stroke();
					}
				}
			});

			map.drawPoint(value.x, value.y, value.name, '#ff0000');
		})
	}

	bind() {
		this.initFloorButtons();
		this.bindMoveAround();
		const map = this;
		const mapBox = map.block.getBoundingClientRect();

		$(this.block).on('mousedown', function(ev) {
			ev.preventDefault();
			var X = ev.pageX - map.pos.x - mapBox.left;
			var Y = ev.pageY - map.pos.y - mapBox.top;
			var checkResult;

			if (ev.button == 0) {
				checkResult = map.checkPointCollision(X, Y);

				if (checkResult.length > 0) {
					let point = checkResult[0];
				}
			}
		});
	}

	checkPointCollision(x, y) {
		let stack = [];
		this.points.forEach(function(value, index, arr){
			if ((x - value.x)**2 + (y - value.y)**2 <= (POINT_RADIUS)**2) {
				stack.push(value.id);
			}
		})
		return stack;
	}

	redrawFiltered(filter) {
		super.redraw()
		const map = this;

		this.points.forEach(function(value, index, arr) {
			if (filter.includes(value.id)) {
				value.connections.forEach(con => {
					if (con > value.id && filter.includes(con)) {
						let conPoint = map.points.filter(k => k.id == con)[0];
	
						if (conPoint) {
							map.ctx.beginPath();
							map.ctx.moveTo(value.x, value.y);
							map.ctx.lineTo(conPoint.x, conPoint.y);
							map.ctx.strokeStyle = '#ff6666';
							map.ctx.stroke();
						}
					}
				});
	
				map.drawPoint(value.x, value.y, value.name, '#ff0000');
			}
		});
	}

	cabQuery(from, to) {
		let fromFloor = Number(from.charAt(0));
		let toFloor = Number(to.charAt(0));
		
		if (fromFloor == toFloor) {
			let path = this.path(from, to, this.floorPoints[fromFloor]);

			this.pathMode = true;
			this.pathData.from.floor = fromFloor;
			this.pathData.from.path = path;
			this.pathData.to.floor = toFloor;
			this.pathData.to.path = path;

			$(`.floor-button[data-floor="${fromFloor}"]`).click();

			let $buttons = $(`.floor-button`);

			$buttons.addClass('floor-button--disabled');
			$(`.floor-button[data-floor="${fromFloor}"]`).removeClass('floor-button--disabled');

		} else {
			let toPath = this.shortestPath(to, 'Л', this.floorPoints[toFloor]);
			let aid = this.floorPoints[toFloor].find(x => x.id == toPath[toPath.length - 1]).aid;
			let fromPath = this.path(from, aid, this.floorPoints[fromFloor], false, true);

			this.pathMode = true;
			this.pathData.from.floor = fromFloor;
			this.pathData.from.path = fromPath;
			this.pathData.to.floor = toFloor;
			this.pathData.to.path = toPath;

			$(`.floor-button[data-floor="${fromFloor}"]`).click();

			let $buttons = $(`.floor-button`);

			$buttons.addClass('floor-button--disabled');
			$(`.floor-button[data-floor="${fromFloor}"]`).removeClass('floor-button--disabled');
			$(`.floor-button[data-floor="${toFloor}"]`).removeClass('floor-button--disabled');
		}
	}

	shortestPath(from, to, pointSet = false, fromAid = false, toAid = false) {
		let G = [];
		let G1 = [];
		let map = {};
		let imap = {};

		if (!pointSet) pointSet = [...this.points];

		pointSet.forEach(p => {
			G.push([]);
			G1.push(p.name);
			map[p.id] = G.length - 1;
			imap[G.length - 1] = p.id;
		});

		pointSet.forEach(p => {
			p.connections.forEach(c => {
				G[map[p.id]].push(map[c]);
			});
		});

		const FROM = fromAid? map[pointSet.filter(k => k.aid == from)[0].id]
			: map[pointSet.filter(k => k.name == from)[0].id];
		const TO = toAid? map[pointSet.filter(k => k.aid == to)[0].id]
			: map[pointSet.filter(k => k.name == to)[0].id];

		if (FROM >= 0 && TO >= 0) {
			function iterate(T) {
				let Q = [];
				let V = new Array(G.length);

				Q.push({
					id: T,
					parents: [T]
				});

				V[T] = true;

				while (Q.length > 0) {
					let t = Q.shift();

					let adj = [...G[t.id]];

					for (let j = 0; j < adj.length; j++) {
						if (!V[adj[j]]) {
							Q.push({
								id: adj[j],
								parents: t.parents.concat([adj[j]])
							});
							V[adj[j]] = true;

							if (G1[adj[j]] == to) {
								return Q[Q.length - 1];
							}
						}
					}
				}
			}

			let a = iterate(FROM);

			if (a) {
				let r = [];

				a.parents.forEach(p=>{
					r.push(imap[p]);
				});

				return r;
			} else {
				return null
			} 
		} else {
			return null;
		}
	}

	path(from, to, pointSet = false, fromAid = false, toAid = false) {
		let G = [];
		let map = {};
		let imap = {};

		if (!pointSet) pointSet = [...this.points];

		pointSet.forEach(p => {
			G.push([]);
			map[p.id] = G.length - 1;
			imap[G.length - 1] = p.id;
		});

		pointSet.forEach(p => {
			p.connections.forEach(c => {
				G[map[p.id]].push(map[c]);
			});
		});

		const FROM = fromAid? map[pointSet.filter(k => k.aid == from)[0].id]
			: map[pointSet.filter(k => k.name == from)[0].id];
		const TO = toAid? map[pointSet.filter(k => k.aid == to)[0].id]
			: map[pointSet.filter(k => k.name == to)[0].id];

		function iterate(T, V, P) {
			V[T] = true;

			for (let j = 0; j < G[T].length; j++) {
				if (G[T][j] == TO) {
					P.push(TO);
					return P;
				} else {
					if (!V[G[T][j]]) {
						let NP = [...P];
						NP.push(G[T][j]);
						let nextStep = iterate(G[T][j], V, NP);
						if (nextStep) {
							return nextStep;
						} else {
						}
					}
				}
			}
		}

		if (FROM >= 0 && TO >= 0) {
			let attempt = iterate(FROM, new Array(G.length), [FROM]);

			if (attempt) {
				let result = [];

				attempt.forEach(p => {
					result.push(imap[p]);
				});

				return result;
			} else {
				return null;
			}
		} else {
			return null;
		}
	}
}
