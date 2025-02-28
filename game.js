class Game {
    constructor() {
        // Create grid (8x8)
        this.grid = new Grid(6);
        
        // Create factions
        this.factions = [
            new Faction(0, "Faction 1", "#b3cde0", "Economic"),
            new Faction(1, "Faction 2", "#fbb4ae", "Military"),
            new Faction(2, "Faction 3", "#ccebc5", "Population"),
            new Faction(3, "Faction 4", "#decbe4", "Technology")
        ];
        
        // Create game state manager
        this.gameState = new GameStateManager(this.grid, this.factions);
        
        // Initialize game
        this.gameState.initializeGame();
        
        // Create UI controller
        this.ui = new UIController(this);
        
        // Start message
        this.ui.addMessage("Game started. Faction 1's turn.");
    }
    
    getCurrentFaction() {
        return this.gameState.getCurrentFaction();
    }
    
    nextTurn() {
        return this.gameState.nextTurn();
    }
}