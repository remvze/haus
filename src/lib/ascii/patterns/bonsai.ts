// Inspired by cbonsai (https://gitlab.com/jallbrit/cbonsai) by John Googledocs
import type { AsciiPattern } from "../types";

// --- constants ---

const LEAF_CHAR = "&";
const LEAF_LIFE_THRESHOLD = 4;
const TRUNK_FORK_CHANCE = 0.125;
const TRUNK_FORK_MIN_LIFE = 7;
const SHOOT_SPAWN_CHANCE = 0.33;
const COOLDOWN_MULTIPLIER = 2;
const TRUNK_STABILIZE_AGE = 2;
const TRUNK_STABILIZE_LIFE = 4;

const POT_WIDTH = 31;
const POT_HEIGHT = 4;
const POT_LINES = [
	":___________./~~~\\.___________:",
	" \\                           /",
	"  \\_________________________/",
	"  (_)                     (_)",
];
const POT_ACCENT_START = 12;
const POT_ACCENT_END = 18;

const BROWNING_DURATION = 8;
const FALLING_DURATION = 10;
const BARE_DURATION = 20;
const REGROWTH_DURATION = 8;

const AUTUMN_PALETTE = ["#b8860b", "#d2691e", "#cd853f", "#daa520"];
const BRIGHT_LEAF_HIGHLIGHT = "#5cd35c";

const MIN_STAGGER_DELAY = 5000;
const MAX_STAGGER_DELAY = 20000;
const EDGE_LIFE_MIN_FACTOR = 0.5;
const EDGE_LIFE_MAX_FACTOR = 0.7;

// --- config ---

export interface BonsaiConfig {
	growthSpeed: number;
	holdDuration: number;
	life: number;
	multiplier: number;
	darkWood: string;
	brightWood: string;
	darkLeaf: string;
	brightLeaf: string;
}

export const DEFAULT_BONSAI_CONFIG: BonsaiConfig = {
	growthSpeed: 33,
	holdDuration: 45,
	life: 36,
	multiplier: 5,
	darkWood: "#8b6914",
	brightWood: "#d4a017",
	darkLeaf: "#2d8a2d",
	brightLeaf: "#4abb4a",
};

// --- types ---

enum BranchType {
	trunk = 0,
	shootLeft = 1,
	shootRight = 2,
	dying = 3,
	dead = 4,
}

enum Phase {
	growing = 0,
	holding = 1,
	browning = 2,
	falling = 3,
	bare = 4,
	regrowth = 5,
}

interface Branch {
	age: number;
	dx: number;
	dy: number;
	life: number;
	shootCooldown: number;
	type: BranchType;
	x: number;
	y: number;
}

interface Cell {
	char: string;
	color: string;
	isLeaf: boolean;
}

interface PendingTree {
	delay: number;
	life: number;
	x: number;
	y: number;
}

interface LeafPosition {
	col: number;
	originalColor: string;
	row: number;
}

// --- helpers ---

const pickRandom = (chars: string): string =>
	chars[Math.floor(Math.random() * chars.length)];

const weightedPick = (options: readonly [number, number][]): number => {
	const roll = Math.floor(
		Math.random() * options.reduce((s, o) => s + o[0], 0),
	);
	let acc = 0;
	for (const [weight, value] of options) {
		acc += weight;
		if (roll < acc) return value;
	}
	return options[options.length - 1][1];
};

const shuffleArray = <T>(arr: T[]): T[] => {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
};

// --- direction weights (d10/d15 tables from cbonsai) ---

const TRUNK_YOUNG_DX: readonly [number, number][] = [
	[1, -2],
	[3, -1],
	[2, 0],
	[3, 1],
	[1, 2],
];

const TRUNK_MATURE_DY: readonly [number, number][] = [
	[7, -1],
	[3, 0],
];

const SHOOT_LEFT_DY: readonly [number, number][] = [
	[2, -1],
	[6, 0],
	[2, 1],
];

const SHOOT_LEFT_DX: readonly [number, number][] = [
	[2, -2],
	[4, -1],
	[3, 0],
	[1, 1],
];

const SHOOT_RIGHT_DY: readonly [number, number][] = [
	[2, -1],
	[6, 0],
	[2, 1],
];

const SHOOT_RIGHT_DX: readonly [number, number][] = [
	[2, 2],
	[4, 1],
	[3, 0],
	[1, -1],
];

