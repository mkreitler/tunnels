// Tests the following:
//
// 1) Resource load (bitmap, sound, and font)
// 2) Bitmap display
// 3) Audio playback
// 4) Custom Fonts
// 5) Keyboard IO
// 6) Mouse/Touch IO
// 7) Game states

game = {res: {font: null, floorTiles: null, features: null, heroes: null, monsters: null, bosses: null},
        spriteSheets: {floor: null, features: null, heroes:null, monsters: null, bosses: null} };

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

game.Tunnels = new glob.NewGlobType(
  // Class Definitions --------------------------------------------------------
  {
    TITLE_FONT_SIZE: 100,
    TITLE_OPTION_SIZE: 33,
    OPTION_SPACING: 1.1, 

    ISO_HEIGHT_FLOOR_OFFSET: 15 / 38,

    TRANSITION_PERIOD: 1,  // seconds
  },
  [
  // Instance Definitions -----------------------------------------------------
    glob.GameState.stateMachine,
    glob.Transitions.InLinear,
    glob.Transitions.OutLinear,

    {
      init: function() {
        // Request some resources.
        game.res.font = glob.Resources.loadFont("res/moonshadow.ttf", "moonshadow");
        game.res.floorTiles = glob.Resources.loadImage("res/normal.png");
        game.res.features = glob.Resources.loadImage("res/featuresReduced.png");
        game.res.heroes = glob.Resources.loadImage("res/heroes.png");
        game.res.monsters = glob.Resources.loadImage("res/reducedEnemies.png");
        game.res.bosses = glob.Resources.loadImage("res/bosses.png");

        this.bFirstPlay = true;

        // Start resource download.
        glob.Resources.EZstartDownloadState(this, this.titleState);

        this.menuLabels = { title: null,
                            soloGame: null,
                            startTeamGame: null,
                            joinTeamGame: null,
                            tutorial: null};
        this.transTimer = 0;
        this.currentSession = null;
      },

      // Play State -----------------------------------------------
      titleState: {
        enter: function() {
          if (this.bFirstPlay) {
            this.setUpGame();
          }
        },

        exit: function() {
        },

        update: function(dt) {
        },

        draw: function(ctxt) {
          var key = null,
              alpha = glob.Graphics.getGlobalAlpha();

          glob.Graphics.setGlobalAlpha(1.0);

          glob.Graphics.clearTo(glob.Graphics.BLACK);

          glob.Graphics.setGlobalAlpha(alpha);

          for (key in this.menuLabels) {
            if (this.menuLabels[key]) {
              this.menuLabels[key].draw(ctxt);
            }
          }
        },

        onChooseSoloGame: function() {
          this.startTransOutLinear(this.startSoloSession, this.transOutDraw.bind(this), this.transOutUpdate.bind(this), game.Tunnels.TRANSITION_PERIOD, true);
        },

        onStartTeamGame: function() {
          console.log("Starting team game!");
          // this.setState(this.transitionOutState);
        },

        onJoinTeamGame: function() {
          console.log("Joining team game!");
          // this.setState(this.transitionOutState);
        },

        onTutorial: function() {
          console.log("Starting tutorial!");
          // this.setState(this.transitionOutState);
        },        
      },

      // Implementation =======================================================
      // Transition Management ------------------------------------------------
      transOutDraw: function(ctxt) {
        glob.Graphics.setGlobalAlpha(this.transParam);
        this.titleState.draw.call(this, ctxt);
        glob.Graphics.setGlobalAlpha(1.0);
      },

      transOutUpdate: function(dt) {
        glob.Graphics.setScreenOffset(0, Math.round(-glob.Graphics.getHeight() * (1.0 - this.transParam)));
      },

      transInDraw: function(ctxt) {
        glob.Graphics.setGlobalAlpha(this.transParam);
        this.titleState.draw.call(this, ctxt);
        glob.Graphics.setGlobalAlpha(1.0);
      },

      transInUpdate: function(dt) {
        glob.Graphics.setScreenOffset(0, Math.round(glob.Graphics.getHeight() * (1.0 - this.transParam)));
      },

      startSoloSession: function() {
        this.setState(null);
        this.currentSession = new game.Session(this);
      },

      setUpGame: function() {
        var args = null;

        args = {  x: glob.Graphics.getWidth() / 2,
                  y: glob.Graphics.getHeight() / 2 - game.Tunnels.TITLE_FONT_SIZE / 2,
                  font: game.res.font,
                  fontSize: game.Tunnels.TITLE_FONT_SIZE,
                  text: game.Strings.TITLE,
                  activeColor: glob.Graphics.GRAY,
                  selectedColor: glob.Graphics.YELLOW,
                  onClickedCallback: null,
                  hAlign: 0.5,
                  vAlign: 0.5
                };
        this.menuLabels.Title = new glob.GUI.Label(args);

        args.activeColor = glob.Graphics.WHITE;
        args.fontSize = game.Tunnels.TITLE_OPTION_SIZE;

        args.y += game.Tunnels.TITLE_FONT_SIZE;
        args.text = game.Strings.OPT_SOLO_GAME;
        args.onClickedCallback = this.titleState.onChooseSoloGame.bind(this);
        this.menuLabels.soloGame = new glob.GUI.Label(args);

        args.y += game.Tunnels.TITLE_OPTION_SIZE * game.Tunnels.OPTION_SPACING;
        args.text = game.Strings.OPT_START_TEAM_GAME;
        args.onClickedCallback = this.titleState.onStartTeamGame.bind(this);
        this.menuLabels.startTeamGame = new glob.GUI.Label(args);

        args.y += game.Tunnels.TITLE_OPTION_SIZE * game.Tunnels.OPTION_SPACING;
        args.text = game.Strings.OPT_JOIN_TEAM_GAME;
        args.onClickedCallback = this.titleState.onJoinTeamGame.bind(this);
        this.menuLabels.joinTeamGame = new glob.GUI.Label(args);

        args.y += game.Tunnels.TITLE_OPTION_SIZE * game.Tunnels.OPTION_SPACING;
        args.text = game.Strings.OPT_TUTORIAL;
        args.onClickedCallback = this.titleState.onTutorial.bind(this);
        this.menuLabels.tutorial = new glob.GUI.Label(args);

        game.spriteSheets.floor = new glob.SpriteSheetGlob(game.res.floorTiles, 3, 8);
        game.spriteSheets.features = new glob.SpriteSheetGlob(game.res.features, 2, 16);
        game.spriteSheets.heroes = new glob.SpriteSheetGlob(game.res.heroes, 1, 9);
        game.spriteSheets.monsters = new glob.SpriteSheetGlob(game.res.monsters, 8, 8);
        game.spriteSheets.bosses = new glob.SpriteSheetGlob(game.res.bosses, 3, 7);
      },
   },
  ]
);

// Create the game ////////////////////////////////////////////////////////////
var tunnels = new game.Tunnels();


