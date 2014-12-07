// The session manages the current player and locale.
// The locale is either a tunnel or a shop (probably won't have shops for the hackathon demo).

game.Session = new glob.NewGlobType(
{
  PHASE_INFO: {
    skillPlacement: {help: game.Strings.HELP_SKILL_PLACEMENT},
  }
},
[
  glob.Listeners,
  glob.GameState.stateMachine,
  glob.Transitions.InLinear,
  glob.Transitions.OutLinear,

  {
  	init: function(gameObj) {
  		this.player = new game.Player(game.Player.PLAYER_ID.SOLO, this);
  		this.tunnel = new game.Tunnel(this.player);
  		this.shop = null;

      this.messageLabel = null;

      this.startSession();

  		this.setState(this.crawlingState);

      // Set up communication back to the game.
      this.addListener(gameObj);

      // Set up communications from sub-modules back to the session.
      this.player.addListener(this);
      this.tunnel.addListener(this);

      this.startTransInLinear(this.startCrawling, this.transInDraw.bind(this), this.transInUpdate.bind(this), game.Tunnels.TRANSITION_PERIOD, true);
  	},

    clearMessage: function(data, widget, x, y) {
      this.messageLabel.setText("");
    },

    createMessageGUI: function() {
      this.messageLabel = new glob.GUI.Label({
        x: glob.Graphics.getWidth() / 2,
        y: game.Tunnels.GUI_MESSAGE_PANEL_TOP + game.Tunnels.GUI_MESSAGE_PANEL_HEIGHT / 2,
        font: game.res.font,
        fontSize: game.Tunnels.GUI_MESSAGE_PANEL_FONT_SIZE,
        text: "",
        activeColor: glob.Graphics.WHITE,
        selectedColor: glob.Graphics.WHITE,
        onClickedCallback: this.clearMessage.bind(this),
        hAlign: 0.5,
        vAlign: 0.75,
      });
    },

    startSession: function() {
      this.createMessageGUI();
      this.tunnel.startSession(this.player);
      this.player.startSession();
    },

    startRound: function() {
      this.tunnel.startRound();
      this.player.startRound();

      this.phase = this.introPhase;
      this.phase.start.call(this);
    },

    onMouseDown: function(x, y, data) {
      return true;
    },

    onMouseUp: function(x, y, data) {
      return true;
    },

    onMouseDrag: function(x, y, data) {
      // TODO: if this is a card, highlight the valid UI elements with
      // which it can interact.
      return this.phase.canDrag(data);
    },

    // Game States ============================================================
    // Crawling Phases --------------------------------------------------------
    introPhase: {
      start: function() {
        if (!game.bFirstSession) {
          this.phase.end.call(this);
          this.phase = this.skillPhase;
          this.phase.start.call(this);
        }

        this.messageLabel.setText(game.Strings.INTRO_MSG_01);
        game.bFirstSession = false;
      },

      canDrag: function() {
        return false;
      },

      end: function() {
        // Clean up intro state?
      }
    },

    skillPhase: {
      start: function() {
      },

      canDrag: function(data) {
        return data && data.cardType && data.cardType === game.CARD_TYPE.SKILL;
      },

      // start: function() {
      //   this.tunnel.highlightCardDestinations();
      //   this.player.highlightCardDestinations();
      // },

      // end: function() {
      //   this.tunnel.clearCardDestinations();
      //   this.player.clearCardDestinations();
      // }
    },

    powerPhase: {
      canDrag: function(data) {
        return data && data.cardType && data.cardType === game.CARD_TYPE.POWER;
      }
    },

    resolvePlayerMovePhase: {
      canDrag: function() {
        return false;
      }
    },

    moveMonstersPhase: {
      canDrag: function() {
        return false;
      }
    },

    // Crawling State (player are in the tunnel) ------------------------------
    crawlingState: {
      enter: function() {
        this.startRound();
      },

      exit: function() {
        // Do something here?
      },

      update: function(dt) {
        // Update the game.
        if (this.phase && this.phase.update) {
          this.phase.update.call(this, dt);
        }

        // Update particles, etc.
        this.tunnel.update(dt);
      },

      draw: function(ctxt) {
        if (this.phase && this.phase.preDraw) {
          this.phase.preDraw.call(this, ctxt);
        }

        // Display the background.
        this.tunnel.draw(ctxt);

        if (this.messageLabel) {
          this.messageLabel.draw(ctxt);
        }

        this.tunnel.drawGUI(ctxt);
        this.player.drawGUI(ctxt);

        if (this.phase && this.phase.postDraw) {
          this.phase.postDraw.call(this, ctxt);
        }
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