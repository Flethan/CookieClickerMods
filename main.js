if (MagicRegenTweak === undefined) var MagicRegenTweak = {};
MagicRegenTweak.name = 'Magic Regen Tweak';
MagicRegenTweak.version = '1.0';
MagicRegenTweak.GameVersion = '2.043';

// Credit to Klattmose for CCSE and example code

MagicRegenTweak.launch = function () {
	MagicRegenTweak.init = function () {
		MagicRegenTweak.isLoaded = 1;

		MagicRegenTweak.ReplaceNativeGrimoire();

		Game.customStatsMenu.push(function () {
			CCSE.AppendStatsVersionNumber(MagicRegenTweak.name, MagicRegenTweak.version);
		});

		if (Game.prefs.popups) Game.Popup('Magic Regen Tweak loaded!');
		else Game.Notify('Magic Regen Tweak loaded!', '', '', 1, 1);
	}

	//***********************************
	//    Replacement
	//***********************************
	MagicRegenTweak.ReplaceNativeGrimoire = function () {
		var W = Game.Objects['Wizard tower'];
		var M = Game.Objects["Wizard tower"].minigame;
		M.spells['conjure baked goods'].costPercent = 0.2;
		M.logic = function () {
			if (Game.T % 5 == 0) { M.computeMagicM(); }
			M.magicPS = (M.magicM * Math.pow(M.magic + 5.5, 4/3)) / (120000 * (0.5 * M.magicM + M.magic + 8.55));
			M.magic += M.magicPS;
			M.magic = Math.min(M.magic, M.magicM);
			if (Game.T % 5 == 0) {
				for (var i in M.spells) {
					var me = M.spells[i];
					var cost = M.getSpellCost(me);
					l('grimoirePrice' + me.id).innerHTML = Beautify(cost);
					if (M.magic < cost) l('grimoireSpell' + me.id).className = 'grimoireSpell titleFont';
					else l('grimoireSpell' + me.id).className = 'grimoireSpell titleFont ready';
				}
			}
		}
		M.draw = function () {
			//run each draw frame
			if (Game.drawT % 5 == 0) {
				M.magicBarTextL.innerHTML = Math.min(Math.floor(M.magicM), Beautify(M.magic)) + '/' + Beautify(Math.floor(M.magicM)) + (M.magic < M.magicM ? (' (' + loc("+%1/s", Beautify((M.magicPS || 0) * Game.fps, 3)) + ')') : '');
				M.magicBarFullL.style.width = ((M.magic / M.magicM) * 100) + '%';
				M.magicBarL.style.width = (M.magicM * 3) + 'px';
				var secondsUntil = Math.floor((6000 * (M.magicM - M.magic)) / (M.magicM * Math.cbrt(M.magic + 5.7)));
				var justSeconds = secondsUntil % 60;
				var justMinutes = Math.floor(secondsUntil / 60);
				M.infoL.innerHTML = `${secondsUntil ? `${justMinutes ? `${justMinutes} minute${justMinutes === 1 ? '' : 's'}, ` : ''}${justSeconds} second${justSeconds === 1 ? '' : 's'} until your magic is full.` : 'Your magic is full.'}<br></br>` + loc("Spells cast: %1 (total: %2)", [Beautify(M.spellsCast), Beautify(M.spellsCastTotal)]);
			}
			M.magicBarFullL.style.backgroundPosition = (-Game.T * 0.5) + 'px';
		}
	}

	if (CCSE.ConfirmGameVersion(MagicRegenTweak.name, MagicRegenTweak.version, MagicRegenTweak.GameVersion)) Game.registerMod(MagicRegenTweak.name, MagicRegenTweak); // MagicRegenTweak.init();
}


if (!MagicRegenTweak.isLoaded) {
	if (CCSE && CCSE.isLoaded) {
		MagicRegenTweak.launch();
	}
	else {
		if (!CCSE) var CCSE = {};
		if (!CCSE.postLoadHooks) CCSE.postLoadHooks = [];
		CCSE.postLoadHooks.push(MagicRegenTweak.launch);
	}
}