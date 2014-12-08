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

      this.activeStack = null;
      this.skillCard = null;

      // Set up communication back to the game.
      this.addListener(gameObj);

      // Set up communications from sub-modules back to the session.
      this.player.addListener(this);
      this.tunnel.addListener(this);

      this.startTransInLinear(this.startCrawling, this.transInDraw.bind(this), this.transInUpdate.bind(this), game.Tunnels.TRANSITION_PERIOD, true);
  	},

    clearMessage: function(data, widget, x, y) {
      this.messageLabel.setText("");

      if (this.phase && this.phase.nextMessage) {
        this.phase.nextMessage.call(this);
      }
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
      this.tunnel.startRound(!game.bFirstSession);
      this.player.startRound(!game.bFirstSession);

      this.phase = this.introPhase;
      this.phase.start.call(this);
    },

    onMouseDown: function(x, y, data) {
      // TODO: if this is a card, highlight the valid UI elements with
      // which it can interact.
      if (this.phase.onMouseDown) {
          this.phase.onMouseDown.call(this, x, y, data);
      }

      return this.phase.preventDrag(data);
    },

    onMouseUp: function(x, y, data) {
      // TODO: if this is a card, highlight the valid UI elements with
      // which it can interact.
      var bPreventDrag = this.phase.preventDrag(data),
          bAllowDrag = !bPreventDrag;

      if (this.phase.onMouseUp) {
        this.phase.onMouseUp.call(this, x, y, data);
      }

      if (bAllowDrag && data) {
        // If we're allowing drag and we're dargging a contro, we need
        // to see if it's been dropped in the right place.
        this.phase.checkForReleaseOnStack.call(this, x, y, data);
      }

      return bPreventDrag;
    },

    onMouseDrag: function(x, y, data) {
      // TODO: if this is a card, highlight the valid UI elements with
      // which it can interact.
      return this.phase.preventDrag(data);
    },

    onNewRoom: function() {
      this.player.onNewRoom();
      this.tunnel.onNewRoom(this.player);
      this.startRound(!game.bFirstSession);
    },

    // Game States ============================================================
    // Crawling Phases --------------------------------------------------------
    introPhase: {
      messageIndex: 0,

      start: function() {
        if (!game.bFirstSession) {
          this.phase.end.call(this);
        }
        else {
          this.phase.messageIndex = -1;
          this.phase.nextMessage.call(this);
          game.bFirstSession = false;
        }
      },

      nextMessage: function() {
        this.phase.messageIndex += 1;
        if (this.phase.messageIndex < game.Strings.INTRO_HELP.length) {
          this.messageLabel.setText(game.Strings.INTRO_HELP[this.phase.messageIndex]);
        }
        else {
          this.phase.end.call(this);
        }
      },

      preventDrag: function() {
        return true;
      },

      end: function() {
        // Clean up intro state?
        this.phase = this.skillPhase;
        this.phase.start.call(this);
      }
    },

    skillPhase: {
      start: function() {
        this.skillCard = null;
        this.activeStack = null;
      },

      preventDrag: function(data) {
        return data && data.cardType && data.cardType !== game.CARD_TYPE.SKILL;
      },

      checkForReleaseOnStack: function(x, y, data) {
        var newX = 0,
            newY = 0,
            stackBounds = null;

        if (data && data.card) {
          this.activeStack = this.player.cardIntersectsAttackWidget(data.card) ||
                             this.tunnel.cardIntersectsAttackWidget(data.card);
        }

        if (this.activeStack) {
          // Remove this card from the player's deck...
          this.skillCard = data.card;
          this.player.removeSkillCardFromHand(data.card);

          // Position it next to the appropriate stack...
          this.skillCard.setPos(this.activeStack.data.cardPos[0].x, this.activeStack.data.cardPos[0].y);

          // Transition to 'power' phase.
          this.phase.end.call(this);
        }
        else {
          // Snap the card back home.
          data.card.setPos(data.startPos.x, data.startPos.y);
        }
      },

      onMouseDown: function() {
        this.tunnel.highlightCardDestinations();
        this.player.highlightCardDestinations();
      },

      onMouseUp: function() {
        this.tunnel.clearCardDestinations();
        this.player.clearCardDestinations();
      },

      end: function() {
        this.phase = this.powerPhase;
        this.phase.start.call(this);
      }
    },

    powerPhase: {
      start: function() {
        this.powerCard = null;
        this.messageLabel.setText(game.Strings.POWER_NAG);
      },

      preventDrag: function(data) {
        return data && data.cardType && data.cardType !== game.CARD_TYPE.POWER;
      },

      onMouseDown: function() {
        this.activeStack.showBounds();
        this.skillCard.showBounds();
      },

      onMouseUp: function() {
        this.activeStack.hideBounds();
        this.skillCard.hideBounds();
      },

      checkForReleaseOnStack: function(x, y, data) {
        var newX = 0,
            newY = 0,
            stackBounds = null;

        if (data && data.card && this.activeStack &&
            (glob.Math.clip(this.activeStack.getBoundsRef(), data.card.getBoundsRef()) ||
             glob.Math.clip(this.skillCard.getBoundsRef(), data.card.getBoundsRef()))
        ) {
          // Remove this card from the player's deck...
          this.powerCard = data.card;
          this.player.removePowerCardFromHand(data.card);

          // Position it next to the appropriate stack...
          this.powerCard.setPos(this.activeStack.data.cardPos[1].x, this.activeStack.data.cardPos[1].y);

          // Transition to 'power' phase.
          this.phase.end.call(this);
        }
        else {
          // Snap the card back home.
          data.card.setPos(data.startPos.x, data.startPos.y);
        }
      },

      end: function() {
        this.clearMessage();
        this.phase = this.resolvePlayerMovePhase;
        this.phase.start.call(this);
      },
    },

    resolvePlayerMovePhase: {
      // Because of the branching nature of the player's result,
      // this phase doesn't call end(). I've removed the method
      // entirely so that an error will occur if one tries to
      // call it.

      start: function() {
        var result = this.activeStack.data.resolvePlayerAction(this.player, this.tunnel, this.skillCard, this.powerCard);

        // Remove the used cards from the battlefield.
        this.player.removeCards(this.skillCard, this.powerCard);
        this.skillCard = null;
        this.powerCard = null;

        switch (result) {
          case game.Tunnels.RESULT.MONSTER_DEFEATED:
            this.phase = this.defeatMonsterPhase;
            this.defeatMonsterPhase.start.call(this);
          break;

          case game.Tunnels.RESULT.PLAYER_PROTECTED:
            // Turn off the upper info labels.
            this.player.hideUpperPanel();
            this.tunnel.hideUpperPanel();
            this.player.setDefended(true);
            // FALL THROUGH!

          default: // Includes the case game.Tunnels.RESULT.MONSTERS_ADVANCE
              this.phase = this.moveMonstersPhase;
              this.moveMonstersPhase.start.call(this);
          break;
        }
      },

      preventDrag: function() {
        return true;
      },
    },

    defeatMonsterPhase: {
      start: function() {
        var levelUpMsg = null;

        if (this.tunnel.removeMonster()) {
          // All monsters gone -- start over!
          // TODO: start a new round???
          // Check for level up???
          levelUpMsg = this.player.levelUp();
          if (levelUpMsg) {
            this.messageLabel.setText(levelUpMsg);
          }

          this.onNewRoom();
        }
        else {
          // New monster -- turn on upper info labels
          // (in case they got shut off owing to the player's
          // defensive plays).
          this.player.showUpperPanel();
          this.tunnel.showUpperPanel();
          this.player.onNewMonster();

          // Advance the monsters!
          this.phase = this.moveMonstersPhase;
          this.moveMonstersPhase.start.call(this);
        }
      },

      preventDrag: function() {
        return true;
      },

      end: function() {

      }
    },

    moveMonstersPhase: {
      start: function() {
        var leftmostCol = this.tunnel.advanceMonsters(),
            monsterDmg = 0;

        if (leftmostCol === this.player.getCol()) {
          // Monster reached player!
          if (this.player.defended()) {
            this.messageLabel.setText(game.Strings.DEFENDED_MSG);
          }
          else {
            monsterDmg = this.tunnel.getMonsterDamage();
            if (monsterDmg === 1) {
              this.messageLabel.setText(game.Strings.DAMAGE_PREFIX + " " + this.tunnel.getMonsterDamage() + " " + game.Strings.DAMAGE_SUFFIX_SINGULAR);
            }
            else {
              this.messageLabel.setText(game.Strings.DAMAGE_PREFIX + " " + this.tunnel.getMonsterDamage() + " " + game.Strings.DAMAGE_SUFFIX_PLURAL);
            }
          }

          this.tunnel.removeMonster();
          this.player.onNewMonster();
        }

        this.phase.end.call(this);
      },

      preventDrag: function() {
        return true;
      },

      end: function() {
        this.startRound(!game.bFirstSession); 
      }
    },

    // Crawling State (player are in the tunnel) ------------------------------
    crawlingState: {
      enter: function() {
        this.onNewRoom();
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

        if (this.skillCard) {
          this.skillCard.draw(ctxt);
        }

        if (this.powerCard) {
          this.powerCard.draw(ctxt);
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
    },
  },

]);