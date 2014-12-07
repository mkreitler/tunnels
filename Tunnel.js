// Locales are the gaming environment.

game.Tunnel = new glob.NewGlobType(
{
  BACK_PANEL_TOP_HEIGHT_FACTOR: 7 / 10,
	FLOOR_TILE_WIDTH: 64,
  FLOOR_TILE_HEIGHT: 32,
  FLOOR_ROWS: 7,
  FLOOR_COLS_LONG: 16,
  FLOOR_COLS_SHORT: 15,
  FLOOR_TILE_INDEX: 20,
  MAX_FEATURES_PER_REGION: 3,
  MID_COL_RIGHT: 11,
  MID_COL_LEFT: 7,
  TOP_GRADIENT_COLOR_0: "#a0a0a0",
  TOP_GRADIENT_COLOR_1: "#000000",
  BOTTOM_GRADIENT_COLOR_0: "#007e00",
  BOTTOM_GRADIENT_COLOR_1: "#003c00",
  MONSTERS_PER_ROOM: 3,
  MAX_ATTACK_ICONS: 3,
  COMBAT_ICON_SPACING: 1.1,
  COMBAT_ICON_VMARGIN: 0.2,

  COMBAT_ICON: {
    SWORD: 0,
    CLAW: 1,
    BROKEN_SHIELD: 2,
    SHIELD: 3
  },

},
[
  glob.Listeners,
  game.isometricLayout,

  {
    init: function(player) {
      var iRow = 0,
          iCol = 0;

      this.backBuffer = this.renderBackground();
      this.floorBuffer = this.renderFloor();

      this.attackInfoPanel = null;
      this.defenseInfoPanel = null;
    },

    startSession: function(player) {
      this.buildGrid();

      this.placePlayer(player);
      this.placeFeatures();
      this.placeMonsters();

      this.buildAttackInfoPanel();
      this.buildDefenseInfoPanel();
    },

    buildAttackInfoPanel: function() {
      var monster = this.monsters[0],
          i = 0,
          icons = [],
          label = null;

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


      for (i=0; i<game.Tunnel.MAX_ATTACK_ICONS; ++i) {
        icons.push(new glob.GUI.Panel({
          spriteSheet: game.spriteSheets.combatIcons,
          frameIndex: game.Tunnel.COMBAT_ICON.CLAW,
          x: game.spriteSheets.combatPanels.getCellWidth() / 2 - game.spriteSheets.combatIcons.getCellWidth() / 2 + (i - 1) * game.spriteSheets.combatIcons.getCellWidth() * game.Tunnel.COMBAT_ICON_SPACING,
          y: game.spriteSheets.combatIcons.getCellHeight() * (game.Tunnel.COMBAT_ICON_VMARGIN),
        }));
      }

      this.attackInfoPanel = new glob.GUI.Panel({
        spriteSheet: game.spriteSheets.combatPanels,
        frameIndex: 3,
        x: Math.round(this.getXforRowCol(monster.getRow(), monster.getCol()) - game.spriteSheets.combatPanels.getCellWidth() / 2),
        y: game.Tunnels.GUI_HIGH_PANEL_TOP,
        data: {panel: this, icons: icons, label: label}
      });

      this.attackInfoPanel.addChild(label, true);

      for (i=0; i<icons.length; ++i) {
        this.attackInfoPanel.addChild(icons[i], true);
      }
    },

    buildDefenseInfoPanel: function() {
      var monster = this.monsters[0],
          icon = null,
          label = null;

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
        frameIndex: game.Tunnel.COMBAT_ICON.SHIELD,
        x: game.spriteSheets.combatPanels.getCellWidth() / 2 - game.spriteSheets.combatIcons.getCellWidth() / 2,
        y: game.spriteSheets.combatPanels.getCellHeight() - game.spriteSheets.combatIcons.getCellHeight() * (1 + game.Tunnel.COMBAT_ICON_VMARGIN),
      });
      
      this.defenseInfoPanel = new glob.GUI.Panel({
        spriteSheet: game.spriteSheets.combatPanels,
        frameIndex: 0,
        x: Math.round(this.getXforRowCol(monster.getRow(), monster.getCol()) - game.spriteSheets.combatPanels.getCellWidth() / 2),
        y: game.Tunnels.GUI_LOW_PANEL_TOP,
        data: {panel: this, icon: icon, label: label}
      });

      this.defenseInfoPanel.addChild(label, true);
      this.defenseInfoPanel.addChild(icon, true);
    },

    startRound: function() {
      // TODO: stuff.
    },

    getBackgroundBuffer: function() {
      return this.backBuffer;
    },

    update: function(dt) {
      // Nothing to do here...yet.
    },

    draw: function(ctxt) {
      // Display the background.
      glob.Graphics.lock();

      glob.Graphics.copyFrom(this.backBuffer);
      glob.Graphics.copyFrom(this.floorBuffer, 0, glob.Graphics.getHeight() * game.Tunnels.ISO_HEIGHT_FLOOR_OFFSET);

      this.renderGrid(ctxt);

      glob.Graphics.unlock();
    },

    drawGUI: function(ctxt) {
      // TODO: Draw monster GUI elements here.
      glob.assert(this.attackInfoPanel, "Can't draw undefined attackInfoPanel!");
      glob.assert(this.defenseInfoPanel, "Can't draw undefined defenseInfoPanel!");

      this.attackInfoPanel.draw(ctxt);
      this.defenseInfoPanel.draw(ctxt);
    },

    // Implementation =========================================================
    buildGrid: function() {
      var row = 0,
          col = 0;

      this.grid = [];

      // Clear the grid.
      for (row=0; row<game.Tunnel.FLOOR_ROWS; ++row) {
        this.grid.push([]);
        for (col=0;col<game.Tunnel.FLOOR_COLS_LONG; ++col) {
          this.grid[row].push({isEmpty: true, contains: null});
        }
      }
    },

    // Call this when generating a new room.
    clearGrid: function() {
      var iRow = 0,
          iCol = 0;

      for (iRow=0; iRow<this.grid.length; ++iRow) {
        for (iColc=0; iCol<this.grid[iRow].length; ++iCol) {
          this.grid[iRow][iCol].isEmpty = true;
          this.grid[iRow][iCol].contains = null;
        }
      }
    },

    // Call when generating a new room.
    clearMonsters: function() {
      while(this.monsters.length) {
        this.monster.pop();
      }
    },

    placePlayer: function(player) {
      var row = player.getRow(),
          col = player.getCol();

      this.grid[row][col].isEmpty = false;
      this.grid[row][col].contains = {player: player};
    },

    placeMonsters: function() {
      var i = 0,
          col = -1;

      if (!this.monsters) {
        this.monsters = [];
      }

      for (i=game.Tunnel.MONSTERS_PER_ROOM - 1; i>game.Tunnel.MONSTERS_PER_ROOM - 4; --i) {
        col = game.Tunnel.FLOOR_COLS_SHORT - 2 - i;
        this.monsters.push(new game.Monster(col));
        this.grid[game.Monster.GRID_ROW][col].isEmpty = false;
        this.grid[game.Monster.GRID_ROW][col].contains = {monster: this.monsters[this.monsters.length - 1]};
      }
    },

    placeFeatures: function() {
      var iRegion = 0,
          iTries = 0,
          row = 0,
          col = 0,
          bLongRow = false;

      // i, we place features in 3 places:
      // 1) The far left,
      // 2) The center,
      // 3) The far right.
      //
      // We flip two coins in each region and place
      // a feature for each 'heads' result.
      for (iRegion=0; iRegion<3; ++iRegion) {
        for (iTries=0; iTries<game.Tunnel.MAX_FEATURES_PER_REGION; ++iTries) {
          if (Math.random() < 0.5) {

            row = Math.floor(Math.random() * game.Tunnel.FLOOR_ROWS);

            if (row === 2) {
                row = Math.round(Math.random());
            }
            else if (row === 4) {
                row = game.Tunnel.FLOOR_ROWS - 1 - Math.round(Math.random());
            }
            else if (row === 3) {
              if (Math.random() < 0.5) {
                row = Math.round(Math.random());
              }
              else {
                row = game.Tunnel.FLOOR_ROWS - 1 - Math.round(Math.random());
              }
            }

            switch (iRegion) {
              case 0:
                col = Math.floor(Math.random() * 2);
              break;

              case 1:
                col = Math.floor(Math.random() * (game.Tunnel.MID_COL_RIGHT - game.Tunnel.MID_COL_LEFT)) + game.Tunnel.MID_COL_LEFT;
                if (!this.isLongRow(row) && col === game.Tunnel.MID_COL_LEFT) {
                  col = Math.round((game.Tunnel.MID_COL_LEFT + game.Tunnel.MID_COL_RIGHT) / 2);
                }
              break;

              case 2:
                col = Math.floor(Math.random() * 2);
                if (this.isLongRow(row)) {
                  col = game.Tunnel.FLOOR_COLS_LONG - col - 1;
                }
                else {
                  col = game.Tunnel.FLOOR_COLS_LONG - col - 2;
                }
              break;
            }

            if (this.grid[row][col].isEmpty) {
              this.grid[row][col].isEmpty = false;
              this.grid[row][col].contains = {feature: true, ID: Math.floor(Math.random() * game.spriteSheets.features.getCellCount())};
            }
          }
        }
      }
    },

    renderGrid: function(ctxt) {
      var iRow = 0,
          iCol = 0;

      for (iRow=0; iRow<game.Tunnel.FLOOR_ROWS; ++iRow) {
        for (iCol=0; iCol<game.Tunnel.FLOOR_COLS_LONG; ++iCol) {
          if (!this.grid[iRow][iCol].isEmpty) {
            if (this.grid[iRow][iCol].contains.feature) {
              game.spriteSheets.features.drawRegion(ctxt, this.getXforRowCol(iRow, iCol),
                                                          this.getYforRow(iRow),
                                                          this.grid[iRow][iCol].contains.ID, 0.5, 0.5);
            }
            else if (this.grid[iRow][iCol].contains.player) {
              this.grid[iRow][iCol].contains.player.draw(ctxt);
            }
            else if (this.grid[iRow][iCol].contains.monster) {
              this.grid[iRow][iCol].contains.monster.draw(ctxt);
            }
          }
        }
      }
    },

    renderFloor: function() {
      // 7 rows of isometric tiles.
      var floorBuffer = glob.Graphics.createOffscreenBuffer(game.Tunnel.FLOOR_COLS_LONG * game.Tunnel.FLOOR_TILE_WIDTH,
                                                            game.Tunnel.FLOOR_ROWS * game.Tunnel.FLOOR_TILE_HEIGHT),
          ctxt = floorBuffer.getContext('2d'),
          iRow = 0,
          iCol = 0,
          x = 0,
          y = 0;

      for (iRow=0; iRow<game.Tunnel.FLOOR_ROWS; ++iRow) {
         y = this.getYforRow(iRow);

        for (iCol=0; iCol < (this.isLongRow(iRow) ? game.Tunnel.FLOOR_COLS_LONG : game.Tunnel.FLOOR_COLS_SHORT); ++iCol) {
          x = this.getXforRowCol(iRow, iCol);

          game.spriteSheets.floor.drawRegion(ctxt, x, y - glob.Graphics.getHeight() * game.Tunnels.ISO_HEIGHT_FLOOR_OFFSET, game.Tunnel.FLOOR_TILE_INDEX, 0.5, 0.5);
        }
      }

      return floorBuffer;
    },

    renderBackground: function() {
      var backBuffer = glob.Graphics.createOffscreenBuffer(),
          ctxt = backBuffer.getContext('2d'),
          yStart = 0,
          yEnd = glob.Graphics.getHeight() * game.Tunnels.ISO_HEIGHT_FLOOR_OFFSET + game.Tunnel.FLOOR_ROWS / 2 * game.Tunnel.FLOOR_TILE_HEIGHT,
          grd = ctxt.createLinearGradient(0, yStart, 0, yEnd);

      glob.Graphics.clearTo(glob.Graphics.BLACK, ctxt);

      grd.addColorStop(0, game.Tunnel.TOP_GRADIENT_COLOR_0);
      grd.addColorStop(1, game.Tunnel.TOP_GRADIENT_COLOR_1);

      // Gradient fill, upper screen.
      ctxt.beginPath();
      ctxt.fillStyle = grd;
      ctxt.fillRect(0, yStart, glob.Graphics.getWidth(), yEnd);
      ctxt.closePath();

      // Gradient fill, lower screen.
      yEnd = glob.Graphics.getHeight() * game.Tunnel.BACK_PANEL_TOP_HEIGHT_FACTOR;
      grd = ctxt.createLinearGradient(0, yEnd, 0, glob.Graphics.getHeight());
      grd.addColorStop(0, game.Tunnel.BOTTOM_GRADIENT_COLOR_0);
      grd.addColorStop(1, game.Tunnel.BOTTOM_GRADIENT_COLOR_1);
      ctxt.beginPath();
      ctxt.fillStyle = grd;
      ctxt.fillRect(0, yEnd, glob.Graphics.getWidth(), glob.Graphics.getHeight());
      ctxt.closePath();

      // Alpha fill, message region.
      ctxt.beginPath();
      ctxt.fillStyle = game.Tunnels.GUI_MESSAGE_PANEL_ALPHA;
      ctxt.fillRect(0, game.Tunnels.GUI_MESSAGE_PANEL_TOP, glob.Graphics.getWidth(), game.Tunnels.GUI_MESSAGE_PANEL_HEIGHT);
      ctxt.closePath();

      return backBuffer;
    },
  }
]);
