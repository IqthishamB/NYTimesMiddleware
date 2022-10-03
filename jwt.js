const jwt = require('jsonwebtoken');
var uuidv1 = require('uuidv1');
const mockDB = require('./data.mock');
const tokenList = {};

jwtSecretString = "Secretkey$123";

function getAccessToken(payload) {
    return jwt.sign({ user: payload }, jwtSecretString, { expiresIn: '1min' });
}

function getRefreshToken(payload) {
    if (tokenList.length > 1) {
        const userRefreshTokens = tokenList.filter(token => token.userId === payload.id);

        if (userRefreshTokens.length >= 5) {
            tokenList = tokenList.filter(token => token.userId !== payload.id);
        }
    }
    const refreshToken = jwt.sign({ user: payload }, jwtSecretString, { expiresIn: '1min' });
    const response = {
        id: uuidv1(),
        userId: payload.id,
        refreshToken
    };
    tokenList[refreshToken] = response;
    return refreshToken;
}

function refreshToken(token) {
    // get decoded data
    const decodedToken = jwt.verify(token, jwtSecretString);
    // find the user in the user table
    const user = mockDB.users.find(user => user.id = decodedToken.user.id);
    if (!user) {
        throw new Error(`Access is forbidden`);
    }
    // get all user's refresh tokens from DB
    const allRefreshTokens = tokenList.filter(refreshToken => refreshToken.userId === user.id);
    if (!allRefreshTokens || !allRefreshTokens.length) {
        throw new Error(`There is no refresh token for the user with`);
    }
    const currentRefreshToken = allRefreshTokens.find(refreshToken => refreshToken.refreshToken === token);
    if (!currentRefreshToken) {
        throw new Error(`Refresh token is wrong`);
    }
    // user's data for new tokens
    const payload = {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username
    };
    // get new refresh and access token
    const newRefreshToken = getUpdatedRefreshToken(token, payload);
    const newAccessToken = getAccessToken(payload); return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
    };
}
function getUpdatedRefreshToken(oldRefreshToken, payload) {
    // create new refresh token
    const newRefreshToken = jwt.sign({ user: payload }, jwtSecretString, { expiresIn: '30d' });
    // replace current refresh token with new one
    tokenList = tokenList.map(token => {
        if (token.refreshToken === oldRefreshToken) {
            return {
                refreshToken: newRefreshToken
            };
        }
        return token;
    });
    return newRefreshToken;
}

module.exports = {
    getAccessToken,
    getRefreshToken,
    refreshToken
};