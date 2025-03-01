import { User, Puzzle, Game, PuzzleRatingHistory, UserPuzzleHistory, Achievement, UserAchievement, GameChat, Rating, FriendRequest, UserSettings, Tournament, TournamentParticipant } from "@shared/types/database";

// Maps from database row (snake_case) to application object (camelCase)
export function mapUserFromDb(dbUser: any): User {
  return {
    id: dbUser.id,
    username: dbUser.username,
    passwordHash: dbUser.password_hash,
    email: dbUser.email,
    rating: dbUser.rating,
    gamesPlayed: dbUser.games_played,
    gamesWon: dbUser.games_won,
    puzzlesSolved: dbUser.puzzles_solved,
    score: dbUser.score,
    currentStreak: dbUser.current_streak,
    bestStreak: dbUser.best_streak,
    totalPoints: dbUser.total_points,
    level: dbUser.level,
    isGuest: dbUser.is_guest,
    puzzleRating: dbUser.puzzle_rating,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at
  };
}

// Maps from application object (camelCase) to database parameters (snake_case)
export function mapUserToDb(user: Partial<User>): Record<string, any> {
  const result: Record<string, any> = {};
  
  if ('id' in user) result.id = user.id;
  if ('username' in user) result.username = user.username;
  if ('passwordHash' in user) result.password_hash = user.passwordHash;
  if ('email' in user) result.email = user.email;
  if ('rating' in user) result.rating = user.rating;
  if ('gamesPlayed' in user) result.games_played = user.gamesPlayed;
  if ('gamesWon' in user) result.games_won = user.gamesWon;
  if ('puzzlesSolved' in user) result.puzzles_solved = user.puzzlesSolved;
  if ('score' in user) result.score = user.score;
  if ('currentStreak' in user) result.current_streak = user.currentStreak;
  if ('bestStreak' in user) result.best_streak = user.bestStreak;
  if ('totalPoints' in user) result.total_points = user.totalPoints;
  if ('level' in user) result.level = user.level;
  if ('isGuest' in user) result.is_guest = user.isGuest;
  if ('puzzleRating' in user) result.puzzle_rating = user.puzzleRating;
  if ('createdAt' in user) result.created_at = user.createdAt;
  if ('updatedAt' in user) result.updated_at = user.updatedAt;
  
  return result;
}

// Puzzle mappers
export function mapPuzzleFromDb(dbPuzzle: any): Puzzle {
  return {
    id: dbPuzzle.id,
    creatorId: dbPuzzle.creator_id,
    fen: dbPuzzle.fen,
    solution: dbPuzzle.solution,
    title: dbPuzzle.title,
    description: dbPuzzle.description,
    rating: dbPuzzle.rating,
    tacticalTheme: dbPuzzle.tactical_theme,
    difficulty: dbPuzzle.difficulty,
    verified: dbPuzzle.verified,
    hintsAvailable: dbPuzzle.hints_available,
    pointValue: dbPuzzle.point_value,
    totalAttempts: dbPuzzle.total_attempts,
    successfulAttempts: dbPuzzle.successful_attempts,
    averageTimeToSolve: dbPuzzle.average_time_to_solve,
    attempts: dbPuzzle.attempts,
    solved: dbPuzzle.solved
  };
}

export function mapPuzzleToDb(puzzle: Partial<Puzzle>): Record<string, any> {
  const result: Record<string, any> = {};
  
  if ('id' in puzzle) result.id = puzzle.id;
  if ('creatorId' in puzzle) result.creator_id = puzzle.creatorId;
  if ('fen' in puzzle) result.fen = puzzle.fen;
  if ('solution' in puzzle) result.solution = puzzle.solution;
  if ('title' in puzzle) result.title = puzzle.title;
  if ('description' in puzzle) result.description = puzzle.description;
  if ('rating' in puzzle) result.rating = puzzle.rating;
  if ('tacticalTheme' in puzzle) result.tactical_theme = puzzle.tacticalTheme;
  if ('difficulty' in puzzle) result.difficulty = puzzle.difficulty;
  if ('verified' in puzzle) result.verified = puzzle.verified;
  if ('hintsAvailable' in puzzle) result.hints_available = puzzle.hintsAvailable;
  if ('pointValue' in puzzle) result.point_value = puzzle.pointValue;
  if ('totalAttempts' in puzzle) result.total_attempts = puzzle.totalAttempts;
  if ('successfulAttempts' in puzzle) result.successful_attempts = puzzle.successfulAttempts;
  if ('averageTimeToSolve' in puzzle) result.average_time_to_solve = puzzle.averageTimeToSolve;
  if ('attempts' in puzzle) result.attempts = puzzle.attempts;
  if ('solved' in puzzle) result.solved = puzzle.solved;
  
  return result;
}

