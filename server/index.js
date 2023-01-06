import express from "express";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

const users = [
  {
    id: "1",
    username: "darren",
    password: "justdoit98",
    isAdmin: true,
  },
  {
    id: "2",
    username: "jane",
    password: "jane0909",
    isAdmin: false,
  },
];

let refreshTokens = [];

app.post("/api/refresh", (req, res) => {
  // take the refresh token from the userk
  const refreshToken = req.body.token;

  // send error if there is no token or it's in valid
  if (!refreshToken) return res.status(401).json("You are not authenticated");
  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json("Refresh token is not valid!");
  }
  jwt.verify(refreshToken, "myRefreshSecretKey", (err, user) => {
    err && console.log(err);
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    refreshTokens.push(newRefreshToken);
    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  });

  // if everything is ok, create new access token, refresh and send to user
});

const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, "mySecretKey", {
    expiresIn: "30s",
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, isAdmin: user.isAdmin },
    "myRefreshSecretKey",
    {
      expiresIn: "15m",
    }
  );
};

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find((user) => {
    return user.username === username && user.password === password;
  });
  if (user) {
    /* res.json(user); */
    //Generate an access token
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.push(refreshToken);

    res.json({
      username: user.username,
      isAdmin: user.isAdmin,
      accessToken,
      refreshToken,
    });
  } else {
    res.status(400).json("Username and Password incorrect");
  }
});

const verify = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, "mySecretKey", (err, user) => {
      if (err) {
        return res.status(403).json("Token is not valid!");
      }

      req.user = user;
      next();
    });
  } else {
    res.status(401)("You are not Authenticated!");
  }
};

app.delete("/api/users/:userId", verify, (req, res) => {
  if (req.user.id === req.params.userId || req.user.isAdmin) {
    res.status(200).json("User has been deleted");
  } else {
    res.status(401).json("You are not allowed to delete this user!");
  }
});

/* app.post("/api/logout", verify(req, res) => { */
/*   const refreshToken = req.body.token */
/*   refreshTokens = refreshTokens.filter((token) => token !== refreshToken) */
/*   res.status(200).json("You logged out successfully") */
/* }) */

app.post("/api/logout", verify, (req, res) => {
  const refreshToken = req.body.token;
  refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
  res.status(200).json("You logged out successfully");
});

app.listen(5001, () => console.log("sever running on port 5001"));
