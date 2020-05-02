const PORT = process.env.PORT || '4000';
const SOCKET_CONNECTION = 'connection';
const SOCKET_ASK_USERNAME = 'ask-username';
const SOCKET_GIVE_USERNAME = 'give-username';
const SOCKET_NEW_USER = 'new-user';
const SOCKET_CALL_USER = 'call-user';
const SOCKET_CALL_MADE = 'call-made';
const SOCKET_MAKE_ANSWER = 'make-answer';
const SOCKET_ANSWER_MADE = 'answer-made';
const SOCKET_NEW_ICE_CANDIDATE = 'new-ice-candidate';
const SOCKET_ADDED_ICE_CANDIDATE = 'added-ice-candidate';
const SOCKET_END_CALL = 'end-call';
const SOCKET_CALL_ENDED = 'call-ended';

export {
    PORT,
    SOCKET_CONNECTION,
    SOCKET_ASK_USERNAME,
    SOCKET_GIVE_USERNAME,
    SOCKET_NEW_USER,
    SOCKET_CALL_USER,
    SOCKET_CALL_MADE,
    SOCKET_MAKE_ANSWER,
    SOCKET_ANSWER_MADE,
    SOCKET_NEW_ICE_CANDIDATE,
    SOCKET_ADDED_ICE_CANDIDATE,
    SOCKET_END_CALL,
    SOCKET_CALL_ENDED
};
