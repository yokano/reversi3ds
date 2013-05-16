/**
 * カーソルクラス
 * @class
 * @property {number} x X座標
 * @property {number} y Y座標
 * @property {object} div カーソルが置いてあるマスのjQueryObject
 */
var Cursor = function() {
	this.x = 3;
	this.y = 3;
	this.div = $('#cursor');
	this.update();
};

/**
 * カーソルの表示位置をアップデートする
 * @method
 */
Cursor.prototype.update = function() {
	this.div.css('left', board.cells[this.x][this.y].div.position().left);
	this.div.css('top', board.cells[this.x][this.y].div.position().top);
}

/**
 * カーソルを指定した座標分だけ動かす
 * @method
 * @param {number} x X座標
 * @param {number} y Y座標
 */
Cursor.prototype.moveBy = function(x, y) {
	this.div.removeClass('cursor');
	this.x += x;
	this.y += y;
	if(this.x < 0) {
		this.x = 7;
	} else if (7 < this.x) {
		this.x = 0;
	}
	if(this.y < 0) {
		this.y = 7;
	} else if (7 < this.y) {
		this.y = 0;
	}
	this.update();
};

/**
 * カーソルを指定した座標へ動かす
 * @method
 * @param {number} x X座標
 * @param {number} y Y座標
 */
Cursor.prototype.moveTo = function(x, y) {
	if(x < 0 || board.width < x || y < 0 || board.height < this.height) {
		console.log('不正な座標が指定されました');
		return false;
	}
	this.x = x;
	this.y = y;
	this.update();
};

/**
 * ゲームボードクラス
 * @class
 * @property {array} マス目。this.cells[X][Y]で Cell オブジェクトを参照できる。
 * @property {number} width 横のマス目の数
 * @property {number} height 縦のマス目の数
 */
var Board = function() {
	this.width = 8;
	this.height = 8;
	this.cells = [];
	var divs = $('#board>div');
	for(var x = 0; x < this.width; x++) {
		this.cells[x] = [];
		for(var y = 0; y < this.height; y++) {
			this.cells[x][y] = new Cell(x, y, divs[x + y * this.height]);
		}
	}
	this.cells[3][3].changeState('white');
	this.cells[4][3].changeState('black');
	this.cells[3][4].changeState('black');
	this.cells[4][4].changeState('white');
};

/**
 * 指定されたコマの色を数える
 * @method
 * @param {string} 
 */
Board.prototype.count = function(color) {
	var result = 0;
	for(var i = 0; i < this.width; i++) {
		for(var j = 0; j < this.height; j++) {
			if(this.cells[i][j].state == color) {
				result++;
			}
		}
	}
	return result;
};

/**
 * 指定されたマス目に駒が置けるかチェック
 * @method
 * @param {number} x X座標
 * @param {number} y Y座標
 * @param {string} color 駒の色
 * @returns {bool} おけるならtrue,おけないならfalse
 */
Board.prototype.canSetAt = function(x, y, color) {
	if(this.cells[x][y].state != 'empty') {
		return false;
	}
	
	for(var i = -1; i < 2; i++) {
		for(var j = -1; j < 2; j++) {
			if(i + x < 0 || this.width <= i + x || j + y < 0 || this.height <= j + y) {
				continue;
			}
			
			var isSameColor = (this.cells[i + x][j + y].state == color);
			var isEmpty = (this.cells[i + x][j + y].state == 'empty');
			var isMe = (i == 0 && j == 0);
			if(isMe || isSameColor || isEmpty) {
				continue;
			}
			
			if(this.existSameColor(x, y, i, j, color)) {
				return true;
			}
		}
	}
	return false;
};

/**
 * 駒をおけるマスが１つでもあるかチェック
 * @method
 * @param {string} color
 */
Board.prototype.canSet = function(color) {
	for(var i = 0; i < this.width; i++) {
		for(var j = 0; j < this.height; j++) {
			if(this.canSetAt(i, j, color)) {
				return true;
			}
		}
	}
	return false;
};