// Game mappers
export function mapGameFromDb(dbGame: any): Game {
  return {
    id: dbGame.id,
    fen: dbGame.fen,
    whitePlayer: dbGame.white_player,
    blackPlayer: dbGame.black_player,
    timeControlInitial: dbGame.time_control_initial,
    timeControlIncrement: dbGame.time_control_increment,
    moves: dbGame.moves,
    status: dbGame.status,
    winner: dbGame.winner,
    startedAt: dbGame.started_at,
    createdAt: dbGame.created_at,
    updatedAt: dbGame.updated_at
  };
}

export function mapGameToDb(game: Partial<Game>): Record<string, any> {
  const result: Record<string, any> = {};
  
  if ('id' in game) result.id = game.id;
  if ('fen' in game) result.fen = game.fen;
  if ('whitePlayer' in game) result.white_player = game.whitePlayer;
  if ('blackPlayer' in game) result.black_player = game.blackPlayer;
  if ('timeControlInitial' in game) result.time_control_initial = game.timeControlInitial;
  if ('timeControlIncrement' in game) result.time_control_increment = game.timeControlIncrement;
  if ('moves' in game) result.moves = game.moves;
  if ('status' in game) result.status = game.status;
  if ('winner' in game) result.winner = game.winner;
  if ('startedAt' in game) result.started_at = game.startedAt;
  if ('createdAt' in game) result.created_at = game.createdAt;
  if ('updatedAt' in game) result.updated_at = game.updatedAt;
  
  return result;
}

// PuzzleRatingHistory mappers
export function mapPuzzleRatingHistoryFromDb(dbHistory: any): PuzzleRatingHistory {
  return {
    id: dbHistory.id,
    userId: dbHistory.user_id,
    rating: dbHistory.rating,
    timestamp: dbHistory.timestamp
  };
}

export function mapPuzzleRatingHistoryToDb(history: Partial<PuzzleRatingHistory>): Record<string, any> {
  const result: Record<string, any> = {};
  
  if ('id' in history) result.id = history.id;
  if ('userId' in history) result.user_id = history.userId;
  if ('rating' in history) result.rating = history.rating;
  if ('timestamp' in history) result.timestamp = history.timestamp;
  
  return result;
}

// UserPuzzleHistory mappers
export function mapUserPuzzleHistoryFromDb(dbHistory: any): UserPuzzleHistory {
  return {
    id: dbHistory.id,
    userId: dbHistory.user_id,
    puzzleId: dbHistory.puzzle_id,
    solved: dbHistory.solved,
    timeSpent: dbHistory.time_spent,
    ratingChange: dbHistory.rating_change,
    solvedAt: dbHistory.solved_at
  };
}

export function mapUserPuzzleHistoryToDb(history: Partial<UserPuzzleHistory>): Record<string, any> {
  const result: Record<string, any> = {};
  
  if ('id' in history) result.id = history.id;
  if ('userId' in history) result.user_id = history.userId;
  if ('puzzleId' in history) result.puzzle_id = history.puzzleId;
  if ('solved' in history) result.solved = history.solved;
  if ('timeSpent' in history) result.time_spent = history.timeSpent;
  if ('ratingChange' in history) result.rating_change = history.ratingChange;
  if ('solvedAt' in history) result.solved_at = history.solvedAt;
  
  return result;
}

// Achievement mappers
export function mapAchievementFromDb(dbAchievement: any): Achievement {
  return {
    id: dbAchievement.id,
    name: dbAchievement.name,
    description: dbAchievement.description,
    type: dbAchievement.type,
    requiredValue: dbAchievement.required_value,
    pointReward: dbAchievement.point_reward
  };
}

export function mapAchievementToDb(achievement: Partial<Achievement>): Record<string, any> {
  const result: Record<string, any> = {};
  
  if ('id' in achievement) result.id = achievement.id;
  if ('name' in achievement) result.name = achievement.name;
  if ('description' in achievement) result.description = achievement.description;
  if ('type' in achievement) result.type = achievement.type;
  if ('requiredValue' in achievement) result.required_value = achievement.requiredValue;
  if ('pointReward' in achievement) result.point_reward = achievement.pointReward;
  
  return result;
}

