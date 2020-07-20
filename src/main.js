import Game from './Game.js'
import { loadImage, loadJSON } from './Loader.js'
import Sprite from './Sprite.js'
import Cinematic from './Cinematic.js'
import { haveCollision, getRandomFrom } from './Additional.js'
import DisplayObject from './DisplayObject.js'

const scale = 2
const directions = ['left', 'right', 'up', 'down']

export	default async function main() {
	const game = new Game({
		width: 672,
		height: 744,
		background: 'black'
	})

	document.body.append(game.canvas)

	const image = await loadImage('/sets/spritesheet.png')
	const atlas = await loadJSON('/sets/atlas.json')

	const maze = new Sprite({
		image,
		x: 0,
		y: 0,
		width: atlas.maze.width * scale,
		height: atlas.maze.height * scale,
		frame: atlas.maze,
		// debug: true
	})
	game.canvas.width = maze.width
	game.canvas.height = maze.height

	let foods = atlas.maze.foods
		.map(food => ({
			...food,
			x: food.x * scale,
			y: food.y * scale,
			width: food.width * scale,
			height: food.height * scale
		}))
		.map(food => new Sprite({
			image,
			frame: atlas.food,
			...food
		}))

	const pacman = new Cinematic({
		image,
		x: atlas.position.pacman.x * scale,
		y: atlas.position.pacman.y * scale,
		width: 13 * scale,
		height: 13 * scale,
		animations: atlas.pacman,
		// debug: true,
		// speedx: 1
	})
	pacman.start('right') 

	const ghosts = ['red', 'pink', 'turquoise', 'banana']
		.map(color => {
			const ghost = new Cinematic({
				image,
				x: atlas.position[color].x * scale,
				y: atlas.position[color].y * scale,
				width: 13 * scale,
				height: 13 * scale,
				animations: atlas[`${color}Ghost`],
				// debug: true
			})
			ghost.start(atlas.position[color].direction)
			ghost.nextDirection = atlas.position[color].direction
			ghost.isBlue = false

			return ghost
		})

	const walls = atlas.maze.walls.map(wall => new DisplayObject({
		x: wall.x * scale,
		y: wall.y * scale,
		width: wall.width * scale,
		height: wall.height * scale,
		// debug: true
	}))


	const leftPortal = new DisplayObject ({
		x: atlas.position.leftPortal.x * scale,
		y: atlas.position.leftPortal.y * scale,

		width: atlas.position.leftPortal.width * scale,
		height: atlas.position.leftPortal.height * scale,
		// debug: true
	})
	const rightPortal = new DisplayObject ({
		x: atlas.position.rightPortal.x * scale,
		y: atlas.position.rightPortal.y * scale,

		width: atlas.position.rightPortal.width * scale,
		height: atlas.position.rightPortal.height * scale,
		// debug: true
	})

	const tablets = atlas.position.tablets
		.map(tablet => new Sprite({
			image,
			frame: atlas.tablet,
			x: tablet.x * scale,
			y: tablet.y * scale,
			width: tablet.width * scale,
			height: tablet.height * scale
		}))

	game.stage.add(maze)
	foods.forEach(food => game.stage.add(food))
	game.stage.add(pacman)
	ghosts.forEach(ghost => game.stage.add(ghost))
	walls.forEach(wall => game.stage.add(wall))
	game.stage.add(leftPortal)
	game.stage.add(rightPortal)
	tablets.forEach(table => game.stage.add(table))
	

	game.update = () => {
		// проверка съели ли еду
		const eated = []
		for (const food of foods) {
			if (haveCollision(pacman, food)) {
				eated.push(food)
				game.stage.remove(food)
			}
		}
		foods = foods.filter(food => !eated.includes(food))

		// смена направления

		changeDirection(pacman)
		ghosts.forEach(changeDirection)
		
		// проверка столкновения со стеной призраков
		for (const ghost of ghosts ) {
			if (!ghost.play) {
				return
			}
			const wall = getWallCollision(ghost.getNextPosition())
			if (wall) {
				ghost.speedx = 0
				ghost.speedy = 0
			}
			if (ghost.speedx === 0 && ghost.speedy === 0) {
				// изменение направления приведений при столкновении со стеной 
				ghost.nextDirection = getRandomFrom(...directions.filter(x => x !== ghost.animation.name))
				ghost.animation.name = ghost.nextDirection
			}
			// проверка столкновения pacman vs ghost
			if ( pacman.play && ghost.play && haveCollision(pacman, ghost) ) {
				if (ghost.isBlue) {
					ghost.play = false
					ghost.speedx = 0
					ghost.speedy = 0
					game.stage.remove(ghost)
				}
				else {
					pacman.speedx = 0
					pacman.speedy = 0
					pacman.start('die', {
						onEnd () {
							pacman.play = false
							pacman.stop()
							game.stage.remove(pacman)
						}
					})
				}
				
			}
		}

		// проверка столкновения со стеной pacman
		const wall = getWallCollision(pacman.getNextPosition())
		if (wall) {
			pacman.start(`wait${pacman.animation.name}`)
			pacman.speedx = 0
			pacman.speedy = 0
		}

		if(haveCollision(pacman, leftPortal)) {
			pacman.x = atlas.position.rightPortal.x * scale - pacman.width - 1
		}

		if(haveCollision(pacman, rightPortal)) {
			pacman.x = atlas.position.leftPortal.x * scale + pacman.width + 1
		}

		for (let i = 0; i < tablets.length; i++) {
			console.log('test');

			const tablet = tablets[i]

			if (haveCollision(pacman, tablet)) {
				tablets.splice(i, 1)
				game.stage.remove(tablet)

				ghosts.forEach(ghost => {
					ghost.originalAnimation = ghost.animations
					ghost.animations = atlas.blueGhost
					ghost.isBlue = true
					ghost.start(ghost.animation.name)
				})

				setTimeout(() => {
					ghosts.forEach(ghost => {
						ghost.animations = ghost.originalAnimation
						ghost.isBlue = false
						ghost.start(ghost.animation.name)
					})
				}, 5000)
				ghosts.forEach(changeDirection)
				break
			}

		}

	}

	document.addEventListener('keydown', event => {
		if (pacman.play) {
			if (event.key === 'ArrowLeft') {
				pacman.nextDirection = 'left'
				pacman.start('left') 

			}
			else if (event.key === 'ArrowRight') {
				pacman.nextDirection = 'right'
				pacman.start('right') 	

			}
			else if (event.key === 'ArrowUp') {
				pacman.nextDirection = 'up'
				pacman.start('up') 

			}
			else if (event.key === 'ArrowDown') {
				pacman.nextDirection = 'down'
				pacman.start('down') 

			}
		}
	})

	function getWallCollision (obj) {
		for (const wall of walls) {
			if (haveCollision(wall, obj)) {
				return wall
			}
		}

		return null
	}

	function changeDirection ( sprite ) {
		if (!sprite.nextDirection) {
			return
		}
		if (sprite.nextDirection === 'up') {
			sprite.y -= 10
			if (!getWallCollision(sprite)) {
				sprite.nextDirection = null
				sprite.speedx = 0
				sprite.speedy = -1
				sprite.start('up')
			}
			sprite.y += 10
		}
		else if (sprite.nextDirection === 'down') {
			sprite.y += 10
			if (!getWallCollision(sprite)) {
				sprite.nextDirection = null
				sprite.speedx = 0
				sprite.speedy = 1
				sprite.start('down')
			}
			sprite.y -= 10
		}
		else if (sprite.nextDirection === 'left') {
			sprite.x -= 10
			if (!getWallCollision(sprite)) {
				sprite.nextDirection = null
				sprite.speedx = -1
				sprite.speedy = 0
				sprite.start('left')
			}
			sprite.x += 10
		}
		else if (sprite.nextDirection === 'right') {
			sprite.x += 10
			if (!getWallCollision(sprite)) {
				sprite.nextDirection = null
				sprite.speedx = 1
				sprite.speedy = 0
				sprite.start('right')
			}
			sprite.x -= 10
		}
	}
}