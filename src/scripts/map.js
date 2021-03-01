export const MAP_WIDTH = 2000;
export const MAP_HEIGHT = 2000;
const SRC_COUNT = 4;
var scrLoaded = 0;

export class MapScroll {
	constructor () {
		this.block = $('.map__wrapper')[0];
		this.ui = $('.map__ui')[0];
		this.floorsImages = [];
		this.currentFloor = 1;
		this.pos = {x: 0, y: 0};
		this.mouseDown = false;
		this.saved = {
			self: {x: 0, y: 0},
			mouse: {x: 0, y: 0},
		}

		this.floorsImages.push(createImage('/src/images/floors/floor_1.svg', this, onLoad));
		this.floorsImages.push(createImage('/src/images/floors/floor_2.svg', this, onLoad));
		this.floorsImages.push(createImage('/src/images/floors/floor_3.svg', this, onLoad));
		this.floorsImages.push(createImage('/src/images/floors/floor_4.svg', this, onLoad));
	}

	init() {
		this.ctx = this.ui.getContext('2d');
		this.ctx.drawImage(this.floorsImages[this.currentFloor - 1], 0, 0);
		this.bind();
		this.redraw();
	}

	bindMoveAround() {
		const MAP = this;

		$(this.block).on('mousedown', function(ev) {
			if (ev.button == 0) {
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
	}

	setPos(x, y) {
		$(this.ui).css('left', `${x}px`);
		$(this.ui).css('top', `${y}px`);
		
		this.pos = {
			x: x,
			y: y
		};
	}
	redraw() {
		this.ctx.beginPath();
		this.ctx.fillStyle = '#ffffff';
		this.ctx.rect(0, 0, MAP_WIDTH, MAP_HEIGHT);
		this.ctx.fill();
		this.ctx.drawImage(this.floorsImages[this.currentFloor - 1], 0, 0);
	}
}

function createImage(path, map, cb) {
	let img = new Image();

	img.onload = function(ev) {
		cb(map);
	}

	img.src = path;

	return img;
}

function onLoad (map) {
	if (++scrLoaded === SRC_COUNT) map.init();
}
