import { MAP_WIDTH, MAP_HEIGHT } from './map.js';
import { POINT_RADIUS, GRID_STEP, GRID_OFFSET_X, GRID_OFFSET_Y, MapWithPaths } from './map-with-paths.js';

export default class MapEditable extends MapWithPaths {
	constructor () {
		super();
		this.$pointList = $('.map--editable__point-list');
		this.activePoints = [];
		const map = this;

		$('.map--editable__save').click(function(ev) {
			download('map.json', JSON.stringify({
				points: map.points,
				count: map.pointsCount
			}, null, 2));
		});

		$('.map--editable__floor').click(function(ev) {
			map.currentFloor = Number(this.getAttribute('data-floor'));
			map.redraw();
		});

		$('.map--editable__load').click(function(ev) {
			let t = document.createElement('input');
			t.type = 'file';
			t.accept = 'application/JSON';

			// $(t).click();

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
	}

	addPoint(point) {
		super.addPoint(point);
		const map = this;

		this.redraw()

		let block = this.createPointBlock(point.id);

		block.text.innerHTML = `
			id: ${point.id},
			X: ${point.x},
			Y: ${point.y}
		`;

		this.$pointList.append(block.point);
		// block.point.append(block.input);

		block.point.onmouseenter = function (ev) {
			let p = map.getPointById(point.id);

			map.drawPoint(p.x, p.y, p.name, '#662561');
		};

		block.point.onmouseleave = function (ev) {
			map.redraw();
		};

		block.input.value = point.name;
		block.anchor.value = point.aid;

		block.input.oninput = function (ev) {
			map.points[map.getPointIndex(point.id)].name = block.input.value;
		};

		block.anchor.oninput = function (ev) {
			map.points[map.getPointIndex(point.id)].aid = block.anchor.value;
		};
	}

	createPointBlock(id) {
		let point = document.createElement('div');
		let text = document.createElement('div');
		let input = document.createElement('input');
		let anchor = document.createElement('input');

		text.classList.add('map--editable__point-text')
		point.classList.add('map--editable__point');
		point.setAttribute('data-id', id);
		input.setAttribute('type', 'text');
		input.setAttribute('maxlength', 5);
		input.setAttribute('size', 5);
		anchor.setAttribute('type', 'text');
		anchor.setAttribute('maxlength', 5);
		anchor.setAttribute('size', 5);
		point.append(text);
		point.append(input);
		point.append(anchor);

		return {
			text: text,
			point: point,
			input: input,
			anchor: anchor
		};
	}

	removePointBlock(id) {
		let $points = $('.map--editable__point');

		$points.each(function(i, el) {
			if ($(el).attr('data-id') == id) {
				$(el).remove()
			}
		});
	}

	remPoint(id) {
		const indexToRemove = this.getPointIndex(id);
		const p = this.getPointById(id);
		const map = this;

		if (indexToRemove >= 0) {

			const toRemove = [...p.connections];

			for (let o = 0; o < toRemove.length; o++) {
				map.unlinkPoints(id, toRemove[o]);
			}

			this.points.splice(indexToRemove, 1);
		}

		this.removePointBlock(id);

		this.redraw();
	}

	drawPoint(x, y, text, color = '#ff0000') {
		super.drawPoint(x, y, color);

		if (text) {
			this.ctx.font = "12px serif";
			this.ctx.fillText(text, x, y - 12);
		}
	}

	drawGrid() {
		this.ctx.beginPath();
		this.ctx.strokeStyle = '#cccccc';

		for (let dx = GRID_OFFSET_X; dx < MAP_WIDTH; dx += GRID_STEP) {
			this.ctx.moveTo(dx, 0);
			this.ctx.lineTo(dx, MAP_HEIGHT);
		}

		for (let dy = GRID_OFFSET_Y; dy < MAP_HEIGHT; dy += GRID_STEP) {
			this.ctx.moveTo(0, dy);
			this.ctx.lineTo(MAP_WIDTH, dy);
		}

		this.ctx.stroke();
	}

	unlinkPoints(id1, id2) {
		let point1 = this.getPointById(id1);
		let point2 = this.getPointById(id2);

		let search1 = point1.connections.indexOf(point2.id);
		let search2 = point2.connections.indexOf(point1.id);

		if (search1 >= 0) {
			point1.connections.splice(search1, 1);
			this.points[this.getPointIndex(id1)].connections = point1.connections;
			point2.connections.splice(search2, 1);
			this.points[this.getPointIndex(id2)].connections = point2.connections;
		}
	}

	linkPoints(id1, id2) {
		let i1 = this.getPointIndex(id1);
		let i2 = this.getPointIndex(id2);

		this.points[i1].connections.push(id2);
		this.points[i1].connections = this.points[i1].connections.sort();
		this.points[i2].connections.push(id1);
		this.points[i2].connections = this.points[i2].connections.sort();
	}

	redraw() {
		super.redraw()
		this.drawGrid();
		const map = this;

		this.points.forEach(function(value, index, arr) {
			map.drawPoint(value.x, value.y, value.name, map.activePoints.includes(value.id)? '#0000ff' : '#ff0000');
		});
	}

	bindMoveAround() {
		const MAP = this;

		$(this.block).on('mousedown', function(ev) {
			if (ev.button == 1) {
				MAP.mouseDown = true;
				MAP.saved.self = MAP.pos;
				MAP.saved.mouse.x = ev.pageX;
				MAP.saved.mouse.y = ev.pageY;
			}
		});

		$(this.block).on('mouseup', function(ev) {
			MAP.mouseDown = false;
		});

		$(this.block).on('mousemove', function(ev) {
			let rect = MAP.block.getBoundingClientRect();

			let inBounds = (ev.pageX > rect.x && 
				ev.pageX < rect.x + rect.width &&
				ev.pageY > rect.y && 
				ev.pageY < rect.y + rect.height);

			if (!inBounds) MAP.mouseDown = false;

			if (MAP.mouseDown) {
				let newPos = {
					x: MAP.saved.self.x + ev.pageX - MAP.saved.mouse.x,
					y: MAP.saved.self.y + ev.pageY - MAP.saved.mouse.y,
				}

				let maxDelta = {
					x: - (MAP_WIDTH - rect.width),
					y: - (MAP_HEIGHT - rect.height)
				}

				if (newPos.x < maxDelta.x) newPos.x = maxDelta.x;
				if (newPos.y < maxDelta.y) newPos.y = maxDelta.y;
				if (newPos.x > 0) newPos.x = 0;
				if (newPos.y > 0) newPos.y = 0;

				MAP.setPos(newPos.x, newPos.y);
			}
		});
	}

	bind() {
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
					map.activePoints.push(checkResult[0]);

					if (map.activePoints.length == 2) {
						let id1 = map.activePoints[0];
						let id2 = map.activePoints[1];

						let p = map.getPointById(id1);
						let s = p.connections.indexOf(id2);

						if (s >= 0) {
							map.unlinkPoints(id1, id2);
						} else {
							map.linkPoints(id1, id2)
						}

						map.activePoints = [];
					}

					map.redraw();
				}
			}

			if (ev.button == 2) {
				X = Math.floor(X / GRID_STEP) * GRID_STEP + GRID_STEP / 2 + GRID_OFFSET_X;
				Y = Math.floor(Y / GRID_STEP) * GRID_STEP + GRID_STEP / 2 + GRID_OFFSET_Y;
				checkResult = map.checkCircleCollision(X, Y);

				if (checkResult.length == 0) {
					map.addNewPoint(X, Y)
				} else {
					checkResult.forEach((id) => {
						map.remPoint(id);
					});
				}
				
			}
		});
	}

	checkCircleCollision(x, y) {
		let stack = [];
		this.points.forEach(function(value, index, arr){
			if ((x - value.x)**2 + (y - value.y)**2 <= (2 * POINT_RADIUS)**2) {
				stack.push(value.id);
			}
		})
		return stack;
	}
}

function download(filename, text) {
	var pom = document.createElement('a');
	pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	pom.setAttribute('download', filename);

	if (document.createEvent) {
		var event = document.createEvent('MouseEvents');
		event.initEvent('click', true, true);
		pom.dispatchEvent(event);
	}
	else {
		pom.click();
	}
}