/**
 * 駒をマス目に置く
 * @method
 * @param {number} x X座標
 * @param {number} y Y座標
 * @param {string} color コマの色(black/white)
 */
Board.prototype.setPiece = function(x, y, color) {
	if(x < 0 || this.width < x || y < 0 || this.height < y) {
		console.log('不正なマス目へ駒を置こうとしました');
		return false;
	}
	
	this.cells[x][y].changeState(color);
	
	// 裏返しチェック
	var reverseTargets = [];
	for(var i = -1; i < 2; i++) {
		for(var j = -1; j < 2; j++) {
			if(i + x < 0 || this.width <= i + x || j + y < 0 || this.height <= j + y) {
				continue;
			}
			
			var isSameColor = (this.cells[i + x][j + y].state == color);
			var isEmpty = (this.cells[i + x][j + y].state == 'empty');
			if(isSameColor || isEmpty) {
				continue;
			}
			
			if(this.existSameColor(x, y, i, j, color)) {
				reverseTargets.push({
					x: x,
					y: y,
					dx: i,
					dy: j
				});
			}
		}
	}
	
	// １個づつ裏返して最後にプレイヤー交代
	var that = this;
	var f = function(i) {
		if(i < reverseTargets.length) {
			var t = reverseTargets[i];
			that.reverse(t.x, t.y, t.dx, t.dy, color, function() {
				f(++i);
			});
		} else {
			// 全部裏返し終わったら
			game.updateCount();
			if(board.count('black') == 0 || board.count('white') == 0 || board.isFilled()) {
				game.finish();
			} else {
				game.changePlayer();
			}
		}
	};
	f(0);
}

/**
 * 直線上に自分と同じ色が出現するか調べる
 * @method
 * @param {number} x 開始地点のX座標
 * @param {number} y 開始地点のY座標
 * @param {number} dx X方向
 * @param {number} dx Y方向
 * @returns {bool} 出現したらtrue、それ以外はfalse
 */
Board.prototype.existSameColor = function(x, y, dx, dy, color) {
	if(x + dx < 0 || this.width <= x + dx || y + dy < 0 || this.height <= y + dy) {
		return false;
	}
	
	if(this.cells[x + dx][y + dy].state == 'empty') {
		return false;
	} else if(this.cells[x + dx][y + dy].state == color) {
		return true;
	} else {
		return this.existSameColor(x + dx, y + dy, dx, dy, color);
	}
};

/**
 * 指定された座標から同じ色が現れるまで裏返す
 * existSameColor() で同じ色が現れることを保証してから使うこと
 * @method
 * @param {number} x 開始地点のX座標
 * @param {number} y 開始地点のY座標
 * @param {number} dx X方向
 * @param {number} dy Y方向
 * @param {function} callback 裏返し完了時の処理
 */
Board.prototype.reverse = function(x, y, dx, dy, color, callback) {
	var target = [];
	while(this.cells[x + dx][y + dy].state != color) {
		target.push(this.cells[x + dx][y + dy]);
		x = x + dx;
		y = y + dy;
	}
	
	var f = function(i) {
		target[i].reverse(function() {
			i++;
			if(i < target.length) {
				f(i);
			} else {
				callback();
			}
		});
	};
	f(0);
};

/**
 * 盤上がすべて埋まったかどうか
 * @method
 * @returns {bool} 埋まっていたらtrue,それ以外はfalse
 */
Board.prototype.isFilled = function() {
	for(var i = 0; i < this.width; i++) {
		for(var j = 0; j < this.height; j++) {
			if(this.cells[i][j].state == 'empty') {
				return false;
			}
		}
	}
	return true;
};

/**
 * ボードを初期化する
 * @method
 */
