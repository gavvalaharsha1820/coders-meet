const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    try { 
        let token = req.header('x-token');
        if (!token) {
            return res.status(401).send("Token not found");
        }
        

        //token = token.slice(7); // Remove 'Bearer ' prefix to extract token string

        let decoded = jwt.verify(token, 'jwtPassword');
        req.user = decoded.user;
        next();
    } catch(err) {
        console.error('Authentication error:', err);
        return res.status(401).send("Authentication failed: Invalid token");
    }
}
