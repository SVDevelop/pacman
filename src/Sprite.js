import DisplayObject from '/DisplayObject.js'

export default class Sprite extends DisplayObject {
	play = true

	constructor ( props = {}) {
		super(props)

		this.image = props.image ?? null
		this.frame = props.frame ?? null

		this.speedx = props.speedx ?? 0
		this.speedy = props.speedy ?? 0
		this.nextDirection = null
	}

	getNextPosition () {
		return {
			x: this.x + this.speedx,
			y: this.y + this.speedy,
			width: this.width,
			height: this.height
		}
	}

	update () {
		this.x += this.speedx
		this.y += this.speedy
	}

	draw (context) {
		if (this.frame) {
			context.drawImage(
				this.image,
	
				this.frame.x,
				this.frame.y,
				this.frame.width,
				this.frame.height,
	
				this.x,
				this.y,
				this.width,
				this.height
			)
			super.draw(context)
		}
	}	
	
}