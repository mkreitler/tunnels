// Player represents a human player in the game.

game.Player = new glob.NewGlobType(
{
  PLAYER_ID: {SOLO: 0,
              TEAM_LOCAL: 1,
              TEAM_REMOTE: 2},

  PLAYER_POS: {"0": {row: 3, col: 2},
               "1": {row: 5, col: 2},
               "2": {row: 1, col: 2}},

  STARTING_POWER_HAND_SIZE: 3,
  STARTING_SKILL_HAND_SIZE: 1,
  STARTING_POWER_LEVEL: 3,
  STARTING_SKILL_LEVEL: 1,
  MAX_POWER_HAND_SIZE: 6,
  MAX_SKILL_HAND_SIZE: 4,
  MAX_POWER_LEVEL: 9,
  MAX_SKILL_LEVEL: 4,   // Currently. We should add more later.
  MAX_SKILL_WEIGHT: 4,  // Easier skills are more heavily weighted in the "deck"

  SKILLS: {
    chain: {name: game.Strings.CHAIN_NAME, desc: game.Strings.CHAIN_DESC, fn: " + "},
    feint: {name: game.Strings.FEINT_NAME, desc: game.Strings.FEINT_DESC, fn: " - "},
    combo: {name: game.Strings.COMBO_NAME, desc: game.Strings.COMBO_DESC, fn: " * "},
    deflect: {name: game.Strings.DEFLECT_NAME, desc: game.Strings.DEFLECT_DESC, fn: " / "},
  },

  WEAPONS: {
    SHORT_SWORD: {name: game.Strings.WEAPON_SHORT_SWORD, power: 3},
  },

  ARMOR: {
    LEATHERS: {name: game.Strings.ARMOR_LEATHERS, defense: 3},
  },

  SKILL_ORDER: {
    Fighter: ["chain", "feint", "combo", "deflect"],
  }
},
[
  glob.Listeners,
  game.isometricLayout,

  {
    init: function(playerNum, sessionManager) {
      // FOR DEMO MODE: choose a random avatar.
      this.avatarID = Math.floor(Math.random() * game.spriteSheets.heroes.getCellCount());
      this.playerPos = {row: game.Player.PLAYER_POS[playerNum].row, col: game.Player.PLAYER_POS[playerNum].col};
      this.sessionManager = sessionManager;

      this.powerHandSize = game.Player.STARTING_POWER_HAND_SIZE;
      this.skillHandSize = game.Player.STARTING_SKILL_HAND_SIZE;
      this.powerLevel = game.Player.STARTING_POWER_LEVEL;
      this.skillLevel = game.Player.STARTING_SKILL_LEVEL;

      this.curStackLeftEdge = 0;

      this.job = "Fighter";

      this.currentWeapon = game.Player.WEAPONS.SHORT_SWORD;
      this.currentArmor = game.Player.ARMOR.LEATHERS;

      this.currentAttack = 0;
      this.currentDefense = 0;
      this.bDefended = false;

      this.powerHand = [];
      this.skillHand = [];

      this.attackInfoPanel = null;
      this.defenseInfoPanel = null;
    },

    getLevel: function() {
      return this.skillLevel;
    },

    getDefenseCondition: function() {
      return this.currentDefense + ">";
    },

    removeCards: function(skillCard, powerCard) {
      skillCard.data.card = null;
      powerCard.data.card = null;
      skillCard.destroy();
      powerCard.destroy();
    },

    resolvePlayerAction: function(player, tunnel, skillCard, powerCard) {
      // The player is buffing his own attack.

      // First, we update the player's currentAttack.
      var expression = null,
          exprVal = null,
          floored = 0,
          target = null;

      expression = "" + this.currentAttack + skillCard.data.value.fn + powerCard.data.value;
      exprVal = eval(expression); // Yes, eval() is evil, but I'm too crunched to write my own mini math parser right now...
      floored = Math.floor(exprVal);
      target = null;

      // TODO: something special with the difference between the rounded and whole answers?

      this.currentAttack = parseInt(floored);
      this.attackInfoPanel.data.label.setText("" + floored);

      // Check for desired result. Ask the tunnel for the target expression.
      target = tunnel.getMonsterHitCondition();

      return (eval("" + this.currentAttack + target)) ? game.Tunnels.RESULT.MONSTER_DEFEATED : game.Tunnels.RESULT.MONSTERS_ADVANCE;
    },

    buildAttackInfoPanel: function() {
      var label = null,
          icon = null,
          x = 0,
          y = 0;

      x = game.spriteSheets.combatPanels.getCellWidth() / 2;
      y = game.spriteSheets.combatPanels.getCellHeight() / 2;
      label = new glob.GUI.Label({
        x: x,
        y: y,
        font: game.res.numFont,
        fontSize: game.Tunnels.INFO_PANEL_FONT_SIZE,
        text: "0",
        activeColor: glob.Graphics.RED,
        selectedColor: glob.Graphics.RED,
        onClickedCallback: null,
        hAlign: 0.5,
        vAlign: 1.0
      });

      icon = new glob.GUI.Panel({
        spriteSheet: game.spriteSheets.combatIcons,
        frameIndex: game.Tunnel.COMBAT_ICON.SWORD,
        x: game.spriteSheets.combatPanels.getCellWidth() / 2 - game.spriteSheets.combatIcons.getCellWidth() / 2,
        y: game.spriteSheets.combatPanels.getCellHeight() - game.spriteSheets.combatIcons.getCellHeight() * (1 + game.Tunnel.COMBAT_ICON_VMARGIN),
      });

      x = Math.round(this.getXforRowCol(this.playerPos.row, this.playerPos.col) - game.spriteSheets.combatPanels.getCellWidth() / 2);
      y = game.Tunnels.GUI_LOW_PANEL_TOP;
      this.attackInfoPanel = new glob.GUI.Panel({
        spriteSheet: game.spriteSheets.combatPanels,
        frameIndex: 1,
        x: x,
        y: y,
        data: {label: label, icon: icon, bIsPlayerStack: true,
               cardPos: [{x: x + game.spriteSheets.combatPanels.getCellWidth() * (1 + game.Tunnels.CARD_SPACING_X), y:y + game.Tunnels.GUI_CARD_TO_INFO_OFFSET_Y},
                         {x: x + game.spriteSheets.combatPanels.getCellWidth() * (1 + game.Tunnels.CARD_SPACING_X) + game.spriteSheets.skillCards.getCellWidth() * (1 + game.Tunnels.CARD_SPACING_X), y:y + game.Tunnels.GUI_CARD_TO_INFO_OFFSET_Y}],
                         resolvePlayerAction: this.resolvePlayerAction.bind(this)
        }
      });

      this.attackInfoPanel.addChild(label, true);
      this.attackInfoPanel.addChild(icon, true);
    },

    buildDefenseInfoPanel: function() {
      var label = null,
          icon = null;

      label = new glob.GUI.Label({
        x: game.spriteSheets.combatPanels.getCellWidth() / 2,
        y: 7 * game.spriteSheets.combatPanels.getCellHeight() / 12,
        font: game.res.numFont,
        fontSize: game.Tunnels.INFO_PANEL_FONT_SIZE,
        text: "3",
        activeColor: glob.Graphics.WHITE,
        selectedColor: glob.Graphics.WHITE,
        onClickedCallback: null,
        hAlign: 0.5,
        vAlign: 1.0
      });

      icon = new glob.GUI.Panel({
        spriteSheet: game.spriteSheets.combatIcons,
        frameIndex: game.Tunnel.COMBAT_ICON.BROKEN_SHIELD,
        x: game.spriteSheets.combatPanels.getCellWidth() / 2 - game.spriteSheets.combatIcons.getCellWidth() / 2,
        y: game.spriteSheets.combatIcons.getCellHeight() * (game.Tunnel.COMBAT_ICON_VMARGIN),
      });

      this.defenseInfoPanel = new glob.GUI.Panel({
        spriteSheet: game.spriteSheets.combatPanels,
        frameIndex: 2,
        x: Math.round(this.getXforRowCol(this.playerPos.row, this.playerPos.col) - game.spriteSheets.combatPanels.getCellWidth() / 2),
        y: game.Tunnels.GUI_HIGH_PANEL_TOP,
        data: {label: label, icon: icon, bIsPlayerStack: true},
      });

      this.defenseInfoPanel.addChild(label, true);
      this.defenseInfoPanel.addChild(icon, true);
    },

    startSession: function() {
      // What to do, here?
    },

    allowDefensivePlays: function() {
      return skillLevel > game.Player.SKILL_ORDER.indexOf("feint");
    },

    hideUpperPanel: function() {
      this.defenseInfoPanel.hide();
    },

    showUpperPanel: function() {
      this.defenseInfoPanel.show();
    },

    startRound: function(bAllowDefensivePlays) {
      // TODO: apply status effects.
      var nCards = 0;

      if (!this.attackInfoPanel) {
        this.buildAttackInfoPanel();
      }
      if (!this.defenseInfoPanel) {
        this.buildDefenseInfoPanel();
      }

      if (!bAllowDefensivePlays) {
        this.hideUpperPanel();
      }
      else {
        this.showUpperPanel();
      }

      this.attackInfoPanel.data.label.setText("" + this.currentAttack);
      this.defenseInfoPanel.data.label.setText(this.getDefenseCondition());

      this.curStackLeftEdge = game.Tunnels.GUI_CARD_ROW_LEFT;

      // Give the player new skill cards, if necessary.
      nCards = this.countCards(false);
      if (nCards < this.skillHandSize) {
        this.dealSkillHand(this.skillHandSize - nCards);
      }

      nCards = this.countCards(true);
      if (nCards < this.powerHandSize) {
        this.dealPowerHand(this.powerHandSize - nCards);
      }

      this.arrangeHands();
    },

    levelUp: function() {
      var message = null,
          oldPower = this.powerLevel,
          oldSkill = this.skillLevel;

      if (this.skillLevel === game.Player.MAX_SKILL_LEVEL) {
        this.powerLevel += 1;
        if (this.powerLevel % 2) {
          this.powerHandSize += 1;
        }
      }
      else if (this.powerLevel < this.skillLevel) {
        this.powerLevel += 1;
        if (this.powerLevel % 2) {
          this.powerHandSize += 1;
        }
      }
      else {
        this.skillLevel += 1;
        if (this.skillHandSize % 2 === 0) {
          this.skillHandSize += 1;
        }
      }

      this.powerLevel = Math.min(this.powerLevel, game.Player.MAX_POWER_LEVEL);
      this.skillLevel = Math.min(this.skillLevel, game.Player.MAX_SKILL_LEVEL);
      this.powerHandSize = Math.min(this.powerHandSize, game.Player.MAX_POWER_HAND_SIZE);
      this.skillHandSize = Math.min(this.skillHandSize, game.Player.MAX_SKILL_HAND_SIZE);

      if (this.powerLevel > oldPower) {
        message = game.Strings.POWER_LEVEL_UP_MSG + this.powerLevel + "!";
      }
      else if (this.skillLevel > oldSkill) {
        message = game.Strings.SKILL_LEVEL_UP_MSG + this.skillLevel + "!";
      }

      return message;
    },

    highlightCardDestinations: function() {
      this.attackInfoPanel.showBounds(glob.Graphics.RED, game.Tunnels.HIGHLIGHT_WIDTH);
    },

    clearCardDestinations: function() {
      this.attackInfoPanel.hideBounds();
    },

    cardIntersectsAttackWidget: function(card) {
      var result = null;

      if (glob.Math.clip(card.getBoundsRef(), this.attackInfoPanel.getBoundsRef())) {
        result = this.attackInfoPanel;
      }

      return result;
    },

    countSkills: function() {
      var nSkills = 0,
          key = null;

      for (key in game.Player.SKILLS) {
        nSkills++;
      }

      return nSkills;
    },

    getSkillValue: function() {
      // Randomly chooses a skill from a weighted list.
      var totalWeight = 0,
          curWeight = game.Player.MAX_SKILL_WEIGHT,
          value = -1,
          chosenWeight = 0,
          maxWeight = 0,
          nSkills = this.countSkills(),
          i = 0;

      for (i=0; i<nSkills; ++i) {
        totalWeight += curWeight;
        curWeight -= 1;
        curWeight = Math.max(1, curWeight);
      }

      curWeight = game.Player.MAX_SKILL_WEIGHT;
      for (i=0; i<this.skillLevel; ++i) {
        maxWeight += curWeight;
        curWeight -= 1;
        curWeight = Math.max(1, curWeight);
      }

      chosenWeight = Math.floor(Math.random() * maxWeight);
      curWeight = game.Player.MAX_SKILL_WEIGHT;
      for (i=0; i<nSkills; ++i) {
        if (chosenWeight - curWeight < 0) {
          value = i;
          break;
        }

        chosenWeight -= curWeight;
        curWeight -= 1;
        curWeight = Math.max(1, curWeight);
      }

      return value;
    },

    removeSkillCardFromHand: function(card) {
      glob.assert(this.skillHand.indexOf(card) >= 0, "Can't find card in skill hand!");

      glob.Util.erase(this.skillHand, card);
    },

    removePowerCardFromHand: function(card) {
      glob.assert(this.powerHand.indexOf(card) >= 0, "Can't find card in power hand!");

      glob.Util.erase(this.powerHand, card);
    },

    arrangeHands: function() {
      var y = 0,
          i = 0,
          nCards = 0;

      this.curStackLeftEdge = game.Tunnels.GUI_CARD_ROW_LEFT;
      nCards = glob.Util.compressArray(this.skillHand);
      y = game.Tunnels.GUI_CARD_ROW_TOP;

      for (i=0; i<nCards; ++i) {
        this.skillHand[i].setPos(this.curStackLeftEdge, y);
        this.curStackLeftEdge += Math.round(game.spriteSheets.skillCards.getCellWidth() * (1 + game.Tunnels.CARD_SPACING_X));
      }

      nCards = glob.Util.compressArray(this.powerHand);
      for (i=0; i<nCards; ++i) {
        this.powerHand[i].setPos(this.curStackLeftEdge, y);
        this.curStackLeftEdge += Math.round(game.spriteSheets.powerCards.getCellWidth() * (1 + game.Tunnels.CARD_SPACING_X));
      }
    },

    dealSkillHand: function(nCards) {
      var i = 0,
          x = 0,
          y = 0,
          value = 0,
          nSkillHandSize = 0;

      nSkillHandSize = glob.Util.compressArray(this.skillHand);

      for(i=0; i<nCards; ++i) {
        value = this.getSkillValue();
        x = this.curStackLeftEdge;
        y = game.Tunnels.GUI_CARD_ROW_TOP;
        skillKey = game.Player.SKILL_ORDER[this.job][value];
        skillObj = game.Player.SKILLS[skillKey];

        this.skillHand[nSkillHandSize + i] = new glob.GUI.Panel({
          spriteSheet: game.spriteSheets.skillCards,
          frameIndex: value,
          bDraggable: true,
          x: x,
          y: y,
          mouseDelegate: this.sessionManager,
          data: {card: null, cardType: game.CARD_TYPE.SKILL, value: skillObj, startPos: {x:x, y:y}},
    //   onMouseDownSound:,
    //   onMouseUpSound:,
        });

        this.skillHand[nSkillHandSize + i].data.card = this.skillHand[nSkillHandSize + i];
        this.curStackLeftEdge += Math.round(game.spriteSheets.skillCards.getCellWidth() * (1 + game.Tunnels.CARD_SPACING_X));
      }
    },

    dealPowerHand: function(nCards) {
      var i = 0,
          x = 0,
          y = 0,
          value = 0,
          nPowerHandSize = 0;

      nPowerHandSize = glob.Util.compressArray(this.powerHand);

      for(i=0; i<nCards; ++i) {
        value = Math.round(Math.random() * this.powerLevel) + 1;
        x = this.curStackLeftEdge;
        y = game.Tunnels.GUI_CARD_ROW_TOP;

        this.powerHand[nPowerHandSize + i] = new glob.GUI.Panel({
          spriteSheet: game.spriteSheets.powerCards,
          frameIndex: value,
          bDraggable: true,
          x: x,
          y: y,
          mouseDelegate: this.sessionManager,
          data: {card: this, cardType: game.CARD_TYPE.POWER, value: value, startPos: {x:x, y:y}},
    //   onMouseDownSound:,
    //   onMouseUpSound:,
        });

        this.powerHand[nPowerHandSize + i].data.card = this.powerHand[nPowerHandSize + i];
        this.curStackLeftEdge += Math.round(game.spriteSheets.powerCards.getCellWidth() * (1 + game.Tunnels.CARD_SPACING_X));
      }
    },

    countCards: function(bPowerHand) {
      var i = 0,
          nCards = 0;

      if (bPowerHand) {
        for (i=0; i<this.powerHand.length; ++i) {
          if (this.powerHand[i]) {
            nCards += 1;
          }
        }
      }
      else {
        for (i=0; i<this.skillHand.length; ++i) {
          if (this.skillHand[i]) {
            nCards += 1;
          }
        }
      }

      return nCards;
    },

    getRow: function() {
      return this.playerPos.row;
    },

    getCol: function() {
      return this.playerPos.col;
    },

    getAvatarID: function() {
      return this.avatarID;
    },

    onNewMonster: function() {
      this.currentAttack = Math.floor(Math.random() * this.currentWeapon.power) + 1;
      this.currentDefense = this.currentArmor.defense;

      this.bDefended = false;
    },

    onNewRoom: function() {
      this.onNewMonster();
    },

    defended: function() {
      return this.bDefended;
    },

    setDefended: function(bDefended) {
      this.bDefended = bDefended
    },

    draw: function(ctxt) {
      // TODO: draw player-related UI elements like the selection tile
      // at the base of the feet and hearts/shield above the head.
      var x = this.getXforRowCol(this.playerPos.row, this.playerPos.col),
          y = this.getYforRow(this.playerPos.row);

      game.spriteSheets.heroes.drawRegion(ctxt, x, y, this.avatarID, 0.5, 0.67);
    },

    drawGUI: function(ctxt) {
      // Draws GUI elements related to the player:
      // 1) Skill cards
      // 2) Power cards
      // 3) Player attack panel
      // 4) Player defense panel
      var i = 0;

      if (this.attackInfoPanel) {
        this.attackInfoPanel.draw(ctxt);
      }

      if (this.defenseInfoPanel) {
        this.defenseInfoPanel.draw(ctxt);
      }

      for (i=0; i<this.skillHand.length; ++i) {
        if (this.skillHand[i]) {
          this.skillHand[i].draw(ctxt);
        }
      }

      for (i=0; i<this.powerHand.length; ++i) {
        if (this.powerHand[i]) {
          this.powerHand[i].draw(ctxt);
        }
      }
    }
  }
]);
