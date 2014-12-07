// Player represents a human player in the game.

game.Player = new glob.NewGlobType(
{
  PLAYER_ID: {SOLO: 0,
              TEAM_LOCAL: 1,
              TEAM_REMOTE: 2},

  PLAYER_POS: {"0": {row: 3, col: 2},
               "1": {row: 5, col: 2},
               "2": {row: 1, col: 2}},
},
[
  game.isometricLayout,

  {
    init: function(playerNum) {
      // FOR DEMO MODE: choose a random avatar.
      this.avatarID = Math.floor(Math.random() * game.spriteSheets.heroes.getCellCount());
      this.playerPos = {row: game.Player.PLAYER_POS[playerNum].row, col: game.Player.PLAYER_POS[playerNum].col};
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
  }
]);
