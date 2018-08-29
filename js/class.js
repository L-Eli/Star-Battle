class Game {
    constructor() {
        this.score = 0;
        this.fuel = INIT_FUEL;
        this.time = 0;
        this.fontSize = INIT_FONT_SIZE;

        this.frames = 0;
        this.level = 1;

        this.isPaused = true;
        this.isOvered = false;
        this.isMuted = false;

        this.drawables = [];
    }

    get score() {
        return this._score;
    }

    set score(score) {
        this._score = score;

        this.updateScore();
    }

    updateScore() {
        $('#score').text(this.score);
    }

    get fuel() {
        return this._fuel;
    }

    set fuel(fuel) {
        this._fuel = Math.min(MAX_FUEL, Math.max(0, fuel));

        this.updateFuel();

        if (0 >= this._fuel) {
            this.over();
        }
    }

    updateFuel() {
        $('#fuel').text(this.fuel);
        $('.fuel-percentage').height(this.fuel * 100 / MAX_FUEL + '%');
    }

    get time() {
        return this._time;
    }

    set time(time) {
        this._time = time;

        this.updateTime();
    }

    updateTime() {
        $('#time').text(this.time + ' s');
    }

    get fontSize() {
        return this._fontSize;
    }

    set fontSize(fontSize) {
        this._fontSize = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, fontSize));

        this.updateFontSize();
    }

    updateFontSize() {
        $('*').css('font-size', this.fontSize);
        $('.font-title').css('font-size', this.fontSize + 10);
    }

    init() {
        this.initPlanets();
        this.initMainShip();
        this.initSounds();
        this.bindHandlers();
    }

    initPlanets() {
        for (let i = 1; i < 6; i++) {
            this.drawables.push(new Planet(this, `img/planet/${ i }.png`));
        }
    }

    initMainShip() {
        this.drawables.push(new MainShip(this));
    }

    initSounds() {
        this.backgroundSound = new Audio('sound/background.mp3');
        this.backgroundSound.loop = true;
        this.destroyedSound = new Audio('sound/destroyed.mp3');
        this.shootSound = new Audio('sound/shoot.mp3');
    }

    bindHandlers() {
        $('#btn_font_size_smaller').click(() => {
            this.fontSize--;
        });

        $('#btn_font_size_bigger').click(() => {
            this.fontSize++;
        });

        $('#btn_how_to_play').click(() => {
            $('.instruction-group').fadeIn();
        });

        $('#btn_mute').click(() => {
            this.isMuted ? this.playSounds() : this.pauseSounds();
        });

        $('#btn_start_game').click(() => {
            this.play();
        });

        $('#btn_play_or_pause').click(() => {
            this.isPaused ? this.play() : this.pause();
        });

        $('#name').on('input', () => {
            if ($('#name').val().trim()) {
                $('#btn_continue').removeClass('disabled');
                return;
            }
            $('#btn_continue').addClass('disabled');
        });

        $('form').submit((event) => {
            event.preventDefault();

            let name = $('#name').val().trim();
            if (!name) {
                return;
            }

            $.post($('form').attr('action'), {
                name: name,
                score: this.score,
                time: this.time,
            }).done((records) => {
                this.showRanking(records);
            });
        });

        $('#btn_restart_game').click(() => {
            location.reload();
        });

        $(document).on('keypress', (event) => {
            if (KEY_P == event.keyCode || KEY_P_LOWER == event.keyCode) {
                event.preventDefault();

                this.isPaused ? this.play() : this.pause();
            }
        });
    }

    playSounds() {
        this.isMuted = false;

        $('.sound-on-icon').fadeIn();
        $('.sound-off-icon').fadeOut();

        this.backgroundSound.volume = 1;
    }

    pauseSounds() {
        this.isMuted = true;

        $('.sound-on-icon').fadeOut();
        $('.sound-off-icon').fadeIn();

        this.backgroundSound.volume = 0;
    }

    play() {
        if (this.isOvered || !this.isPaused) {
            return;
        }
        this.isPaused = false;

        $('.start-container').fadeOut();
        $('.game-stop-cover').fadeOut();
        $('.play-icon').fadeOut();
        $('.pause-icon').fadeIn();

        this.playLoop();
        this.playInterval();
        this.playAnimations();
        this.playBackgroundSound();
    }

    pause() {
        if (this.isOvered || this.isPaused) {
            return;
        }
        this.isPaused = true;

        $('.game-stop-cover').fadeIn();
        $('.play-icon').fadeIn();
        $('.pause-icon').fadeOut();

        this.pauseLoop();
        this.pauseInterval();
        this.pauseAnimations();
        this.pauseBackgroundSound();
    }

    over() {
        this.isOvered = true;

        this.shake();
        this.playDestroyedSound();

        $('.game-over-cover').fadeIn();
        $('.end-container').fadeIn();

        this.pauseLoop();
        this.pauseInterval();
        this.pauseAnimations();
        this.pauseBackgroundSound();
    }

    showRanking(records) {
        records = JSON.parse(records);

        records.sort((a, b) => {
            if (parseInt(a.score) < parseInt(b.score)) {
                return 1;
            }

            if (parseInt(a.score) == parseInt(b.score) && parseInt(a.time) < parseInt(b.time)) {
                return 1;
            }

            return -1;
        });

        let htmlTags = [];
        $(records).each((index, record) => {
            record.position = index && record.score == records[index - 1].score && record.time == records[index - 1].time ? records[index - 1].position : index + 1;
            htmlTags.push(`
                <tr>
                    <td>${ record.position }</td>
                    <td>${ record.name }</td>
                    <td>x ${ record.score }</td>
                    <td>${ record.time } s</td>
                </tr>
            `)
        });
        $('tbody').html(htmlTags);

        $('.end-container').slideUp();
        $('.ranking-container').slideDown();
    }

    playLoop() {
        this.loop();
    }

    pauseLoop() {
        cancelAnimationFrame(this.animation);
    }

    playInterval() {
        this.interval = setInterval(() => {
            this.time++;
            this.fuel--;
            this.level = Math.ceil(this.time / 5);
            $('.spaceship').css('background-position-x', (this.time % 4) * 80);
        }, 1000);
    }

    pauseInterval() {
        clearInterval(this.interval);
    }

    playAnimations() {
        $('.game-container, .fuel-percentage, .main-ship, .asteroid, .fuel').removeClass('animation-pause');
    }

    pauseAnimations() {
        $('.game-container, .fuel-percentage, .main-ship, .asteroid, .fuel').addClass('animation-pause');
    }

    playBackgroundSound() {
        this.backgroundSound.play();
    }

    pauseBackgroundSound() {
        this.backgroundSound.pause();
    }

    playDestroyedSound() {
        if (this.isMuted) {
            return;
        }
        this.destroyedSound.cloneNode().play();
    }

    playShootSound() {
        if (this.isMuted) {
            return;
        }
        this.shootSound.cloneNode().play();
    }

    loop() {
        this.animation = requestAnimationFrame(() => {
            this.loop();
            this.moveDrawables();
            this.checkNewDrawables();
            this.detectCollisions();
            this.frames++;
        });
    }

    moveDrawables() {
        $(this.drawables).each((index, drawable) => {
            if (!drawable.tryMove()) {
                drawable.remove();
            }
        });
    }

    checkNewDrawables() {
        if (0 == this.frames % Math.floor(300 / this.level)) {
            this.drawables.push(new Friend(this));
        }

        if (0 == this.frames % Math.floor(400 / this.level)) {
            this.drawables.push(new Asteroid(this));
        }

        if (0 == this.frames % Math.floor(500 / this.level)) {
            this.drawables.push(new Fuel(this));
            this.drawables.push(new Enemy(this));
        }
    }

    detectCollisions() {
        for (let i = 0; i < this.drawables.length; i++) {
            let obj1 = this.drawables[i];
            if (!(obj1 instanceof Collidable)) {
                continue;
            }

            for (let j = i + 1; j < this.drawables.length; j++) {
                let obj2 = this.drawables[j];
                if (!(obj2 instanceof Collidable)) {
                    continue;
                }

                if (obj1.isCollide(obj2)) {
                    obj1.collide(obj2);
                    obj2.collide(obj1);
                }
            }
        }
    }

    shake() {
        $('.game-container').addClass('shake');

        setTimeout(() => {
            $('.game-container').removeClass('shake');
        }, 400);
    }

    getRand(min, max) {
        return Math.random() * (max - min) + min;
    }
}

