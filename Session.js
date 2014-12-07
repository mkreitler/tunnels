// The session manages the current player and locale.
// The locale is either a tunnel or a shop (probably won't have shops for the hackathon demo).

game.Session = new glob.NewGlobType(
{

},
[
  glob.Listeners,
  glob.GameState.stateMachine,
  glob.Transitions.InLinear,
  glob.Transitions.OutLinear,

  {
  	init: function(gameObj) {
  		this.player = new game.Player(game.Player.PLAYER_ID.SOLO);
  		this.tunnel = new game.Tunnel(this.player);
  		this.shop = null;

      this.tunnel.renderBackground();

  		this.setState(this.crawlingState);

      // Set up communication back to the game.
      this.addListener(gameObj);

      this.startTransInLinear(this.startCrawling, this.transInDraw.bind(this), this.transInUpdate.bind(this), game.Tunnels.TRANSITION_PERIOD, true);
  	},

    // Game States ============================================================
    // Crawling State (player are in the tunnel) ------------------------------
    crawlingState: {
      enter: function() {
      },

      exit: function() {
        // Do something here?
      },

      update: function(dt) {
        // Update particles, etc.
        this.tunnel.update(dt);
      },

      draw: function(ctxt) {
        // Display the background.
        this.tunnel.draw(ctxt);
      }
    },

    // Transition Management ==================================================
    transInDraw: function(ctxt) {
      // TODO: call different drawing method depending on tunnel/shop state.
      ctxt.fillStyle = glob.Graphics.BLACK;
      ctxt.fillRect(0, 0, glob.Graphics.getWidth(), glob.Graphics.getHeight());

      glob.Graphics.setGlobalAlpha(this.transParam);
      this.crawlingState.draw(ctxt);
      glob.Graphics.setGlobalAlpha(1.0);
    },

    transInUpdate: function(dt) {
      // TODO: call different drawing method depending on tunnel/shop state.
      this.crawlingState.update(dt);
      glob.Graphics.setScreenOffset(0, Math.round(glob.Graphics.getHeight() * (1.0 - this.transParam)));
    },

    // Implementation =========================================================
    startCrawling: function() {
      glob.Graphics.setScreenOffset(0, 0);
      this.setState(this.crawlingState);
    },
  },

]);