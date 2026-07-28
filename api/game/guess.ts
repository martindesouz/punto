import { dailyWord, feedbackFor, isAllowedGuess, scoreGame, todayUTC, MAX_GUESSES, WORD_LENGTH } from '../_lib/game'
import { signState, verifyState } from '../_lib/token'
import { readJson, sendJson, methodNotAllowed, type Handler } from '../_lib/http'

interface Body {
  token?: string
  guess?: string
}

const handler: Handler = async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res)
  const body = await readJson<Body>(req)
  const state = body?.token ? verifyState(body.token) : null
  if (!state) return sendJson(res, 401, { error: 'bad_token' })

  const { day } = todayUTC()
  const practice = state.day.startsWith('practice:')
  if (!practice && state.day !== day) return sendJson(res, 409, { error: 'expired', day })
  if (state.done) return sendJson(res, 409, { error: 'already_done' })

  const guess = (body?.guess ?? '').toLowerCase().trim()
  if (!new RegExp(`^[a-z]{${WORD_LENGTH}}$`).test(guess)) {
    return sendJson(res, 400, { error: 'bad_guess' })
  }
  if (!isAllowedGuess(guess)) {
    // -15 from the time pool, recorded in the signed state; the guess row
    // is NOT consumed.
    state.invalid = (state.invalid ?? 0) + 1
    return sendJson(res, 422, { error: 'not_a_word', token: signState(state), invalidWords: state.invalid })
  }

  const answer = dailyWord(state.day)
  const fb = feedbackFor(answer, guess)
  state.guesses.push(guess)

  const won = guess === answer
  const lost = !won && state.guesses.length >= MAX_GUESSES
  if (won || lost) {
    state.done = true
    state.won = won
    state.end = Date.now()
    const result = scoreGame(won, state.guesses.length, state.hints.length, state.invalid ?? 0, state.end - state.start)
    return sendJson(res, 200, {
      token: signState(state),
      feedback: fb,
      status: won ? 'won' : 'lost',
      result,
      answer, // only revealed once the game is over
    })
  }

  sendJson(res, 200, {
    token: signState(state),
    feedback: fb,
    status: 'playing',
    guessesLeft: MAX_GUESSES - state.guesses.length,
  })
}

export default handler