const DYING_DY: readonly [number, number][] = [
	[2, -1],
	[7, 0],
	[1, 1],
];

const DYING_DX: readonly [number, number][] = [
	[1, -3],
	[2, -2],
	[3, -1],
	[3, 0],
	[3, 1],
	[2, 2],
	[1, 3],
];

const DEAD_DY: readonly [number, number][] = [
	[3, -1],
	[4, 0],
	[3, 1],
];

const getDeltas = (
	branch: Branch,
	multiplier: number,
): { dx: number; dy: number } => {
	switch (branch.type) {
		case BranchType.trunk: {
			if (
				branch.age <= TRUNK_STABILIZE_AGE ||
				branch.life < TRUNK_STABILIZE_LIFE
			) {
				return { dx: Math.floor(Math.random() * 3) - 1, dy: 0 };
			}
			if (branch.age < multiplier * 3) {
				const step = Math.floor(multiplier * 0.5);
				const dy = step > 0 && branch.age % step === 0 ? -1 : 0;
				const dx = weightedPick(TRUNK_YOUNG_DX);
				return { dx, dy };
			}
			const dy = weightedPick(TRUNK_MATURE_DY);
			const dx = Math.floor(Math.random() * 3) - 1;
			return { dx, dy };
		}
		case BranchType.shootLeft:
			return {
				dx: weightedPick(SHOOT_LEFT_DX),
				dy: weightedPick(SHOOT_LEFT_DY),
			};
		case BranchType.shootRight:
			return {
				dx: weightedPick(SHOOT_RIGHT_DX),
				dy: weightedPick(SHOOT_RIGHT_DY),
			};
		case BranchType.dying:
			return { dx: weightedPick(DYING_DX), dy: weightedPick(DYING_DY) };
		case BranchType.dead:
			return {
				dx: Math.floor(Math.random() * 3) - 1,
				dy: weightedPick(DEAD_DY),
			};
	}
};

const getChar = (
	type: BranchType,
	dx: number,
	dy: number,
	life: number,
	config: BonsaiConfig,
): { char: string; color: string } => {
	if (life < LEAF_LIFE_THRESHOLD || type === BranchType.dying) {
		const color =
			Math.random() < 0.9 ? config.brightLeaf : BRIGHT_LEAF_HIGHLIGHT;
		return { char: LEAF_CHAR, color };
	}

	if (type === BranchType.dead) {
		const color = Math.random() < 0.67 ? config.darkLeaf : config.brightLeaf;
		return { char: LEAF_CHAR, color };
	}

	let chars: string;
	const woodColor = Math.random() < 0.5 ? config.darkWood : config.brightWood;

	if (type === BranchType.trunk) {
		if (dy === 0) chars = "/~";
		else if (dx < 0) chars = "\\|";
		else if (dx === 0) chars = "/|\\";
		else chars = "|/";
	} else if (type === BranchType.shootLeft) {
		if (dy > 0) chars = "\\";
		else if (dy === 0) chars = "\\_";
		else if (dx < 0) chars = "\\|";
		else if (dx === 0) chars = "/|";
		else chars = "/";
	} else {
		if (dy > 0) chars = "/";
		else if (dy === 0) chars = "_/";
		else if (dx > 0) chars = "|/";
		else if (dx === 0) chars = "|\\";
		else chars = "\\";
	}

	return { char: pickRandom(chars), color: woodColor };
};

// --- pattern ---

export class BonsaiPattern implements AsciiPattern {
	private config: BonsaiConfig;
	private cols = 0;
	private rows = 0;
	private grid: (Cell | null)[][] = [];
	private queue: Branch[] = [];
	private accumulator = 0;
	private phase: Phase = Phase.growing;
	private phaseTimer = 0;
	private nextShootSide: BranchType.shootLeft | BranchType.shootRight =
		BranchType.shootLeft;
	private pendingTrees: PendingTree[] = [];
	private leafCells: LeafPosition[] = [];
	private leafOrder: number[] = [];
	private leafProgress = 0;

	constructor(config: Partial<BonsaiConfig> = {}) {
		this.config = { ...DEFAULT_BONSAI_CONFIG, ...config };
	}

	init(cols: number, rows: number): void {
		this.cols = cols;
		this.rows = rows;
		this.accumulator = 0;
		this.phase = Phase.growing;
		this.phaseTimer = 0;
		this.leafCells = [];
		this.leafOrder = [];
		this.leafProgress = 0;
		this.pendingTrees = [];
		this.seedAllTrees();
	}