Board.prototype.reset = function() {
	for(var i = 0; i < this.width; i++) {
		for(var j = 0; j < this.height; j++) {
			this.cells[i][j].changeState('empty');
		}
	}
	this.cells[3][3].changeState('white');
	this.cells[4][3].changeState('black');
	this.cells[3][4].changeState('black');
	this.cells[4][4].changeState('white');
};

/**
 * マス目クラス
 * @class
 * @param {number} x X座標
 * @param {number} y Y座標
 * @param {object} DOMオブジェクト
 * @param {string} 初期配置するコマの色。省略したら空のマスになる。
 * @property {object} div jQueryObject
 * @property {string} state 'empty','white','black' のいずれか
 */
var Cell = function( x, y, div, color) {
	this.div = $(div);
	this.x = x;
	this.y = y;
	if(color == undefined) {
		this.state = 'empty';
	} else {
		this.state = color;
		this.div.addClass(color);
	}
	
	var that = this;
	this.div.on('click', function() {
		cursor.moveTo(x, y);
		game.buttonA();
	});
};

/**
 * マス目の状態を変える
 * @method
 * @param {string} color white/black/empty
 */
Cell.prototype.changeState = function(color) {
	this.state = color;
	this.div.css('background-position', '');
	this.div.removeClass('white');
	this.div.removeClass('black');
	this.div.removeClass('empty');
	this.div.addClass(color);
}

/**
 * マス目の駒をひっくり返す
 * アニメーション付き
 * @method
 */
Cell.prototype.reverse = function(callback) {
	if(this.state == 'black') {
		this.animate(callback);
		this.state = 'white'
	} else if(this.state == 'white') {
		this.animate(callback);
		this.state = 'black'
	} else {
		console.log('コマが置かれていないマス目をひっくり返そうとしています');
		return false;
	}
}

/**
 * ひっくり返すアニメーションを実行
 * @method
 */
Cell.prototype.animate = function(callback) {
	var frame;
	var direction;
	var frameNum = 7;
	var count = 0;
	
	if(this.state == 'black') {
		frame = frameNum - 1;
		direction = -1;
	} else if(this.state == 'white') {
		frame = 0;
		direction = 1;
	}
	
	var that = this;
	var next = function() {
		frame += direction;
		count++;
		if(count < frameNum) {
			that.div.css('background-position', '-' + (frame * 25) + 'px');
			setTimeout(next, 10);
		} else {
			game.busy = false;
			if(callback != undefined) {
				callback();
			}
		}
	};
	setTimeout(next, 10);
	game.busy = true;
}

/**
 * プレイヤークラス
 * @class
 */
var Player = function(color) {
	this.color = color;
};

/**
 * ゲーム管理クラス
 * @class
 * @property {Player} player1 黒のプレイヤー
 * @property {Player} player2 白のプレイヤー
 * @property {Player} currentPlayer 現在のプレイヤー
 * @property {currentColor} currentColor 画面左上のコマ
 * @property {bool} busy アニメーション中かどうか
 * @property {state} state ゲームの状態(title/select_color/started/cpu/finished)
 * @property {string} titleCursor タイトル画面でカーソルが合っている要素のid
 */
var Game = function() {
	this.currentColor = $('#current_color');
	this.busy = false;
	this.state = 'title'
	this.titleCursor = '1player';
	this.colorCursor = 'black';
	this.blackCount = $('#black_count');
	this.whiteCount = $('#white_count');
}

/**
 * コマのカウント表示をアップデート
 * @method
 */
Game.prototype.updateCount = function() {
	this.blackCount.html(board.count('black'));
	this.whiteCount.html(board.count('white'));
}

/**
 * プレイヤー交代
 * @method
 */
Game.prototype.changePlayer = function() {
	$('.cover').css('z-index', '1');
	if(this.currentPlayer == this.player1) {
		this.currentPlayer = this.player2;
	} else {
		this.currentPlayer = this.player1;
	}
	$('#' + this.currentPlayer.color + '_cover').css('z-index', '-1');
	
	if(!board.canSet(this.currentPlayer.color)) {
		var c = this.currentPlayer.color == 'black' ? '黒' : '白';
		alert(c + 'が置ける場所がないのでスキップします');
		this.changePlayer();
	}
	
	if(this.currentPlayer instanceof CPU) {
		this.currentPlayer.start();
	}
}

