if (AlchemistsTable === undefined) var AlchemistsTable = {};

AlchemistsTable.launcher = function () {
	if (Game.Objects['Alchemy lab'].minigame) throw new Error("Alchemist's Table prevented from loading by already present Alchemy Lab minigame.");

	var M = {};
	M.parent = Game.Objects['Alchemy lab'];
	M.parent.minigame = M;
	M.loadedCount = 0;
	M.version = '1.0';
	M.GameVersion = '2.043';


	M.launch = function () {
		var M = this;

		M.init = function (div) {
			M.saveString = M.parent.minigameSave;


			//***********************************
			//    Initial support for multiple games
			//***********************************
			M.games = {
				choice: 0,
				Blackjack: {}
			}

			M.cards = [];
			M.cards.push({ pip: 0, value: 0, suit: 0 });
			for (var j = 0; j < 4; j++) for (var i = 1; i <= 13; i++) M.cards.push({ pip: i, value: (i < 10 ? i : 10), suit: j });

			M.reshuffle = function () {
				M.Deck = [];
				for (var i = 0; i < M.deckCount; i++) for (var j = 1; j < M.cards.length; j++) M.Deck.push(M.cards[j]);
			}

			M.cardImage = function (card) {
				var left, top;
				if (!card.pip) {
					left = 2 * 79;
					top = 4 * 123;
				} else {
					left = (card.pip - 1) * 79;
					top = (card.suit) * 123;
				}
				var str = '';
				str += '-' + left + 'px ';
				str += '-' + top + 'px ';
				return str;
			}

			M.buildSidebar = function () {
				this.getHandValue(M.hands.dealer);
				this.getHandValue(M.hands.player[M.currentPlayerHand]);

				var str = '<table id="casinoBJTable">';
				str += '<tr><td>Dealer\'s hand:' + (Game.Has('Math lessons') ? ('<br/>Score: ' + M.hands.dealer.value) : '') + '</td>';
				for (var i = 0; i < M.hands.dealer.cards.length; i++) str += '<td><div class="casinoBJCardImage" style="background-image:url(' + M.cardsImage + '); background-position:' + M.cardImage(M.hands.dealer.cards[i]) + ';" /></td>';
				str += '</tr>';
				str += '<tr style="height:75px;"><td></td></tr>';
				str += '<tr><td>Player\'s hand' + (M.hands.player.length > 1 ? (' (' + (M.currentPlayerHand + 1) + ' of ' + M.hands.player.length + ')') : '') + ':' + (Game.Has('Math lessons') ? ('<br/>Score: ' + M.hands.player[M.currentPlayerHand].value) : '') + '</td>'
				for (var i = 0; i < M.hands.player[M.currentPlayerHand].cards.length; i++) str += '<td><div class="casinoBJCardImage" style="background-image:url(' + M.cardsImage + '); background-position:' + M.cardImage(M.hands.player[M.currentPlayerHand].cards[i]) + ';" /></td>';
				str += '</tr>';
				str += '</table>';

				M.gameL.innerHTML = str;


				var cardCount = 0;
				for (var i = 0; i < M.Deck.length; i++) {
					if (M.Deck[i].value >= 2 && M.Deck[i].value <= 6) cardCount--;
					else if (M.Deck[i].value == 1 || M.Deck[i].value >= 10) cardCount++;
				}
				if (this.hiddenCard && M.hands.dealer.cards[1] && M.hands.dealer.cards[1].value == 0) {
					if (this.hiddenCard.value >= 2 && this.hiddenCard.value <= 6) cardCount--;
					else if (this.hiddenCard.value == 1 || this.hiddenCard.value >= 10) cardCount++;
				}
				M.infoL.innerHTML = 'Hands won : ' + Beautify(this.wins) + ' (total : ' + Beautify(this.winsT) + ')' + (Game.Has('Counting cards') ? ('<br/>Cards left in deck : ' + M.Deck.length + '<br/>Count : ' + cardCount) : '');

			}

			M.logic = function () {
				//run each frame
				if (M.betMode == 1 && this.phase == this.phases.inactive) {
					M.betAmount = Math.min(Game.cookies, Game.cookiesPs * M.betChoice);
				} else if (M.betMode == 2 && this.phase == this.phases.inactive) {
					M.betAmount = Math.min(Game.cookies, Game.cookiesPs * M.betChoice * 60);
				} else if (M.betMode == 3 && this.phase == this.phases.inactive) {
					M.betAmount = Math.min(Game.cookies, Game.cookiesPs * M.betChoice * 60 * 60);
				}

				if (Date.now() > M.nextBeat) {
					M.nextBeat = Date.now() + M.beatLength;
					var outcome = 0;

					if (this.phase == this.phases.inactive) {

					}
					else if (this.phase == this.phases.deal) {
						if (this.istep == 0) {
							if (M.Deck.length < (M.minDecks * 52)) M.reshuffle();
							M.hands = { dealer: { value: 0, cards: [] }, player: [{ value: 0, cards: [] }] };
							M.currentPlayerHand = 0;
							Game.Spend(M.betAmount);

							this.hit(M.hands.player[0], true);
							this.istep = 1;
						}
						else if (this.istep == 1) {
							this.hit(M.hands.dealer, false);
							this.istep = 2;
						}
						else if (this.istep == 2) {
							this.hit(M.hands.player[0], true);
							this.istep = 3;
						}
						else if (this.istep == 3) {
							this.hit(M.hands.dealer, false);

							this.hiddenCard = M.hands.dealer.cards[1];
							M.hands.dealer.cards[1] = M.cards[0];

							this.phase = this.phases.firstTurn;
							if (Math.random() < this.instantWinChance()) {
								M.hands.dealer.cards[1] = this.hiddenCard;

								M.hands.player[0].cards[0] = { pip: choose([10, 11, 12, 13]), value: 10, suit: choose([0, 1, 2, 3]) };
								M.hands.player[0].cards[1] = { pip: 1, value: 1, suit: choose([0, 1, 2, 3]) };

								outcome = 'instantWin';
								this.phase = this.phases.inactive;

							} else if (M.hands.player[0].value == 21) {
								M.hands.dealer.cards[1] = this.hiddenCard;
								outcome = 'playerblackjack';
								this.phase = this.phases.inactive;

							} else if (M.hands.dealer.value == 21) {
								M.hands.dealer.cards[1] = this.hiddenCard;
								outcome = 'dealerblackjack';
								this.phase = this.phases.inactive;

							} else {

							}
						}

						this.buildTable();
						this.buildSidebar();
					}
					else if (this.phase == this.phases.playerTurn || this.phase == this.phases.firstTurn) {

					}
					else if (this.phase == this.phases.dealerTurn) {
						if (M.hands.dealer.value < 17) {
							this.hit(M.hands.dealer, false);
						}
						if (M.hands.dealer.value >= 17) {
							M.currentPlayerHand = 0;
							this.phase = this.phases.evaluate;
						}

						this.buildTable();
						this.buildSidebar();
					}
					else if (this.phase == this.phases.evaluate) {
						var playerHand = M.currentPlayerHand;
						M.hands.dealer.cards[1] = this.hiddenCard;
						this.buildTable();

						if (M.hands.player[playerHand].value > 21) outcome = 'bust';
						else if (M.hands.dealer.value > 21) {
							outcome = 'dealerbust';
						}
						else if (M.hands.dealer.value < M.hands.player[playerHand].value) {
							outcome = 'win';
						}
						else if (M.hands.dealer.value > M.hands.player[playerHand].value) outcome = 'lose';
						else if (M.hands.dealer.value == M.hands.player[playerHand].value) {
							outcome = 'push';
						}

						playerHand++;
						if (playerHand < M.hands.player.length) {
							M.currentPlayerHand = playerHand;
							this.phase = this.phases.evaluate;
						}
						else {
							this.phase = this.phases.inactive;
						}

						this.buildTable();
						this.buildSidebar();
					}

					this.getHandValue(M.hands.dealer);
					this.getHandValue(M.hands.player[M.currentPlayerHand]);

					if (outcome) {
						var messg = '';
						var winnings = M.betAmount;

						switch (outcome) {
							case 'instantWin':
								winnings *= 2.5;
								messg = 'You make your own luck!';
								this.ownLuckWins++;

								if (this.ownLuckWins >= 13) Game.Win('Ace up your sleeve');
								if (Game.Has('I make my own luck') && this.ownLuckWins >= 52) Game.Unlock('Infinite Improbability Drive');
								if (this.ownLuckWins >= (13 * 13)) Game.Win('Paid off the dealer');
								if (this.ownLuckWins >= 666) Game.Win('Deal with the Devil');
								break;

							case 'playerblackjack':
								winnings *= 2.5;
								messg = 'Blackjack!';
								Game.Unlock('I make my own luck');
								Game.Win('Blackjack!');
								break;

							case 'dealerblackjack':
								winnings *= 0;
								messg = 'Dealer blackjack';
								break;

							case 'bust':
								winnings *= 0;
								messg = 'Over 21!';
								break;

							case 'dealerbust':
								winnings *= 2;
								messg = 'Dealer went over 21!';
								break;

							case 'win':
								winnings *= 2;
								messg = 'You win!';
								break;

							case 'lose':
								winnings *= 0;
								messg = 'You lose';
								break;

							case 'push':
								if (Game.Has('Tiebreaker')) {
									winnings *= 2;
									messg = 'Tie goes to player!';
								} else {
									winnings *= 0;
									messg = 'Tie goes to dealer';
									this.tiesLost++;
									if (this.tiesLost >= 7) Game.Unlock('Tiebreaker');
								}

								break;

							default:
								break;
						}

						messg += '<div style="font-size:65%;">';
						if (winnings > 0) {
							Game.Earn(winnings);
							this.wins++;
							this.winsT++;
							messg += 'Gain ' + Beautify(Math.abs(winnings - M.betAmount)) + ' cookies!';

							if (this.winsT >= 7) Game.Unlock('Raise the stakes');
							if (Game.Has('Raise the stakes') && this.winsT >= 49) Game.Unlock('High roller!');
							if (this.winsT >= 21) Game.Win('Card minnow');
							if (this.winsT >= 210) Game.Win('Card trout');
							if (this.winsT >= 2100) Game.Win('Card shark');

							if (M.hands.player[M.currentPlayerHand].cards.length >= 5) Game.Win('Five card stud');
							if (M.hands.player[M.currentPlayerHand].cards.length >= 6) Game.Win("Why can't I hold all these cards?");
							if (M.hands.player[M.currentPlayerHand].value <= 5) Game.Win('I also like to live dangerously');
						} else {
							messg += 'Lost ' + Beautify(Math.abs(M.betAmount)) + ' cookies';
						}
						messg += '</div>';

						this.netTotal += winnings - M.betAmount;
						Game.Popup(messg, Game.mouseX, Game.mouseY);

						this.buildTable();
						this.buildSidebar();
					}
				}
			}

			M.draw = function () {
				//run each draw frame
				l('casinoCurrentBet').innerHTML = '(' + Beautify(M.betAmount) + ' cookies)';
			}

			
		var str='';
		str+='<style>'+
		'#alchemistsTableBackground{background:url(img/shadedBorders.png),url(' + M.sourceFolder + '/background.jpg);background-size:100% 100%,auto;position:absolute;left:0px;right:0px;top:0px;bottom:16px;}'+
		'#alchemistsTableContent{position:relative;box-sizing:border-box;padding:4px 24px;}'+
		'#alchemistsTableBlack{max-width:95%;margin:4px auto;height:16px;}'+
		'#alchemistsTableBarFull{transform:scale(1,2);transform-origin:50% 0;height:50%;}'+
		'#alchemistsTableBarText{transform:scale(1,0.8);width:100%;position:absolute;left:0px;top:0px;text-align:center;color:#fff;text-shadow:-1px 1px #000,0px 0px 4px #000,0px 0px 6px #000;margin-top:2px;}'+
		'#alchemistsTableSpells{text-align:center;width:100%;padding:8px;box-sizing:border-box;}'+
		'.alchemistsTableIcon{pointer-events:none;margin:2px 6px 0px 6px;width:48px;height:48px;opacity:0.8;position:relative;}'+
		'.alchemistsTablePrice{pointer-events:none;}'+
		'.alchemistsTableSpell{box-shadow:4px 4px 4px #000;cursor:pointer;position:relative;color:#f33;opacity:0.8;text-shadow:0px 0px 4px #000,0px 0px 6px #000;font-weight:bold;font-size:12px;display:inline-block;width:60px;height:74px;background:url(img/spellBG.png);}'+
		'.alchemistsTableSpell.ready{color:rgba(255,255,255,0.8);opacity:1;}'+
		'.alchemistsTableSpell.ready:hover{color:#fff;}'+
		'.alchemistsTableSpell:hover{box-shadow:6px 6px 6px 2px #000;z-index:1000000001;top:-1px;}'+
		'.alchemistsTableSpell:active{top:1px;}'+
		'.alchemistsTableSpell.ready .grimoireIcon{opacity:1;}'+
		'.alchemistsTableSpell:hover{background-position:0px -74px;} .grimoireSpell:active{background-position:0px 74px;}'+
		'.alchemistsTableSpell:nth-child(4n+1){background-position:-60px 0px;} .grimoireSpell:nth-child(4n+1):hover{background-position:-60px -74px;} .grimoireSpell:nth-child(4n+1):active{background-position:-60px 74px;}'+
		'.alchemistsTableSpell:nth-child(4n+2){background-position:-120px 0px;} .grimoireSpell:nth-child(4n+2):hover{background-position:-120px -74px;} .grimoireSpell:nth-child(4n+2):active{background-position:-120px 74px;}'+
		'.alchemistsTableSpell:nth-child(4n+3){background-position:-180px 0px;} .grimoireSpell:nth-child(4n+3):hover{background-position:-180px -74px;} .grimoireSpell:nth-child(4n+3):active{background-position:-180px 74px;}'+
		
		'.grimoireSpell:hover .grimoireIcon{top:-1px;}'+
		'.grimoireSpell.ready:hover .grimoireIcon{animation-name:bounce;animation-iteration-count:infinite;animation-duration:0.8s;}'+
		'.noFancy .grimoireSpell.ready:hover .grimoireIcon{animation:none;}'+
		
		'#grimoireInfo{text-align:center;font-size:11px;margin-top:12px;color:rgba(255,255,255,0.75);text-shadow:-1px 1px 0px #000;}'+
		'</style>';
		str+='<div id="alchemistsTableBackground"></div>';
		str+='<div id="grimoireContent">';
			str+='<div id="grimoireSpells">';//did you know adding class="shadowFilter" to this cancels the "z-index:1000000001" that displays the selected spell above the tooltip? stacking orders are silly https://philipwalton.com/articles/what-no-one-told-you-about-z-index/
			for (var i in M.spells)
			{
				var me=M.spells[i];
				var icon=me.icon||[28,12];
				str+='<div class="grimoireSpell titleFont" id="grimoireSpell'+me.id+'" '+Game.getDynamicTooltip('Game.ObjectsById['+M.parent.id+'].minigame.spellTooltip('+me.id+')','this')+'><div class="usesIcon shadowFilter grimoireIcon" style="background-position:'+(-icon[0]*48)+'px '+(-icon[1]*48)+'px;"></div><div class="grimoirePrice" id="grimoirePrice'+me.id+'">-</div></div>';
			}
			str+='</div>';
			var icon=[29,14];
			str+='<div id="grimoireBar" class="smallFramed meterContainer" style="width:1px;"><div '+Game.getDynamicTooltip('Game.ObjectsById['+M.parent.id+'].minigame.refillTooltip','this')+' id="grimoireLumpRefill" class="usesIcon shadowFilter lumpRefill" style="left:-40px;top:-17px;background-position:'+(-icon[0]*48)+'px '+(-icon[1]*48)+'px;"></div><div id="grimoireBarFull" class="meter filling" style="width:1px;"></div><div id="grimoireBarText" class="titleFont"></div><div '+Game.getTooltip('<div style="padding:8px;width:300px;font-size:11px;text-align:center;">'+loc("This is your magic meter. Each spell costs magic to use.<div class=\"line\"></div>Your maximum amount of magic varies depending on your amount of <b>Wizard towers</b>, and their level.<div class=\"line\"></div>Magic refills over time. The lower your magic meter, the slower it refills.")+'</div>')+' style="position:absolute;left:0px;top:0px;right:0px;bottom:0px;"></div></div>';
			str+='<div id="grimoireInfo"></div>';
		str+='</div>';
		div.innerHTML=str;

			var str = '';
			str += '<style>' +
				'#alchemyTableBackground{background:url(img/shadedBorders.png), url(' + M.sourceFolder + '/background.jpg); background-size:100% 100%, auto; position:absolute; left:0px; right:0px; top:0px; bottom:16px;}' +
				'#casinoContent{position:relative; box-sizing:border-box; padding:4px 24px; height:450px;}' +
				'#casinoSidebar{text-align:center; margin:0px; padding:0px; position:absolute; left:4px; top:4px; bottom:4px; right:65%; overflow-y:auto; overflow-x:hidden; box-shadow:8px 0px 8px rgba(0,0,0,0.5);}' +
				'#casinoSidebar .listing{text-align:left;}' +
				'#casinoTable{text-align:center; position:absolute; right:0px; top:0px; bottom:0px; overflow-x:auto; overflow:hidden;}' +
				'.casinoBJCardImage{position: relative; width: 79px; height: 123px; left: 0px; top: 0px; overflow: visible;}' +
				'.casinoSpacer{position: relative; width: 79px; height: 123px; left: 0px; top: 0px; overflow: visible;}' +
				'#casinoBJTable td{text-align:center; vertical-align: middle; width:90px;}' +
				'#casinoBJTable tr{height:150px}' +
				'#casinoBJTable{margin-left:auto; margin-right:auto;}' +
				'.casinoSidebarLabel{font-size:12px;width:100%;padding:2px;margin-top:4px;margin-bottom:-4px;}' +
				'.casinoActionsTable tr{height: 40px;}' +
				'#casinoGame{position: relative;}' +
				'#casinoInfo{position: relative;text-align:center; font-size:11px; margin-top:12px; color:rgba(255,255,255,0.75); text-shadow:-1px 1px 0px #000;}' +
				'</style>';
			str += '<div id="casinoBG"></div>';
			str += '<div id="casinoContent">';
			str += '<div id="casinoSidebar" class="framed">';
			str += '<div class="title casinoSidebarLabel">Cash</div><div class="line"></div>';
			str += '<div id="casinoMoney"></div>';
			str += '<div class="title casinoSidebarLabel">Actions</div><div class="line"></div>';
			str += '<div id="casinoActions"></div>';
			str += '</div>';
			str += '<div id="casinoTable">';
			str += '<div id="casinoGame"></div>';
			str += '<div id="casinoInfo">Hello World!</div>';
			str += '</div>';
			str += '</div>';
			div.innerHTML = str;

			M.sidebarL = l('casinoSidebar');
			M.moneyL = l('casinoMoney');
			M.actionsL = l('casinoActions');
			M.tableL = l('casinoTable');
			M.gameL = l('casinoGame');
			M.infoL = l('casinoInfo');

			M.reset();

			M.buildSidebar();
			M.buildTable();

			M.loadedCount++;

			M.LoadSave();
			if (Game.prefs.popups) Game.Popup('Casino loaded!');
			else Game.Notify('Casino loaded!', '', '', 1, 1);
		}

		M.save = function () {
			//output cannot use ",", ";" or "|"

			var getMinigameStateSave = function () {
				var res = '';
				res += parseInt(M.parent.onMinigame ? '1' : '0');
				res += '_' + parseInt(M.games.Blackjack.wins);
				res += '_' + parseInt(M.games.Blackjack.winsT);
				res += '_' + parseInt(M.games.Blackjack.ownLuckWins);
				res += '_' + parseInt(M.games.Blackjack.tiesLost);
				res += '_' + parseInt(M.betMode);
				res += '_' + parseInt(M.betChoice);
				res += '_' + parseFloat(M.games.Blackjack.netTotal);
				res += '_' + parseInt(0);
				res += '_' + parseInt(M.beatLength);

				return res;
			}

			var getGameStateSave = function () {
				var res = '';
				res += parseInt(M.currentPlayerHand);
				res += '_' + parseInt(M.nextBeat);
				res += '_' + parseInt(M.games.Blackjack.phase);
				res += '_' + parseInt(M.games.Blackjack.istep);
				res += '_' + parseFloat(M.betAmount);
				res += '_' + parseInt(M.games.Blackjack.hiddenCard.pip + 13 * M.games.Blackjack.hiddenCard.suit);

				return res;
			}

			var getCardSave = function (deck) {
				var res = '';
				for (var i = 0; i < deck.length; i++) res += (res.length ? '-' : '') + (deck[i].pip + 13 * deck[i].suit);
				return res;
			}

			var getPlayerHandsSave = function () {
				var res = '';
				for (var i = 0; i < M.hands.player.length; i++) res += (res.length ? '_' : '') + getCardSave(M.hands.player[i].cards);
				return res;
			}

			var getAchievementSave = function () {
				var res = '';
				for (var i = 0; i < M.Achievements.length; i++) res += Math.min(M.Achievements[i].won);
				return res;
			}

			var getUpgradeSave = function () {
				var res = '';
				for (var i in M.Upgrades) {
					var me = M.Upgrades[i];
					res += Math.min(me.unlocked, 1) + '' + Math.min(me.bought, 1);
				}
				return res;
			}


			var str = getMinigameStateSave();
			str += ' ' + getGameStateSave();
			str += ' ' + getCardSave(M.hands.dealer.cards);
			str += ' ' + getPlayerHandsSave();
			str += ' ' + getCardSave(M.Deck);
			str += ' ' + getAchievementSave();
			str += ' ' + getUpgradeSave();

			CCSE.config.OtherMods[M.name] = str;
			M.saveString = str;
			return ''; //str;
		}

		M.load = function (str) {
			//interpret str; called after .init
			//note : not actually called in the Game's load; see "minigameSave" in main.js
			if (!str) return false;
			M.saveString = str;

			var parseMinigameStateSave = function (str) {
				var i = 0;
				var spl = str.split('_');
				var on = parseInt(spl[i++] || 0);
				M.games.Blackjack.wins = parseInt(spl[i++] || 0);
				M.games.Blackjack.winsT = parseInt(spl[i++] || 0);
				M.games.Blackjack.ownLuckWins = parseInt(spl[i++] || 0);
				M.games.Blackjack.tiesLost = parseInt(spl[i++] || 0);
				M.betMode = parseInt(spl[i++] || 0);
				M.betChoice = parseInt(spl[i++] || 0);
				M.games.Blackjack.netTotal = parseFloat(spl[i++] || 0);
				var dummy = parseInt(spl[i++] || 0);
				M.beatLength = parseInt(spl[i++] || 750);

				if (on && Game.ascensionMode != 1) M.parent.switchMinigame(1);
			}

			var parseGameStateSave = function (str) {
				var i = 0;
				var spl = str.split('_');
				M.currentPlayerHand = parseInt(spl[i++] || 0);
				M.nextBeat = parseInt(spl[i++] || 0);
				M.games.Blackjack.phase = parseInt(spl[i++] || 0);
				M.games.Blackjack.istep = parseInt(spl[i++] || 0);
				M.betAmount = parseFloat(spl[i++] || 0);
				M.games.Blackjack.hiddenCard = M.cards[parseInt(spl[i++] || 0)];
			}

			var parseCardSave = function (str) {
				var res = [];
				if (str) {
					var arr = str.split('-');
					for (var i = 0; i < arr.length; i++) {
						res.push(M.cards[arr[i]]);
					}
				}
				return res;
			}

			var parsePlayerHandsSave = function (str) {
				M.hands.player = [];
				if (str) {
					var hands = str.split('_');
					for (var i = 0; i < hands.length; i++) {
						M.hands.player.push({ cards: parseCardSave(hands[i]) });
						M.games.Blackjack.getHandValue(M.hands.player[i]);
					}
				} else {
					M.hands.player = [{ value: 0, cards: [] }];
				}
			}

			var parseAchievementSave = function (str) {
				var spl = str.split('');
				for (var i in M.Achievements) {
					var me = M.Achievements[i];
					if (spl[i]) {
						var mestr = [spl[i]];
						me.won = parseInt(mestr[0]);
					} else {
						me.won = 0;
					}
					if (me.won && Game.CountsAsAchievementOwned(me.pool)) Game.AchievementsOwned++;
				}
			}

			var parseUpgradeSave = function (str) {
				var spl = str.split('');
				for (var i in M.Upgrades) {
					var me = M.Upgrades[i];
					if (spl[i * 2]) {
						var mestr = [spl[i * 2], spl[i * 2 + 1]];
						me.unlocked = parseInt(mestr[0]);
						me.bought = parseInt(mestr[1]);
						if (me.bought && Game.CountsAsUpgradeOwned(me.pool)) Game.UpgradesOwned++;
					}
					else {
						me.unlocked = 0;
						me.bought = 0;
					}
				}
			}


			var i = 0;
			var spl = str.split(' ');
			parseMinigameStateSave(spl[i++] || '');
			parseGameStateSave(spl[i++] || '');
			M.hands.dealer = { cards: parseCardSave(spl[i++] || 0) };
			parsePlayerHandsSave(spl[i++] || 0);
			M.Deck = parseCardSave(spl[i++] || 0);
			parseAchievementSave(spl[i++] || '');
			parseUpgradeSave(spl[i++] || '');

			M.games.Blackjack.getHandValue(M.hands.dealer);
			if (M.Deck.length < (M.minDecks * 52)) M.reshuffle();
			if (M.games.Blackjack.phase == M.games.Blackjack.phases.inactive) {
				M.hands = { dealer: { value: 0, cards: [] }, player: [{ value: 0, cards: [] }] };
				M.currentPlayerHand = 0;
			}

			M.games.Blackjack.buildSidebar();
			M.games.Blackjack.buildTable();
		}

		M.reset = function (hard) {
			M.deckCount = 4;
			M.Deck = [];
			M.hands = { dealer: { value: 0, cards: [] }, player: [{ value: 0, cards: [] }] };
			M.games.Blackjack.hiddenCard = M.cards[0];
			M.currentPlayerHand = 0;
			M.minDecks = 2;
			M.betAmount = 0;
			M.betChoice = 1;
			M.betMode = 1;
			M.games.Blackjack.wins = 0;
			M.games.Blackjack.ownLuckWins = 0;
			M.games.Blackjack.tiesLost = 0;
			M.games.Blackjack.phase = 0;
			M.games.Blackjack.istep = 0;
			M.nextBeat = Date.now();

			M.setPercentagePrecision(1);

			if (hard) {
				M.saveString = '';
			}

			M.reshuffle();

			M.buildSidebar();
			M.buildTable();

			setTimeout(function (M) { return function () { M.onResize(); } }(M), 10);
		}

		M.logic = function () {
			//run each frame
			if (M.games.choice == 0) M.games.Blackjack.logic();
		}

		M.onResize = function () {
			var width = l('casinoContent').offsetWidth;
			var sidebarW = width * 0.20 - 8;
			var tableW = width * 0.80 - 8;
			M.sidebarL.style.width = sidebarW + 'px';
			M.tableL.style.width = tableW + 'px';
		}

		M.draw = function () {
			//run each draw frame
			if (M.games.choice == 0) M.games.Blackjack.draw();

			l('casinoCurrentBet').innerHTML = '(' + Beautify(M.betAmount) + ' cookies)';
		}

		M.init(l('rowSpecial' + M.parent.id));
	}



	// Stuff that needs to wait for CCSE but should only run once goes here
	M.parent.minigameName = 'Casino';

	M.name = M.parent.minigameName;
	M.sourceFolder = CCSE.GetModPath(M.name);
	M.parent.minigameUrl = M.sourceFolder + '/dummyFile.js';
	M.savePrefix = 'minigameCasino';
	M.cardsImage = M.sourceFolder + '/phantasypantsCards.png';
	M.iconsImage = M.sourceFolder + '/customIcons.png';
	M.chancemakerChance = 0.0003;
	M.beatLength = 750;

	//***********************************
	//    Upgrades
	//***********************************
	M.Upgrades = [];
	M.Upgrades.push(CCSE.NewUpgrade('Raise the stakes', "Can bet a minute of CPS at a time.<q>Now we're getting somewhere!</q>", 10, [0, 3, M.iconsImage]));
	M.Upgrades.push(CCSE.NewUpgrade('High roller!', "Can bet an hour of CPS at a time.<q>If you have to ask, you can't afford it.</q>", 60, [0, 3, M.iconsImage]));
	M.Upgrades.push(CCSE.NewUpgrade('Math lessons', "Show the value of your current blackjack hand.<q>C'mon, it's not that hard.</q>", 1, [0, 3, M.iconsImage]));
	M.Upgrades.push(CCSE.NewUpgrade('Counting cards', "Keeps track of which cards have been played. 2-6 increase the count by 1. 10-K and Aces decrease the count by 1. Higher counts give better odds.<q>Technically not cheating, but casinos frown on this sort of thing.</q>", 21, [0, 3, M.iconsImage]));
	M.Upgrades.push(CCSE.NewUpgrade('Tiebreaker', "Ties push to the player, not the dealer.<q>Look at me. I'm the dealer now.</q>", 15, [0, 3, M.iconsImage]));
	M.Upgrades.push(CCSE.NewUpgrade('I make my own luck', "Each Chancemaker gives a <b>0.0<span></span>3%</b> chance to instantly win the hand.<q>Wait, that's illegal.</q>", 60, [0, 3, M.iconsImage]));
	M.Upgrades.push(CCSE.NewUpgrade('Infinite Improbability Drive', "Chancemaker chance to instantly win the hand is <b>doubled</b>.<q>You stole a protoype spaceship just to cheat at cards?</q>", 180, [0, 3, M.iconsImage]));
	M.Upgrades.push(CCSE.NewUpgrade('Double or nothing', "Multiply your bet by <b>2</b>.<q>The Martingale System sounds good on paper, but one losing streak long enough will bankrupt anyone.</q>", 120, [0, 3, M.iconsImage]));
	M.Upgrades.push(CCSE.NewUpgrade('Stoned cows', "Multiply your bet by <b>5</b>.<q>The steaks have never been higher!</q>", 300, [0, 3, M.iconsImage]));
	M.Upgrades.push(CCSE.NewHeavenlyUpgrade('Actually, do tell me the odds', "Display the probabilities of various outcomes of taking an action in the Casino.<q>2 + 2 is 4 minus 1 that's 3 quick maffs.</q>", 21000000, [0, 3, M.iconsImage], 3, -200, []));
	Game.last.showIf = function () { return Game.HasAchiev('Card shark'); }

	for (var i = 0; i < M.Upgrades.length; i++) {
		M.Upgrades[i].order = 1000000 + i / 100;
		if (M.Upgrades[i].pool != 'prestige') M.Upgrades[i].priceFunc = function () { return this.basePrice * Game.cookiesPs * 60; };
	}
	Game.Upgrades['Double or nothing'].order = Game.Upgrades['High roller!'].order + 0.001;
	Game.Upgrades['Stoned cows'].order = Game.Upgrades['Double or nothing'].order + 0.001;


	//***********************************
	//    Achievements
	//***********************************
	M.Achievements = [];
	M.Achievements.push(CCSE.NewAchievement('Card minnow', 'Win <b>21</b> hands of blackjack.', [0, 3, M.iconsImage]));
	M.Achievements.push(CCSE.NewAchievement('Card trout', 'Win <b>210</b> hands of blackjack.', [0, 3, M.iconsImage]));
	M.Achievements.push(CCSE.NewAchievement('Card shark', 'Win <b>2100</b> hands of blackjack.', [0, 3, M.iconsImage]));
	M.Achievements.push(CCSE.NewAchievement('Five card stud', "Win a hand of blackjack with <b>5</b> cards in your hand.<q>Wait, what game are you playing again?</q>", [0, 3, M.iconsImage]));
	M.Achievements.push(CCSE.NewAchievement("Why can't I hold all these cards?", 'Win a hand of blackjack with <b>6</b> cards in your hand.', [0, 3, M.iconsImage]));
	Game.last.pool = 'shadow';
	M.Achievements.push(CCSE.NewAchievement('Ace up your sleeve', "Win <b>13</b> hands of blackjack through chancemaker intervention in one ascension.<q>I'll tell you what the odds are.</q>", [0, 3, M.iconsImage]));
	M.Achievements.push(CCSE.NewAchievement('Paid off the dealer', "Win <b>" + (13 * 13) + "</b> hands of blackjack through chancemaker intervention in one ascension.<q>Takes money to make money.</q>", [0, 3, M.iconsImage]));
	M.Achievements.push(CCSE.NewAchievement('Deal with the Devil', "Win <b>666</b> hands of blackjack through chancemaker intervention in one ascension.<q>Just sign right here.</q>", [0, 3, M.iconsImage]));
	Game.last.pool = 'shadow';
	M.Achievements.push(CCSE.NewAchievement('Blackjack!', "Be dealt a hand totaling 21 naturally.", [0, 3, M.iconsImage]));
	M.Achievements.push(CCSE.NewAchievement('I like to live dangerously', "Hit on <b>17</b> or above without going over <b>21</b>.<q>My name is Number 2. This is my Italian confidential secretary. Her name is Alotta. Alotta Fagina.</q>", [0, 3, M.iconsImage]));
	M.Achievements.push(CCSE.NewAchievement('I also like to live dangerously', "Win with a score of <b>5</b> or less.<q>Yeah baby!</q>", [0, 3, M.iconsImage]));
	Game.last.pool = 'shadow';

	for (var i = 0; i < M.Achievements.length; i++) M.Achievements[i].order = 1000000 + i / 100;


	//***********************************
	//    CCSE arrays
	//***********************************
	Game.customOptionsMenu.push(function () {
		var callback = "Game.Objects['Chancemaker'].minigame.beatLength = Math.round(l('beatLengthSlider').value); l('beatLengthSliderRightText').innerHTML = Game.Objects['Chancemaker'].minigame.beatLength;";
		var str = '<div class="listing">' +
			CCSE.MenuHelper.Slider('beatLengthSlider', 'Beat Length', '[$]', () => M.beatLength, callback, 0, 1000, 10) +
			'This is the time in milliseconds between each card deal.</div>';

		CCSE.AppendCollapsibleOptionsMenu(M.name, str);
	});

	Game.customStatsMenu.push(function () {
		CCSE.AppendStatsVersionNumber(M.name, M.version);
		if (M.loadedCount) {
			if (M.games.Blackjack.netTotal) CCSE.AppendStatsGeneral('<div class="listing"><b>Blackjack has earned you :</b> <div class="price plain">' + Game.tinyCookie() + Beautify(M.games.Blackjack.netTotal) + '</div></div>');
			if (M.games.Blackjack.ownLuckWins) CCSE.AppendStatsSpecial('<div class="listing"><b>Made your own luck :</b> ' + M.games.Blackjack.ownLuckWins + ' times</div>');
		}
	});

	M.LoadSave = function () {
		if (M.load) {
			if (CCSE.config.OtherMods[M.name]) M.parent.minigameSave = CCSE.config.OtherMods[M.name];
			M.saveString = M.parent.minigameSave;

			M.load(M.saveString);
		}
	}


	CCSE.customLoad.push(M.LoadSave);
	Game.registerHook('check', function () {
		if (M.loadedCount) {
			if (M.games.Blackjack.winsT >= 7) Game.Unlock('Raise the stakes');
			if (Game.Has('Raise the stakes') && M.games.Blackjack.winsT >= 49) Game.Unlock('High roller!');
			if (Game.Has('High roller!') && Game.cookies >= (4 * Game.cookiesPs * 60 * 60)) Game.Unlock('Double or nothing');
			if (Game.Has('Double or nothing') && Game.cookies >= (10 * Game.cookiesPs * 60 * 60)) Game.Unlock('Stoned cows');
			if (Game.Has('I make my own luck') && M.games.Blackjack.ownLuckWins >= 52) Game.Unlock('Infinite Improbability Drive');
			if (M.games.Blackjack.tiesLost >= 7) Game.Unlock('Tiebreaker');

			if (M.games.Blackjack.winsT >= 21) Game.Win('Card minnow');
			if (M.games.Blackjack.winsT >= 210) Game.Win('Card trout');
			if (M.games.Blackjack.winsT >= 2100) Game.Win('Card shark');
			if (M.games.Blackjack.ownLuckWins >= 13) Game.Win('Ace up your sleeve');
			if (M.games.Blackjack.ownLuckWins >= (13 * 13)) Game.Win('Paid off the dealer');
			if (M.games.Blackjack.ownLuckWins >= 666) Game.Win('Deal with the Devil');

			if (M.games.choice == 0) M.games.Blackjack.buildSidebar();
		}
	});


	if (typeof CM != 'undefined') CM.Sim.InitData(); // Cookie Monster compatibility


	Game.LoadMinigames();
}

if (CCSE && CCSE.isLoaded) {
	Casino.launcher();
}
else {
	if (!CCSE) var CCSE = {};
	if (!CCSE.postLoadHooks) CCSE.postLoadHooks = [];
	CCSE.postLoadHooks.push(Casino.launcher);
}