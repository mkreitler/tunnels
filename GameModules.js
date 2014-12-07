// Repository for game-specific modules.

game.isometricLayout = {
  isLongRow: function(row) {
    return row % 2 === 0;
  },

  getXforRowCol: function(row, col) {
    var bLongRow = this.isLongRow(row),
        x = 0;

    if (bLongRow) {
      x = (row % 2 + 1 / 2) * game.Tunnel.FLOOR_TILE_WIDTH + col * game.Tunnel.FLOOR_TILE_WIDTH;
    }
    else {
      x = game.Tunnel.FLOOR_TILE_WIDTH + col * game.Tunnel.FLOOR_TILE_WIDTH;
    }

    return x;
  },

  getYforRow: function(row) {
    return (row + 1) * game.Tunnel.FLOOR_TILE_HEIGHT / 2 + glob.Graphics.getHeight() * game.Tunnels.ISO_HEIGHT_FLOOR_OFFSET;
  },
};