/**
 * タイトル画面を表示する
 * @method
 */
Game.prototype.title = function() {
	this.state = 'title';
	$('#title').css('z-index', '1');
	$('.cover').css('z-index', '1');
	game.reset();
	game.updateCount();
};

/**
 * ゲームを開始する
 * @method
 */
Game.prototype.start = function() {
	this.state = 'started';
	
	if(this.titleCursor == '2players') {
		this.player1 = new Player('black');
		this.player2 = new Player('white');
	} else if(this.titleCursor == '1player') {
		if(this.colorCursor == 'black') {
			this.player1 = new Player('black');
			this.player2 = new CPU('white');
		} else if(this.colorCursor == 'white') {
			this.player1 = new CPU('black');
			this.player2 = new Player('white');
		}
	}
	this.currentPlayer = this.player1;

	$('#title').css('z-index', '-1');
	$('#black_cover').css('z-index', '-1');
	this.updateCount();
	
	if(this.currentPlayer instanceof CPU) {
		this.currentPlayer.start();
	}
};

/**
 * ゲーム終了
 * @method
 */
Game.prototype.finish = function() {
	setTimeout(function() {
		var white = board.count('white');
		var black = board.count('black');
		if(white == black) {
			$('#finish_message').html('引き分けです');
		} else if(white > black) {
			$('#finish_message').html('白の勝ちです');
		} else {
			$('#finish_message').html('黒の勝ちです');
		}
		$('#result').css('z-index', '1');
		game.state = 'finished';
	}, 500);
};

/**
 * ゲームのリセット
 * @method
 */
Game.prototype.reset = function() {
	board.reset();
};

/**
 * 十字キー下が押された時の処理
 * @method
 */
Game.prototype.keyDown = function() {
	if(this.state == 'started') {
		cursor.moveBy(0, 1);
	} else if(this.state == 'title') {
		$('#title *').removeClass('active');
		if(this.titleCursor == '1player') {
			this.titleCursor = '2players';
		} else if(this.titleCursor == '2players') {
			this.titleCursor = '1player';
		}
		$('#' + this.titleCursor).addClass('active');
	} else if(this.state == 'select_color') {
		$('#select_color *').removeClass('active');
		if(this.colorCursor == 'black') {
			this.colorCursor = 'white';
		} else if(this.colorCursor == 'white') {
			this.colorCursor = 'black';
		}
		$('#' + this.colorCursor).addClass('active');
	}
};

/**
 * 十字キー上が押された時の処理
 * @method
 */
Game.prototype.keyUp = function() {
	if(this.state == 'started') {
		cursor.moveBy(0, -1);
	} else if(this.state == 'title') {
		$('#title *').removeClass('active');
		if(this.titleCursor == '1player') {
			this.titleCursor = '2players';
		} else if(this.titleCursor == '2players') {
			this.titleCursor = '1player';
		}
		$('#' + this.titleCursor).addClass('active');
	} else if(this.state == 'select_color') {
		$('#select_color *').removeClass('active');
		if(this.colorCursor == 'black') {
			this.colorCursor = 'white';
		} else if(this.colorCursor == 'white') {
			this.colorCursor = 'black';
		}
		$('#' + this.colorCursor).addClass('active');
	}
};

/**
 * 十字キーの左が押された時の処理
 * @method
 */
Game.prototype.keyLeft = function() {
	if(this.state == 'started') {
		cursor.moveBy(-1, 0);
	}
};

/**
 * 十字キーの右が押された時の処理
 * @method
 */
Game.prototype.keyRight = function() {
	if(this.state == 'started') {
		cursor.moveBy(1, 0);
	}
};

/**
 * Aボタンが押された時の処理
 * @method
 */
