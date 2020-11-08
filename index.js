const { World, Engine, Runner, Render, Bodies, Body, Events } = Matter;

const cellsHorizontal = 20;
const cellsVertical = 8;
const width = window.innerWidth;
const height = window.innerHeight;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
	element: document.body,
	engine: engine,
	options: {
		wireframes: false,
		width,
		height,
	},
});

Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
const walls = [
	Bodies.rectangle(width / 2, 0, width, 4, { isStatic: true }),
	Bodies.rectangle(width / 2, height, width, 4, { isStatic: true }),
	Bodies.rectangle(0, height / 2, 4, height, { isStatic: true }),
	Bodies.rectangle(width, height / 2, 4, height, { isStatic: true }),
];

World.add(world, walls);

const startGame = () => {
	// Maze Generration

	const shuffle = (arr) => {
		let counter = arr.length;

		while (counter > 0) {
			const index = Math.floor(Math.random() * counter);

			counter--;

			const temp = arr[counter];

			arr[counter] = arr[index];

			arr[index] = temp;
		}

		return arr;
	};

	const grid = Array(cellsVertical)
		.fill(null)
		.map(() => Array(cellsHorizontal).fill(false));

	const verticals = Array(cellsVertical)
		.fill(null)
		.map(() => Array(cellsHorizontal - 1).fill(false));

	const horizontals = Array(cellsHorizontal - 1)
		.fill(null)
		.map(() => Array(cellsHorizontal).fill(false));

	const startRow = Math.floor(Math.random() * cellsVertical);
	const startColumns = Math.floor(Math.random() * cellsHorizontal);

	const stepThroughCell = (row, column) => {
		// if I have visited the cell at [row, column] the return;
		if (grid[row][column]) return;

		// mark this cell as being visited
		grid[row][column] = true;

		// assemble randomly ordered list of neighbors
		const neighbors = shuffle([
			[row - 1, column, 'up'],
			[row, column + 1, 'right'],
			[row + 1, column, 'down'],
			[row, column - 1, 'left'],
		]);

		// for each neighbor ......
		for (let neighbor of neighbors) {
			const [nextRow, nextColumn, direction] = neighbor;

			// see if the neighbor is out of bounds
			if (
				nextRow < 0 ||
				nextRow >= cellsVertical ||
				nextColumn < 0 ||
				nextColumn >= cellsHorizontal
			) {
				continue;
			}

			// if we have visited the neighbor, continue to next neighbor
			if (grid[nextRow][nextColumn]) continue;

			// remove a wall from either horizontals or verticals
			if (direction === 'left') {
				verticals[row][column - 1] = true;
			} else if (direction === 'right') {
				verticals[row][column] = true;
			} else if (direction === 'up') {
				horizontals[row - 1][column] = true;
			} else if (direction === 'down') {
				horizontals[row][column] = true;
			}

			// visit that next cell
			stepThroughCell(nextRow, nextColumn);
		}
	};

	stepThroughCell(startRow, startColumns);

	horizontals.forEach((row, rowIndex) => {
		row.forEach((open, columnIndex) => {
			if (open) return;

			const wall = Bodies.rectangle(
				columnIndex * unitLengthX + unitLengthX / 2,
				rowIndex * unitLengthY + unitLengthY,
				unitLengthX,
				2,
				{
					label: 'wall',
					isStatic: true,
					render: {
						fillStyle: 'red',
					},
				}
			);

			World.add(world, wall);
		});
	});

	verticals.forEach((row, rowIndex) => {
		row.forEach((open, columnIndex) => {
			if (open) return;

			const wall = Bodies.rectangle(
				columnIndex * unitLengthX + unitLengthX,
				rowIndex * unitLengthY + unitLengthY / 2,
				2,
				unitLengthY,
				{
					label: 'wall',
					isStatic: true,
					render: {
						fillStyle: 'yellow',
					},
				}
			);

			World.add(world, wall);
		});
	});

	// GOAL
	const goal = Bodies.rectangle(
		width - unitLengthX / 2,
		height - unitLengthY / 2,
		unitLengthX * 0.7,
		unitLengthY * 0.7,
		{
			isStatic: true,
			label: 'goal',
			render: {
				fillStyle: 'green',
			},
		}
	);

	World.add(world, goal);

	// BALL
	const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
	const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
		label: 'ball',
		render: {
			fillStyle: 'blue',
		},
	});

	World.add(world, ball);

	document.addEventListener('keydown', (e) => {
		const { x, y } = ball.velocity;

		if (e.key === 'w' || e.key === 'ArrowUp') {
			Body.setVelocity(ball, { x, y: y - 3 });
		}

		if (e.key === 'd' || e.key === 'ArrowRight') {
			Body.setVelocity(ball, { x: x + 3, y });
		}

		if (e.key === 'a' || e.key === 'ArrowLeft') {
			Body.setVelocity(ball, { x: x - 3, y });
		}

		if (e.key === 's' || e.key === 'ArrowDown') {
			Body.setVelocity(ball, { x, y: y + 3 });
		}
	});

	// Win Condition
	Events.on(engine, 'collisionStart', (e) => {
		e.pairs.forEach((collision) => {
			const labels = ['ball', 'goal'];

			if (
				labels.includes(collision.bodyA.label) &&
				labels.includes(collision.bodyB.label)
			) {
				document.querySelector('.winner').classList.remove('hidden');
				world.gravity.y = 1;
				world.bodies.forEach((body) => {
					if (body.label === 'wall') {
						Body.setStatic(body, false);
					}
				});
			}
		});
	});
};

window.addEventListener('load', startGame);
document.querySelector('.restart').addEventListener('click', () => {
	window.location.reload();
});
