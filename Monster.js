// Monster represents AI enemies in the game.

game.Monster = new glob.NewGlobType(
{
  GRID_ROW: 3,
},
[
  game.isometricLayout,

  {
    init: function(startingColumn) {
      // FOR DEMO MODE: choose a random avatar.
      this.avatarID = Math.floor(Math.random() * game.spriteSheets.monsters.getCellCount());
      this.gridPos = {row: game.Monster.GRID_ROW, col: startingColumn};
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

    draw: function(ctxt) {
      // at the base of the feet and hearts/shield above the head.
      var x = this.getXforRowCol(this.gridPos.row, this.gridPos.col),
          y = this.getYforRow(this.gridPos.row);

      game.spriteSheets.monsters.drawRegion(ctxt, x, y, this.avatarID, 0.5, 0.67);
    },
  }
]);
