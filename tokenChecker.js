const jwt = require('jsonwebtoken')

const jwtSecretString = "Secretkey$123";

module.exports = (req, res, next) => {
    const token = req.headers['authorization'] || req.body.token || req.query.token || req.headers["x-access-token"];

    if (token) {
        jwt.verify(token, jwtSecretString, function (err, decoded) {
            if (err) {
                return res.status(401).json({ "error": true, "message": 'Unauthorized access.' });
            }
            req.decoded = decoded;
            next();
        });
    } else {
        return res.status(403).send({
            "error": true,
            "message": 'No token provided.'
        });
    }
}