// UserAchievement mappers
export function mapUserAchievementFromDb(dbUserAchievement: any): UserAchievement {
  return {
    id: dbUserAchievement.id,
    userId: dbUserAchievement.user_id,
    achievementId: dbUserAchievement.achievement_id,
    earnedAt: dbUserAchievement.earned_at
  };
}

export function mapUserAchievementToDb(userAchievement: Partial<UserAchievement>): Record<string, any> {
  const result: Record<string, any> = {};
  
  if ('id' in userAchievement) result.id = userAchievement.id;
  if ('userId' in userAchievement) result.user_id = userAchievement.userId;
  if ('achievementId' in userAchievement) result.achievement_id = userAchievement.achievementId;
  if ('earnedAt' in userAchievement) result.earned_at = userAchievement.earnedAt;
  
  return result;
}

// GameChat mappers
export function mapGameChatFromDb(dbGameChat: any): GameChat {
  return {
    id: dbGameChat.id,
    gameId: dbGameChat.game_id,
    userId: dbGameChat.user_id,
    message: dbGameChat.message,
    sentAt: dbGameChat.sent_at
  };
}

export function mapGameChatToDb(gameChat: Partial<GameChat>): Record<string, any> {
  const result: Record<string, any> = {};
  
  if ('id' in gameChat) result.id = gameChat.id;
  if ('gameId' in gameChat) result.game_id = gameChat.gameId;
  if ('userId' in gameChat) result.user_id = gameChat.userId;
  if ('message' in gameChat) result.message = gameChat.message;
  if ('sentAt' in gameChat) result.sent_at = gameChat.sentAt;
  
  return result;
}

// Rating mappers
export function mapRatingFromDb(dbRating: any): Rating {
  return {
    id: dbRating.id,
    userId: dbRating.user_id,
    rating: dbRating.rating,
    timestamp: dbRating.timestamp
  };
}

export function mapRatingToDb(rating: Partial<Rating>): Record<string, any> {
  const result: Record<string, any> = {};
  
  if ('id' in rating) result.id = rating.id;
  if ('userId' in rating) result.user_id = rating.userId;
  if ('rating' in rating) result.rating = rating.rating;
  if ('timestamp' in rating) result.timestamp = rating.timestamp;
  
  return result;
}

// FriendRequest mappers
export function mapFriendRequestFromDb(dbFriendRequest: any): FriendRequest {
  return {
    id: dbFriendRequest.id,
    senderId: dbFriendRequest.sender_id,
    receiverId: dbFriendRequest.receiver_id,
    status: dbFriendRequest.status,
    sentAt: dbFriendRequest.sent_at,
    updatedAt: dbFriendRequest.updated_at
  };
}

export function mapFriendRequestToDb(friendRequest: Partial<FriendRequest>): Record<string, any> {
  const result: Record<string, any> = {};
  
  if ('id' in friendRequest) result.id = friendRequest.id;
  if ('senderId' in friendRequest) result.sender_id = friendRequest.senderId;
  if ('receiverId' in friendRequest) result.receiver_id = friendRequest.receiverId;
  if ('status' in friendRequest) result.status = friendRequest.status;
  if ('sentAt' in friendRequest) result.sent_at = friendRequest.sentAt;
  if ('updatedAt' in friendRequest) result.updated_at = friendRequest.updatedAt;
  
  return result;
}

// UserSettings mappers
export function mapUserSettingsFromDb(dbUserSettings: any): UserSettings {
  return {
    id: dbUserSettings.id,
    userId: dbUserSettings.user_id,
    theme: dbUserSettings.theme,
    sound: dbUserSettings.sound,
    notifications: dbUserSettings.notifications,
    boardStyle: dbUserSettings.board_style,
    pieceStyle: dbUserSettings.piece_style,
    updatedAt: dbUserSettings.updated_at
  };
}

export function mapUserSettingsToDb(userSettings: Partial<UserSettings>): Record<string, any> {
  const result: Record<string, any> = {};
  
  if ('id' in userSettings) result.id = userSettings.id;
  if ('userId' in userSettings) result.user_id = userSettings.userId;
  if ('theme' in userSettings) result.theme = userSettings.theme;
  if ('sound' in userSettings) result.sound = userSettings.sound;
  if ('notifications' in userSettings) result.notifications = userSettings.notifications;
  if ('boardStyle' in userSettings) result.board_style = userSettings.boardStyle;
  if ('pieceStyle' in userSettings) result.piece_style = userSettings.pieceStyle;
  // Continuing from line 322...
  if ('updatedAt' in userSettings) result.updated_at = userSettings.updatedAt;
  
  return result;
}