	update(dt: number): void {
		const dtSec = dt / 1000;

		this.promotePendingTrees(dt);

		switch (this.phase) {
			case Phase.growing: {
				this.accumulator += dt;
				const stepInterval = 1000 / this.config.growthSpeed;

				while (this.accumulator >= stepInterval) {
					this.accumulator -= stepInterval;
					this.processStep();
				}

				if (this.queue.length === 0 && this.pendingTrees.length === 0) {
					this.collectLeafCells();
					this.phase = Phase.holding;
					this.phaseTimer = 0;
				}
				break;
			}
			case Phase.holding: {
				this.phaseTimer += dtSec;
				if (this.phaseTimer >= this.config.holdDuration) {
					this.phase = Phase.browning;
					this.phaseTimer = 0;
					this.leafProgress = 0;
				}
				break;
			}
			case Phase.browning: {
				this.phaseTimer += dtSec;
				const progress = Math.min(1, this.phaseTimer / BROWNING_DURATION);
				const targetIdx = Math.floor(progress * this.leafCells.length);

				while (
					this.leafProgress < targetIdx &&
					this.leafProgress < this.leafCells.length
				) {
					const li = this.leafOrder[this.leafProgress];
					const leaf = this.leafCells[li];
					const cell = this.grid[leaf.row]?.[leaf.col];
					if (cell && cell.isLeaf) {
						cell.color =
							AUTUMN_PALETTE[Math.floor(Math.random() * AUTUMN_PALETTE.length)];
					}
					this.leafProgress++;
				}

				if (this.phaseTimer >= BROWNING_DURATION) {
					this.phase = Phase.falling;
					this.phaseTimer = 0;
					this.leafProgress = 0;
					this.leafOrder = shuffleArray([
						...Array.from({ length: this.leafCells.length }, (_, i) => i),
					]);
				}
				break;
			}
			case Phase.falling: {
				this.phaseTimer += dtSec;
				const progress = Math.min(1, this.phaseTimer / FALLING_DURATION);
				const targetIdx = Math.floor(progress * this.leafCells.length);

				while (
					this.leafProgress < targetIdx &&
					this.leafProgress < this.leafCells.length
				) {
					const li = this.leafOrder[this.leafProgress];
					const leaf = this.leafCells[li];
					if (this.grid[leaf.row]?.[leaf.col]?.isLeaf) {
						this.grid[leaf.row][leaf.col] = null;
					}
					this.leafProgress++;
				}

				if (this.phaseTimer >= FALLING_DURATION) {
					this.phase = Phase.bare;
					this.phaseTimer = 0;
				}
				break;
			}
			case Phase.bare: {
				this.phaseTimer += dtSec;
				if (this.phaseTimer >= BARE_DURATION) {
					this.phase = Phase.regrowth;
					this.phaseTimer = 0;
					this.leafProgress = 0;
					this.leafOrder = shuffleArray([
						...Array.from({ length: this.leafCells.length }, (_, i) => i),
					]);
				}
				break;
			}
			case Phase.regrowth: {
				this.phaseTimer += dtSec;
				const progress = Math.min(1, this.phaseTimer / REGROWTH_DURATION);
				const targetIdx = Math.floor(progress * this.leafCells.length);

				while (
					this.leafProgress < targetIdx &&
					this.leafProgress < this.leafCells.length
				) {
					const li = this.leafOrder[this.leafProgress];
					const leaf = this.leafCells[li];
					if (!this.grid[leaf.row]?.[leaf.col]) {
						this.grid[leaf.row][leaf.col] = {
							char: LEAF_CHAR,
							color: leaf.originalColor,
							isLeaf: true,
						};
					}
					this.leafProgress++;
				}

				if (this.phaseTimer >= REGROWTH_DURATION) {
					this.phase = Phase.holding;
					this.phaseTimer = 0;
				}
				break;
			}
		}
	}

	render(
		ctx: CanvasRenderingContext2D,
		cols: number,
		rows: number,
		charW: number,
		charH: number,
	): void {
		for (let row = 0; row < rows; row++) {
			if (row >= this.grid.length) break;
			for (let col = 0; col < cols; col++) {
				if (col >= this.grid[row].length) break;
				const cell = this.grid[row][col];
				if (!cell) continue;

				ctx.fillStyle = cell.color;
				ctx.fillText(cell.char, col * charW, (row + 1) * charH);
			}
		}

		this.renderPot(ctx, cols, rows, charW, charH);
	}