class Drawable {
    constructor($el, game) {
        $('.game-container').append($el);

        this.$el = $el;
        this.game = game;

        this.size = {
            width: this.$el.width(),
            height: this.$el.height(),
        };

        this.position = {
            left: this.$el.position().left,
            top: this.$el.position().top,
        };

        this.speed = {
            horizontal: 0,
            vertical: 0,
        };
    }

    setSpeed(horizontal, vertical) {
        this.speed.horizontal = horizontal;
        this.speed.vertical = vertical;
    }

    tryMove() {
        this.position.left += this.speed.horizontal * this.game.level;
        this.position.top += this.speed.vertical * this.game.level;

        this.$el.css(this.position);

        return 0 < this.position.left + this.size.width && GAME_WIDTH > this.position.left && 0 < this.position.top + this.size.height && GAME_HEIGHT > this.position.top;
    }

    remove() {
        let index = this.game.drawables.indexOf(this);
        if (index > -1) {
            this.$el.remove();
        }
        this.game.drawables.splice(index, 1);
    }
}

class Collidable extends Drawable {
    isCollide(obj) {
        return Math.abs((this.position.left + this.size.width / 2) - (obj.position.left + obj.size.width / 2)) < (this.size.width + obj.size.width) / 2 && Math.abs((this.position.top + this.size.height / 2) - (obj.position.top + obj.size.height / 2)) < (this.size.height + obj.size.height) / 2;
    }