// Tournament mappers
export function mapTournamentFromDb(dbTournament: any): Tournament {
  return {
    id: dbTournament.id,
    name: dbTournament.name,
    description: dbTournament.description,
    startTime: dbTournament.start_time,
    endTime: dbTournament.end_time,
    format: dbTournament.format,
    timeControl: dbTournament.time_control,
    minRating: dbTournament.min_rating,
    maxRating: dbTournament.max_rating,
    maxParticipants: dbTournament.max_participants,
    creatorId: dbTournament.creator_id,
    status: dbTournament.status,
    createdAt: dbTournament.created_at,
    updatedAt: dbTournament.updated_at
  };
}

export function mapTournamentToDb(tournament: Partial<Tournament>): Record<string, any> {
  const result: Record<string, any> = {};
  
  if ('id' in tournament) result.id = tournament.id;
  if ('name' in tournament) result.name = tournament.name;
  if ('description' in tournament) result.description = tournament.description;
  if ('startTime' in tournament) result.start_time = tournament.startTime;
  if ('endTime' in tournament) result.end_time = tournament.endTime;
  if ('format' in tournament) result.format = tournament.format;
  if ('timeControl' in tournament) result.time_control = tournament.timeControl;
  if ('minRating' in tournament) result.min_rating = tournament.minRating;
  if ('maxRating' in tournament) result.max_rating = tournament.maxRating;
  if ('maxParticipants' in tournament) result.max_participants = tournament.maxParticipants;
  if ('creatorId' in tournament) result.creator_id = tournament.creatorId;
  if ('status' in tournament) result.status = tournament.status;
  if ('createdAt' in tournament) result.created_at = tournament.createdAt;
  if ('updatedAt' in tournament) result.updated_at = tournament.updatedAt;
  
  return result;
}

// TournamentParticipant mappers
export function mapTournamentParticipantFromDb(dbParticipant: any): TournamentParticipant {
  return {
    id: dbParticipant.id,
    tournamentId: dbParticipant.tournament_id,
    userId: dbParticipant.user_id,
    score: dbParticipant.score,
    rank: dbParticipant.rank,
    joinedAt: dbParticipant.joined_at
  };
}

export function mapTournamentParticipantToDb(participant: Partial<TournamentParticipant>): Record<string, any> {
  const result: Record<string, any> = {};
  
  if ('id' in participant) result.id = participant.id;
  if ('tournamentId' in participant) result.tournament_id = participant.tournamentId;
  if ('userId' in participant) result.user_id = participant.userId;
  if ('score' in participant) result.score = participant.score;
  if ('rank' in participant) result.rank = participant.rank;
  if ('joinedAt' in participant) result.joined_at = participant.joinedAt;
  
  return result;
}

// Helper function to map arrays of objects
export function mapArrayFromDb<T>(
  dbArray: any[], 
  mapperFunction: (item: any) => T
): T[] {
  return dbArray.map(item => mapperFunction(item));
}

// Helper for pagination results
export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function mapPaginationResultFromDb<T>(
  result: { rows: any[], count: number },
  page: number,
  pageSize: number,
  mapperFunction: (item: any) => T
): PaginationResult<T> {
  return {
    data: result.rows.map(item => mapperFunction(item)),
    total: result.count,
    page,
    pageSize,
    totalPages: Math.ceil(result.count / pageSize)
  };
}

// Helper for SQL parameterized queries
export function createSetClause(
  updates: Record<string, any>, 
  startParamIndex = 1
): { setClause: string, params: any[], nextParamIndex: number } {
  const keys = Object.keys(updates);
  if (keys.length === 0) {
    return { setClause: '', params: [], nextParamIndex: startParamIndex };
  }

  const setClauses: string[] = [];
  const params: any[] = [];
  let paramIndex = startParamIndex;

  for (const key of keys) {
    setClauses.push(`${key} = $${paramIndex}`);
    params.push(updates[key]);
    paramIndex++;
  }

  return {
    setClause: `SET ${setClauses.join(', ')}`,
    params,
    nextParamIndex: paramIndex
  };
}