	// --- internals ---

	private seedAllTrees(): void {
		this.grid = Array.from({ length: this.rows }, () =>
			Array.from<Cell | null>({ length: this.cols }).fill(null),
		);
		this.queue = [];
		this.nextShootSide = BranchType.shootLeft;
		this.pendingTrees = [];

		const rootY = this.rows - POT_HEIGHT - 1;
		this.queue.push({
			age: 0,
			dx: 0,
			dy: -1,
			life: this.config.life,
			shootCooldown: this.config.multiplier * COOLDOWN_MULTIPLIER,
			type: BranchType.trunk,
			x: Math.floor(this.cols / 2),
			y: rootY,
		});

		this.seedEdgeTrees();
	}

	private seedEdgeTrees(): void {
		const minSpacing = this.cols * 0.15;
		const centerX = Math.floor(this.cols / 2);
		const placed: number[] = [centerX];

		const addTree = (x: number, delay: number): void => {
			if (placed.some((px) => Math.abs(px - x) < minSpacing)) return;
			placed.push(x);
			const lifeFactor =
				EDGE_LIFE_MIN_FACTOR +
				Math.random() * (EDGE_LIFE_MAX_FACTOR - EDGE_LIFE_MIN_FACTOR);

			this.pendingTrees.push({
				delay,
				life: Math.floor(this.config.life * lifeFactor),
				x,
				y: this.rows - 1,
			});
		};

		// Guarantee one tree on the left and one on the right
		const leftX =
			Math.floor(this.cols * 0.1) +
			Math.floor(Math.random() * (this.cols * 0.15));
		const rightX =
			Math.floor(this.cols * 0.75) +
			Math.floor(Math.random() * (this.cols * 0.15));
		addTree(
			leftX,
			MIN_STAGGER_DELAY +
				Math.random() * (MAX_STAGGER_DELAY - MIN_STAGGER_DELAY),
		);
		addTree(
			rightX,
			MIN_STAGGER_DELAY +
				Math.random() * (MAX_STAGGER_DELAY - MIN_STAGGER_DELAY),
		);

		// Extra trees on wider screens
		let extras = 0;
		if (this.cols > 160) extras = 2 + Math.floor(Math.random() * 2);
		else if (this.cols > 100) extras = 1 + Math.floor(Math.random() * 2);

		for (let i = 0; i < extras; i++) {
			const x =
				Math.floor(this.cols * 0.05) +
				Math.floor(Math.random() * (this.cols * 0.9));
			const delay =
				MIN_STAGGER_DELAY +
				Math.random() * (MAX_STAGGER_DELAY - MIN_STAGGER_DELAY);
			addTree(x, delay);
		}
	}

	private promotePendingTrees(dt: number): void {
		if (this.pendingTrees.length === 0) return;

		const promoted: number[] = [];
		for (let i = 0; i < this.pendingTrees.length; i++) {
			this.pendingTrees[i].delay -= dt;
			if (this.pendingTrees[i].delay <= 0) {
				promoted.push(i);
			}
		}

		for (let i = promoted.length - 1; i >= 0; i--) {
			const tree = this.pendingTrees[promoted[i]];
			this.pendingTrees.splice(promoted[i], 1);

			this.queue.push({
				age: 0,
				dx: 0,
				dy: -1,
				life: tree.life,
				shootCooldown: this.config.multiplier * COOLDOWN_MULTIPLIER,
				type: BranchType.trunk,
				x: tree.x,
				y: tree.y,
			});
		}
	}

	private collectLeafCells(): void {
		this.leafCells = [];
		for (let row = 0; row < this.rows; row++) {
			for (let col = 0; col < this.cols; col++) {
				const cell = this.grid[row]?.[col];
				if (cell && cell.isLeaf) {
					this.leafCells.push({ row, col, originalColor: cell.color });
				}
			}
		}
		this.leafOrder = shuffleArray([
			...Array.from({ length: this.leafCells.length }, (_, i) => i),
		]);
	}

