// Monster represents AI enemies in the game.

game.Monster = new glob.NewGlobType(
{
  GRID_ROW: 3,
  MAX_DAMAGE: 3,
},
[
  game.isometricLayout,

  {
    init: function(startingColumn, playerLevel) {
      // FOR DEMO MODE: choose a random avatar.
      this.avatarID = Math.floor(Math.random() * game.spriteSheets.monsters.getCellCount());
      this.gridPos = {row: game.Monster.GRID_ROW, col: startingColumn};
      this.hitCondition = this.generateHitCondition(playerLevel);
      this.advanceChance = Math.floor(Math.random() * 100) + 1;
      this.power = this.computePower(playerLevel);
      

      // HACK: triangular distribution for # of attacks.
      // Since the player has infinite health in the demo,
      // monster attack sizes don't matter.
      this.damage = Math.floor(Math.random() * 6);
      if (this.damage === 5) {
        this.damage = 3;
      }
      else if (this.damage >= 3) {
        this.damage = 2;
      }
      else {
        this.damage = 1;
      }
    },

    getDamage: function() {
      return this.damage;
    },

    getPowerDisplay: function() {
      return "" + this.power;
    },

    setPower: function(newPower) {
      this.power += parseInt(newPower);
    },

    getHitDisplay: function() {
      return this.hitCondition.display;
    },

    getHitCondition: function() {
      return this.hitCondition.condition;
    },

    getRow: function() {
      return this.gridPos.row;
    },

    getCol: function() {
      return this.gridPos.col;
    },

    getAvatarID: function() {
      return this.avatarID;
    },

    getMoveChance: function() {
      return this.advanceChance;
    },

    moveLeft: function() {
      this.gridPos.col -= 1;
    },

    computePower: function(playerLevel) {
      var i = 0,
          power = 0;

      for (i=0; i<playerLevel; ++i) {
        power += Math.floor(Math.random() * (i + 3)) + 1;
      }

      return power;
    },

    generateHitCondition: function(playerLevel) {
      // Hit conditions have a display value and an evaluation value.
      // This allows us to display things like "Odd" and evaluate them
      // against expressions like "% 2 === 1".
      //
      // We use the playerLevel to figure the difficulty of expressions
      // to generate. Theoretically. Eventually. For now, we just pick
      // some easy ones.
      var condition = null,
          display = null,
          value = 0;

      if (Math.random() * 10 < playerLevel) {
        condition = " === ";
        display = "=";
      }
      else {
        condition = " > ";
        display = ">";
      }

      for (playerLevel = playerLevel; playerLevel >= 0; --playerLevel) {
        value += Math.floor(Math.random() * 9) + 1;
      }

      return {display: display + value, condition: condition + value};
    },

    draw: function(ctxt) {
      // at the base of the feet and hearts/shield above the head.
      var x = this.getXforRowCol(this.gridPos.row, this.gridPos.col),
          y = this.getYforRow(this.gridPos.row);

      game.spriteSheets.monsters.drawRegion(ctxt, x, y, this.avatarID, 0.5, 0.67);
    },
  }
]);
