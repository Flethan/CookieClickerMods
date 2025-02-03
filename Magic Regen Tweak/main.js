Game.registerMod("Magic Regen Tweak", {
	init: function() {
		let MOD = this;
		function replaceGrimoire() {
			if (!Game.Objects['Wizard tower'].minigameLoaded) return;
			let M = Game.Objects['Wizard tower'].minigame;
			if (!Game.Objects['Wizard tower']?.minigame?.spells['conjure baked goods']) return;
	
			M.spells['conjure baked goods'].costPercent = 0.2;
	
			M.logic = function () {
				if (Game.T % 5 == 0) { M.computeMagicM(); }
				M.magicPS = (M.magicM * Math.pow(M.magic + 5.5, 4 / 3)) / (120000 * (0.5 * M.magicM + M.magic + 8.55));
				M.magic += M.magicPS;
				M.magic = Math.min(M.magic, M.magicM);
				if (Game.T % 5 == 0) {
					for (let i in M.spells) {
						let me = M.spells[i];
						let cost = M.getSpellCost(me);
						l('grimoirePrice' + me.id).innerHTML = Beautify(cost);
						if (M.magic < cost) l('grimoireSpell' + me.id).className = 'grimoireSpell titleFont';
						else l('grimoireSpell' + me.id).className = 'grimoireSpell titleFont ready';
					}
				}
			};

			M.spellTooltip = function (id) {
				return function(){
					var me=M.spellsById[id];
					me.icon=me.icon||[28,12];
					var cost=Beautify(M.getSpellCost(me));
					var costBreakdown=M.getSpellCostBreakdown(me);
					if (cost!=costBreakdown) costBreakdown=' <small>('+costBreakdown+')</small>'; else costBreakdown='';
					var backfire=M.getFailChance(me);
					var str='<div style="padding:8px 4px;min-width:350px;" id="tooltipSpell">'+
					'<div class="icon" style="float:left;margin-left:-8px;margin-top:-8px;background-position:'+(-me.icon[0]*48)+'px '+(-me.icon[1]*48)+'px;"></div>'+
					'<div class="name">'+me.name+'</div>'+
					'<div>'+loc("Magic cost:")+' <b style="color:#'+(cost<=M.magic?'6f6':'f66')+';">'+cost+'</b>'+costBreakdown+'</div>'+
					(me.fail?('<div><small>'+loc("Chance to backfire:")+' <b style="color:#f66">'+Math.ceil(100*backfire)+'%</b></small></div>'):'')+
					'<div class="line"></div><div class="description"><b>'+loc("Effect:")+'</b> <span class="green">'+(me.descFunc?me.descFunc():me.desc)+'</span>'+(me.failDesc?('<div style="height:8px;"></div><b>'+loc("Backfire:")+'</b> <span class="red">'+me.failDesc+'</span>'):'')+'</div></div>';
					if (me.name === "Gambler's Fever Dream") return str;
					return str.replace("</small></div><div><small>",
							"</small></div><div><small>" +
							MOD.getSpellRegenTimeString(me) +
							"</small></div><div><small>")
						.replace("margin-top:-8px",
							"margin-top:0px");
				};
			};

			Game.registerHook('draw', MOD.updateGrimoireTime);
			Game.removeHook('check', this);
			Game.Notify(`Magic Regen Tweak loaded.`,`Arrived precisely on time!`,[0,0,MOD.dir+'/icon.png']);
		}
		Game.registerHook('check', replaceGrimoire);
	},
	updateGrimoireTime: function () {
		if (Game.drawT % 5 == 0) {
			let M = Game.Objects['Wizard tower'].minigame;

			const secondsUntil = Math.ceil((6000 * (M.magicM - M.magic)) / (M.magicM * Math.cbrt(M.magic + 5.7)));
			const justSeconds = secondsUntil % 60;
			const justMinutes = Math.floor(secondsUntil / 60)

			let message = "";
			if (secondsUntil) {
				if (justMinutes) message += loc("%1 minute", LBeautify(justMinutes)) + ", ";
				message += loc("%1 second", LBeautify(justSeconds)) + loc(" until your magic is full.")
			} else message += loc("Your magic is full.");
			message += "<br></br>";

			M.infoL.innerHTML = message + M.infoL.innerHTML;
		}
	},
	getSpellRegenTimeString: function (spell) {
		let M = Game.Objects["Wizard tower"].minigame;

		const spellCost = M.getSpellCost(spell);
		if (spellCost > M.magicM) return `You need ${spellCost - M.magicM} more max magic to cast this spell.`;

		let message = "";
		let secondsUntil = (6000 * (M.magicM - M.magic)) / (M.magicM * Math.cbrt(M.magic + 5.7));
		const magicAfter = M.magic - spellCost;

		if (magicAfter < 0) {
			secondsUntil -= (6000 * (M.magicM - (M.magic - magicAfter))) / (M.magicM * Math.cbrt((M.magic - magicAfter) + 5.7));
			message = loc(" until you can cast this spell.");
		} else {
			secondsUntil = (6000 * (M.magicM - magicAfter)) / (M.magicM * Math.cbrt(magicAfter + 5.7)) - secondsUntil;
			message = loc(" to regen this spell 's cost after casting it.");
		}

		secondsUntil = Math.ceil(secondsUntil);
		const justSeconds = secondsUntil % 60;
		const justMinutes = Math.floor(secondsUntil / 60);

		return (justMinutes ? loc("%1 minute", LBeautify(justMinutes)) + ", " : "") + loc("%1 second", LBeautify(justSeconds)) + message;
	}
})