	private processStep(): void {
		if (this.queue.length === 0) return;

		const branch = this.queue.shift()!;

		const rawDeltas = getDeltas(branch, this.config.multiplier);
		let { dx, dy } = rawDeltas;

		const maxY = this.rows - 1;
		if (dy > 0 && branch.y > maxY - 2) {
			dy--;
		}

		branch.dx = dx;
		branch.dy = dy;
		branch.x += branch.dx;
		branch.y += branch.dy;
		branch.age++;
		branch.shootCooldown--;

		if (
			branch.x < 0 ||
			branch.x >= this.cols ||
			branch.y < 0 ||
			branch.y >= this.rows
		) {
			branch.life--;
			if (branch.life > 0) this.queue.push(branch);
			return;
		}

		const { char, color } = getChar(
			branch.type,
			rawDeltas.dx,
			rawDeltas.dy,
			branch.life,
			this.config,
		);
		const isLeaf =
			branch.life < LEAF_LIFE_THRESHOLD ||
			branch.type === BranchType.dying ||
			branch.type === BranchType.dead;
		const existing = this.grid[branch.y][branch.x];
		//  Don't overwrite wood cells with leaf cells — prevents branches vanishing during falling phase
		if (!isLeaf || !existing || existing.isLeaf) {
			this.grid[branch.y][branch.x] = { char, color, isLeaf };
		}

		this.handleBranching(branch);

		branch.life--;
		if (branch.life > 0) {
			this.queue.push(branch);
		}
	}

	private handleBranching(branch: Branch): void {
		const { multiplier } = this.config;

		if (branch.type === BranchType.trunk) {
			const shouldSpawnShoot =
				branch.shootCooldown <= 0 &&
				(Math.random() < SHOOT_SPAWN_CHANCE || branch.life % multiplier === 0);

			if (shouldSpawnShoot) {
				this.spawnShoot(branch);
				branch.shootCooldown = multiplier * COOLDOWN_MULTIPLIER;
			}

			if (
				branch.life > TRUNK_FORK_MIN_LIFE &&
				Math.random() < TRUNK_FORK_CHANCE
			) {
				this.queue.push({
					age: branch.age,
					dx: branch.dx,
					dy: branch.dy,
					life: branch.life,
					shootCooldown: branch.shootCooldown,
					type: BranchType.trunk,
					x: branch.x,
					y: branch.y,
				});
			}
		}

		if (
			(branch.type === BranchType.trunk ||
				branch.type === BranchType.shootLeft ||
				branch.type === BranchType.shootRight) &&
			branch.life < multiplier + 2
		) {
			this.queue.push({
				age: 0,
				dx: branch.dx,
				dy: branch.dy,
				life: branch.life,
				shootCooldown: 0,
				type: BranchType.dying,
				x: branch.x,
				y: branch.y,
			});
		}

		if (branch.type === BranchType.dying && branch.life < 3) {
			this.queue.push({
				age: 0,
				dx: branch.dx,
				dy: branch.dy,
				life: branch.life,
				shootCooldown: 0,
				type: BranchType.dead,
				x: branch.x,
				y: branch.y,
			});
		}
	}

	private spawnShoot(parent: Branch): void {
		const type = this.nextShootSide;
		this.nextShootSide =
			type === BranchType.shootLeft
				? BranchType.shootRight
				: BranchType.shootLeft;

		this.queue.push({
			age: 0,
			dx: parent.dx,
			dy: parent.dy,
			life: parent.life + this.config.multiplier,
			shootCooldown: this.config.multiplier * COOLDOWN_MULTIPLIER,
			type,
			x: parent.x,
			y: parent.y,
		});
	}

	private renderPot(
		ctx: CanvasRenderingContext2D,
		cols: number,
		rows: number,
		charW: number,
		charH: number,
	): void {
		const potX = Math.floor(cols / 2) - Math.floor(POT_WIDTH / 2);
		const potY = rows - POT_HEIGHT;

		for (let lineIdx = 0; lineIdx < POT_LINES.length; lineIdx++) {
			const line = POT_LINES[lineIdx];
			const row = potY + lineIdx;
			if (row < 0 || row >= rows) continue;

			for (let ci = 0; ci < line.length; ci++) {
				const col = potX + ci;
				if (col < 0 || col >= cols) continue;
				const ch = line[ci];
				if (ch === " ") continue;

				const isAccent =
					lineIdx === 0 && ci >= POT_ACCENT_START && ci < POT_ACCENT_END;
				ctx.fillStyle = isAccent
					? this.config.brightWood
					: this.config.darkWood;
				ctx.fillText(ch, col * charW, (row + 1) * charH);
			}
		}
	}
}