    collide(obj) {
        //
    }
}

class Planet extends Drawable {
    constructor(game, src) {
        let $el = $(`
            <img class="absolute planet" src="${ src }" alt="">
        `);

        super($el, game);

        this.randomPosition();
    }

    tryMove() {
        if (0 > this.position.left + this.size.width) {
            this.randomPosition();
            this.position.left = GAME_WIDTH;
        }

        this.position.left += this.speed.horizontal;

        this.$el.css(this.position);

        return true;
    }

    randomPosition() {
        this.size.width = this.game.getRand(MIN_PLANET_WIDTH, MAX_PLANET_HEIGHT);

        this.setSpeed(-((this.size.width - MIN_PLANET_WIDTH) / (MAX_PLANET_HEIGHT - MIN_PLANET_WIDTH) + 0.5), 0);

        this.position = {
            left: this.game.getRand(0, GAME_WIDTH - this.size.width),
            top: this.game.getRand(0, GAME_HEIGHT - this.size.width),
        };

        this.$el.css('width', this.size.width).css(this.position);
    }
}

class MainShip extends Collidable {
    constructor(game) {
        let $el = $(`
            <div class="absolute main-ship animation-pause">
        `);

        super($el, game);

        this.position = {
            left: this.size.width / 2,
            top: (GAME_HEIGHT - this.size.height) / 2,
        };

        this.tryMove();
        this.bindHandlers();
    }

    tryMove() {
        this.position.left = Math.min(GAME_WIDTH - this.size.width, Math.max(0, this.position.left + this.speed.horizontal * this.game.level));
        this.position.top = Math.min(GAME_HEIGHT - this.size.height, Math.max(0, this.position.top + this.speed.vertical * this.game.level));

        this.$el.css(this.position).css('transform', `rotate(${ this.speed.vertical * 5 }deg)`);

        return true;
    }

    bindHandlers() {
        $('.sensible-area').mousemove((event) => {
            let size = {
                width: $('.sensible-area').width(),
                height: $('.sensible-area').height(),
            };

            let radius = size.width / 2;

            let offset = {
                left: event.pageX - $('.sensible-area').offset().left,
                top: event.pageY - $('.sensible-area').offset().top,
            };

            let distance = {
                x: offset.left - size.width / 2,
                y: offset.top - size.height / 2,
            };

            if (radius < Math.sqrt(Math.pow(distance.x, 2) + Math.pow(distance.y, 2))) {
                this.setSpeed(0, 0);
                return;
            }

            let speed = {
                horizontal: distance.x / 20,
                vertical: distance.y / 20,
            };

            this.setSpeed(speed.horizontal, speed.vertical);
            $('.move-point').css(offset);
        }).mouseleave(() => {
            this.setSpeed(0, 0);
        });

        $('#btn_fire').click(() => {
            this.shoot();
        });

        $(document).on('keydown', (event) => {
            if (this.game.isOvered || this.game.isPaused) {
                return;
            }

            if (KEY_SPACE == event.keyCode) {
                event.preventDefault();

                if (this.isPressedSpace) {
                    return;
                }

                this.isPressedSpace = true;
                this.shoot();
            }
        }).on('keyup', (event) => {
            if (this.isOvered || this.isPaused) {
                return;
            }

            if (KEY_SPACE == event.keyCode) {
                event.preventDefault();

                this.isPressedSpace = false;
            }
        });
    }

    shoot() {
        this.game.playShootSound();
        this.game.drawables.push(new Bullet(this.game, this));
    }
}

