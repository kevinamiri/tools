interface EnvironmentResponse {
    nextState: number;
    reward: number;
  }
  
  class QLearningAgent {
    // The Q-table storing the value of each state-action pair.
    private qTable: number[][];
  
    // Constructor initializes the agent with the environment and learning parameters.
    constructor(private statesCount: number, private actionsCount: number, private learningRate: number, private discountFactor: number) {
      this.qTable = this.createQTable();
    }
  
    // Initializes the Q-table filled with zeros for each state-action pair.
    private createQTable(): number[][] {
      return Array.from({ length: this.statesCount }, () => Array(this.actionsCount).fill(0));
    }
  
    // Finds the maximum Q-value for the given state, used in the Q-value update equation.
    private getMaxFutureQ(nextState: number): number {
      return Math.max(...this.qTable[nextState]);
    }
  
    // Updates the Q-value for a given state-action pair using the Bellman equation.
    public updateQValue(state: number, action: number, reward: number, nextState: number): void {
      const currentQ = this.qTable[state][action];
      const maxFutureQ = this.getMaxFutureQ(nextState);
      const newQ = currentQ + this.learningRate * (reward + this.discountFactor * maxFutureQ - currentQ);
      this.qTable[state][action] = newQ;
      console.log(`Updated Q-value for state ${state}, action ${action}: ${newQ}`);
    }
  
    // Chooses the action with the highest Q-value for the current state.
    public chooseAction(state: number): number {
      const bestAction = this.qTable[state].reduce((acc, curr, idx) => (curr > this.qTable[state][acc] ? idx : acc), 0);
      console.log(`Chosen action for state ${state}: ${bestAction}`);
      return bestAction;
    }
  }
  
  // Simulates the environment's response to the agent's action.
  // Here, the environment is simplified and deterministic for illustration purposes.
  function simulateEnvironment(state: number, action: number): EnvironmentResponse {
    const nextState = (state + action) % 10; // Simplified logic for determining the next state
    const reward = Math.random(); // Generates a random reward
    console.log(`Environment response: nextState = ${nextState}, reward = ${reward}`);
    return { nextState, reward };
  }
  
  // Runs a single episode where the agent interacts with the environment to learn from its actions.
  function runEpisode(agent: QLearningAgent): void {
    let state = 0; // Starting state for the episode
    console.log('Starting new episode');
  
    for (let i = 0; i < 100; i++) { // Iterate through a set number of steps per episode
      console.log(`Step ${i + 1}`);
      const action = agent.chooseAction(state); // Agent chooses an action based on the current state
      const { nextState, reward } = simulateEnvironment(state, action); // Environment responds to the action
      agent.updateQValue(state, action, reward, nextState); // Agent updates its Q-table based on the response
      state = nextState; // Move to the next state as determined by the environment
    }
  
    console.log('Episode finished');
  }
  
  // Main usage example demonstrating how to create an agent, run an episode, and initiate the learning process.
  const statesCount = 10; // Total number of states in the environment
  const actionsCount = 4; // Total number of possible actions the agent can take
  const learningRate = 0.1; // Learning rate (alpha) for the Q-learning algorithm
  const discountFactor = 0.95; // Discount factor (gamma) for future rewards
  const agent = new QLearningAgent(statesCount, actionsCount, learningRate, discountFactor); // Instantiate the Q-learning agent
  
  runEpisode(agent); // Run a single learning episode
  
