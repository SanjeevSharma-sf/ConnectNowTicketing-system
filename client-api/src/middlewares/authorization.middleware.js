const { verifyAccessJWT } = require("../helpers/jwt.helper");
const { getJWT,deleteJWT } = require("../helpers/redis.helper");
const userAuthorization = async (req, res, next) => {
  const { authorization } = req.headers;
  console.log(authorization);

  //1. verify if jwt is valid
  const decoded = await verifyAccessJWT(authorization);
  if (decoded.email) {
    const userId = await getJWT(authorization);
    if (!userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    req.userId = userId;
    return next();
  }
  deleteJWT(authorization)
  return res.status(403).json({ message: "Forbidden" });
  //2. check if jwt is exist in redis or not
  //3.Extract user id //3,4 part will be done on user router
  //4. get user profile on the based on the user id this part will be done the  in user router

  //if the user is authorized then to the next middleware
};

//export the functions
module.exports = {
  userAuthorization,
};
