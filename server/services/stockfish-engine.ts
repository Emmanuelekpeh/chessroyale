import { spawn } from 'child_process';

export interface StockfishAnalysis {
  score: number;
  bestMove: string;
  depth: number;
  line?: string[];
}

export class StockfishEngine {
  private process: ReturnType<typeof spawn>;
  private responseCallback: ((analysis: StockfishAnalysis) => void) | null = null;
  private currentAnalysis: Partial<StockfishAnalysis> = {};

  constructor() {
    this.process = spawn('stockfish');
    this.process.stdout?.on('data', (data) => this.handleStockfishOutput(data.toString()));
    this.init();
  }

  private init() {
    this.sendCommand('uci');
    this.sendCommand('setoption name MultiPV value 3');
    this.sendCommand('setoption name Threads value 4');
    this.sendCommand('isready');
  }

  private sendCommand(command: string) {
    this.process.stdin?.write(command + '\n');
  }

  private analysisCache: Map<string, StockfishAnalysis> = new Map();
private readonly MAX_CACHE_SIZE = 1000;

private pruneCache() {
  if (this.analysisCache.size > this.MAX_CACHE_SIZE) {
    const keys = Array.from(this.analysisCache.keys());
    const deleteCount = Math.floor(this.MAX_CACHE_SIZE * 0.2);
    keys.slice(0, deleteCount).forEach(key => this.analysisCache.delete(key));
  }
}
  private workerPool: Worker[] = [];

  private handleStockfishOutput(output: string) {
    if (!this.responseCallback) return;
    
    const cacheKey = output.trim();
    if (this.analysisCache.has(cacheKey)) {
      this.responseCallback(this.analysisCache.get(cacheKey)!);
      return;
    }

    const lines = output.split('\n');
    for (const line of lines) {
      if (line.startsWith('bestmove')) {
        const [, bestMove] = line.split(' ');
        this.currentAnalysis.bestMove = bestMove;

        const analysis: StockfishAnalysis = {
          score: this.currentAnalysis.score || 0,
          bestMove: this.currentAnalysis.bestMove || '',
          depth: this.currentAnalysis.depth || 0,
          line: this.currentAnalysis.line,
        };

        this.responseCallback(analysis);
        this.responseCallback = null;
        this.currentAnalysis = {};
        break;
      }

      if (line.includes('score cp')) {
        const scoreMatch = line.match(/score cp (-?\d+)/);
        if (scoreMatch) {
          this.currentAnalysis.score = parseInt(scoreMatch[1]) / 100;
        }
      }

      if (line.includes('depth')) {
        const depthMatch = line.match(/depth (\d+)/);
        if (depthMatch) {
          this.currentAnalysis.depth = parseInt(depthMatch[1]);
        }
      }

      if (line.includes('pv')) {
        const pvMatch = line.match(/pv (.+)/);
        if (pvMatch) {
          this.currentAnalysis.line = pvMatch[1].split(' ');
        }
      }
    }
  }

  async analyzeFen(fen: string, timeMs: number = 2000): Promise<StockfishAnalysis> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.responseCallback = null;
        reject(new Error('Analysis timeout'));
        this.process.kill();
        this.init();
      }, timeMs + 1000);
      this.responseCallback = resolve;
      this.sendCommand(`position fen ${fen}`);
      this.sendCommand(`go movetime ${timeMs}`);
    });
  }

  quit() {
    this.sendCommand('quit');
    this.process.kill();
  }
}