Game.prototype.buttonA = function() {
	if(this.state == 'started') {
		if(!this.busy && board.canSetAt(cursor.x, cursor.y, this.currentPlayer.color)) {
			board.setPiece(cursor.x, cursor.y, this.currentPlayer.color);
		}
	} else if(this.state == 'finished') {
		$('#result').css('z-index', '-1');
		this.title();
	} else if(this.state == 'title') {
		if(this.titleCursor == '2players') {
			this.start();
		} else if(this.titleCursor == '1player') {
			$('#title').css('z-index', '-1');
			$('#select_color').css('z-index', '1');
			this.state = 'select_color';
		}
	} else if(this.state == 'select_color') {
		$('#select_color').css('z-index', '-1');
		game.start();
	}
};

/**
 * 対戦相手
 * @class
 * @color {string} color コマの色
 */
var CPU = function(color) {
	this.color = color;
	this.scoreTable = [
		[120, -20, 20,  5,  5, 20, -20, 120],
		[-20, -40, -5, -5, -5, -5, -40, -20],
		[ 20,  -5, 15,  3,  3, 15,  -5,  20],
		[  5,  -5,  3,  3,  3,  3,  -5,   5],
		[  5,  -5,  3,  3,  3,  3,  -5,   5],
		[ 20,  -5, 15,  3,  3, 15,  -5,  20],
		[-20, -40, -5, -5, -5, -5, -40, -20],
		[120, -20, 20,  5,  5, 20, -20, 120],
	];
};

/**
 * CPUのターン
 * @method
 */
CPU.prototype.start = function() {
	game.state = 'cpu';
	
	// 500ms後にカーソル移動、500ms後に配置
	var that = this;
	setTimeout(function() {
		var candidates = that.getCandidates();
		var r = Math.floor(Math.random() * candidates.length);
		cursor.moveTo(candidates[r].x, candidates[r].y);
		setTimeout(function() {
			board.setPiece(candidates[r].x, candidates[r].y, that.color);
			if(board.isFilled()) {
				game.finish();
			} else {
				game.state = 'started';
			}
		}, 1000);
	}, 1000);
};

/**
 * よさそうなマス目の一覧を取得する
 * @method
 */
CPU.prototype.getCandidates = function() {
	var settablePoints = [];
	var max = -40;
	for(var i = 0; i < board.width; i++) {
		for(var j = 0; j < board.height; j++) {
			if(board.canSetAt(i, j, this.color)) {
				settablePoints.push({
					x: i,
					y: j,
					score: this.scoreTable[i][j]
				});
				if(max < this.scoreTable[i][j]) {
					max = this.scoreTable[i][j];
				}
			}
		}
	}
	
	var candidates = [];
	for(var i = 0; i < settablePoints.length; i++) {
		if(settablePoints[i].score == max) {
			candidates.push(settablePoints[i]);
		}
	}
	return candidates;
};

/**
 * エントリポイント
 * @function
 */
var game;
var cursor;
var board;
$(function() {
	var BUTTON_A = (navigator.userAgent.indexOf('3DS') != -1) ? 13 : 65;
	var KEY_LEFT = 37;
	var KEY_UP = 38;
	var KEY_RIGHT = 39;
	var KEY_DOWN = 40;
	
	game = new Game();
	board = new Board();
	cursor = new Cursor();
	
	$(document).on('keydown', function(e) {
		switch(e.keyCode) {
		case KEY_DOWN:
			game.keyDown.call(game);
			break;
		case KEY_UP:
			game.keyUp.call(game);
			break;
		case KEY_LEFT:
			game.keyLeft.call(game);
			break;
		case KEY_RIGHT:
			game.keyRight.call(game);
			break;
		case BUTTON_A:
			game.buttonA.call(game);
			break;
		}
	});
	
	$('#1player').on('click', function() {
		alert('1player');
	});
	
	$('#2players').on('click', function() {
		game.start();
	});
});