class Bullet extends Collidable {
    constructor(game, shootBy) {
        let $el = $(`
            <div class="absolute bullet ${ shootBy instanceof MainShip ? 'defense' : 'attack' }"></div>
        `);

        let position = {
            left: shootBy instanceof MainShip ? shootBy.position.left + shootBy.size.width : shootBy.position.left - 20,
            top: shootBy.position.top + shootBy.size.height / 2,
        };

        $el.css(position);

        super($el, game);

        this.shootBy = shootBy;
        this.setSpeed(this.shootBy instanceof MainShip ? 10 : -5, 0);
    }

    collide(obj) {
        if (obj instanceof MainShip && this.shootBy instanceof Enemy) {
            this.remove();

            this.game.shake();
            this.game.playDestroyedSound();
            this.game.fuel -= 15;

            return;
        }

        if ((obj instanceof Friend || obj instanceof Enemy || obj instanceof Asteroid) && this.shootBy instanceof MainShip) {
            this.remove();

            return;
        }
    }
}

class Friend extends Collidable {
    constructor(game) {
        let $el = $(`
            <div class="absolute spaceship friend"></div>
        `);

        let position = {
            left: GAME_WIDTH,
            top: game.getRand(0, GAME_HEIGHT - 80),
        };

        $el.css(position);

        super($el, game);

        this.setSpeed(-1, 0);
    }

    collide(obj) {
        if (obj instanceof MainShip) {
            this.remove();

            this.game.shake();
            this.game.playDestroyedSound();
            this.game.fuel -= 15;

            return;
        }

        if (obj instanceof Bullet && obj.shootBy instanceof MainShip) {
            this.remove();

            this.game.drawables.push(new Explosion(this.game, this))
            this.game.score -= 10;

            return;
        }
    }
}

class Enemy extends Collidable {
    constructor(game) {
        let $el = $(`
            <div class="absolute spaceship enemy"></div>
        `);

        let position = {
            left: GAME_WIDTH,
            top: game.getRand(0, GAME_HEIGHT - 80),
        };

        $el.css(position);

        super($el, game);

        this.setSpeed(-1.5, 0);
    }

    tryMove() {
        if (0 == this.game.frames % Math.floor(100 / this.game.level)) {
            this.shoot();
        }

        return super.tryMove();
    }

    collide(obj) {
        if (obj instanceof MainShip) {
            this.remove();

            this.game.shake();
            this.game.playDestroyedSound();
            this.game.fuel -= 15;

            return;
        }

        if (obj instanceof Bullet && obj.shootBy instanceof MainShip) {
            this.remove();

            this.game.drawables.push(new Explosion(this.game, this))
            this.game.score += 5;

            return;
        }
    }

    shoot() {
        this.game.drawables.push(new Bullet(this.game, this));
    }
}

class Asteroid extends Collidable {
    constructor(game) {
        let $el = $(`
            <div class="absolute asteroid"></div>
        `);

        let position = {
            left: GAME_WIDTH,
            top: game.getRand(0, GAME_HEIGHT - 60),
        };

        $el.css(position);

        super($el, game);

        this.setSpeed(-1.25, 0);
    }

    collide(obj) {
        if (obj instanceof MainShip) {
            this.remove();

            this.game.shake();
            this.game.playDestroyedSound();
            this.game.fuel -= 15;

            return;
        }

        if (obj instanceof Bullet && obj.shootBy instanceof MainShip) {
            if (this.isDestroyed) {
                this.remove();
    
                this.game.drawables.push(new Explosion(this.game, this))
                this.game.score += 10;
    
                return;
            }

            this.isDestroyed = true;
            this.$el.addClass('destroyed');
        }
    }
}

class Fuel extends Collidable {
    constructor(game) {
        let $el = $(`
            <div class="absolute fuel"></div>
        `);

        let position = {
            left: game.getRand(0, GAME_WIDTH - 50),
            top: 0,
        };

        $el.css(position);

        super($el, game);

        this.setSpeed(0, 1);
    }

    collide(obj) {
        if (obj instanceof MainShip) {
            this.remove();

            this.game.fuel += 15;

            return;
        }
    }
}

class Explosion extends Drawable {
    constructor(game, explodeBy) {
        let $el = $(`
            <div class="absolute explosion">
        `);

        let position = {
            left: explodeBy.position.left,
            top: explodeBy.position.top,
        };

        $el.css(position);

        super($el, game);

        setTimeout(() => {
            this.remove();
        }, 200);
    }
}
