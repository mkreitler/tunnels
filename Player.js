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
  STARTING_WEAPON_POWER: 3,
  STARTING_ARMOR_DEFENSE: 3,
  MAX_POWER_HAND_SIZE: 6,
  MAX_SKILL_HAND_SIZE: 4,
  MAX_SKILL_WEIGHT: 4,  // Easier skills are more heavily weighted in the "deck"

  SKILLS: {
    chain: {name: game.Strings.CHAIN_NAME, desc: game.Strings.CHAIN_DESC, fn: "applyChain"},
    feint: {name: game.Strings.FEINT_NAME, desc: game.Strings.FEINT_DESC, fn: "applyFeint"},
    combo: {name: game.Strings.COMBO_NAME, desc: game.Strings.COMBO_DESC, fn: "applyCombo"},
    deflect: {name: game.Strings.DEFLECT_NAME, desc: game.Strings.DEFLECT_DESC, fn: "applyDeflect"},
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

      this.playerClass = "Fighter";

      this.playerWeapon = {name: game.Strings.STARTING_WEAPON_NAME, power: game.Player.STARTING_WEAPON_POWER};
      this.playerArmor = {name: game.Strings.STARTING_ARMOR_NAME, defense: game.Player.STARTING_ARMOR_DEFENSE};

      this.currentAttack = 0;
      this.currentDefense = 0;

      this.powerHand = [];
      this.skillHand = [];

      this.attackInfoPanel = null;
      this.defenseInfoPanel = null;
    },

    buildAttackInfoPanel: function() {
      var label = null,
          icon = null;

      label = new glob.GUI.Label({
        x: game.spriteSheets.combatPanels.getCellWidth() / 2,
        y: game.spriteSheets.combatPanels.getCellHeight() / 2,
        font: game.res.numFont,
        fontSize: game.Tunnels.INFO_PANEL_FONT_SIZE,
        text: "3",
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

      this.attackInfoPanel = new glob.GUI.Panel({
        spriteSheet: game.spriteSheets.combatPanels,
        frameIndex: 1,
        x: Math.round(this.getXforRowCol(this.playerPos.row, this.playerPos.col) - game.spriteSheets.combatPanels.getCellWidth() / 2),
        y: game.Tunnels.GUI_LOW_PANEL_TOP,
        data: {label: label, icon: icon}
      });

      this.attackInfoPanel.addChild(label, true);
      this.attackInfoPanel.addChild(icon, true);
    },

    buildDefenseInfoPanel: function() {
      var label = null,
          icon = null;

      label = new glob.GUI.Label({
        x: game.spriteSheets.combatPanels.getCellWidth() / 2,
        y: game.spriteSheets.combatPanels.getCellHeight() / 2,
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
        data: {label: label, icon: icon},
      });

      this.defenseInfoPanel.addChild(label, true);
      this.defenseInfoPanel.addChild(icon, true);
    },

    startSession: function() {
      var i = 0;

      this.buildAttackInfoPanel();
      this.buildDefenseInfoPanel();

      for (i=0; i<game.Player.MAX_POWER_HAND_SIZE; ++i) {
        this.powerHand.push(null);
      }

      for (i=0; i<game.Player.MAX_SKILL_HAND_SIZE; ++i) {
        this.skillHand.push(null);
      }
    },

    startRound: function() {
      // TODO: apply status effects.
      var nCards = 0;

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
          nSkills = this.countSkills(),
          i = 0;

      for (i=0; i<nSkills; ++i) {
        totalWeight += curWeight;
        curWeight -= 1;
        curWeight = Math.max(1, curWeight);
      }

      chosenWeight = Math.floor(Math.random() * totalWeight);
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

    dealSkillHand: function(nCards) {
      var i = 0,
          value = 0,
          nSkillHandSize = 0;

      nSkillHandSize = glob.Util.compressArray(this.skillHand);

      for(i=0; i<nCards; ++i) {
        value = this.getSkillValue();
        this.skillHand[nSkillHandSize + i] = new glob.GUI.Panel({
          spriteSheet: game.spriteSheets.skillCards,
          frameIndex: value,
          bDraggable: true,
          x: this.curStackLeftEdge,
          y: game.Tunnels.GUI_CARD_ROW_TOP,
          mouseDelegate: this.sessionManager,
          data: {card: this, cardType: game.CARD_TYPE.SKILL, value: value},
    //   onMouseDownSound:,
    //   onMouseUpSound:,
        });

        this.curStackLeftEdge += Math.round(game.spriteSheets.skillCards.getCellWidth() * (1 + game.Tunnels.CARD_SPACING_X));
      }
    },

    dealPowerHand: function(nCards) {
      var i = 0,
          value = 0,
          nPowerHandSize = 0;

      nPowerHandSize = glob.Util.compressArray(this.powerHand);

      for(i=0; i<nCards; ++i) {
        value = Math.round(Math.random() * this.powerLevel) + 1;

        this.powerHand[nPowerHandSize + i] = new glob.GUI.Panel({
          spriteSheet: game.spriteSheets.powerCards,
          frameIndex: value,
          bDraggable: true,
          x: this.curStackLeftEdge,
          y: game.Tunnels.GUI_CARD_ROW_TOP,
          mouseDelegate: this.sessionManager,
          data: {card: this, cardType: game.CARD_TYPE.POWER, value: value},
    //   onMouseDownSound:,
    //   onMouseUpSound:,
        });

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

      glob.assert(this.defenseInfoPanel, "Can't draw invalid defenseInfoPanel!");
      glob.assert(this.attackInfoPanel, "Can't draw invalid attackInfoPanel!");

      this.defenseInfoPanel.draw(ctxt);
      this.attackInfoPanel.draw(ctxt);

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
