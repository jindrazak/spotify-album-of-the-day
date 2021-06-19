var express = require("express"); // Express web server framework
var request = require("request"); // "Request" library
var cors = require("cors");
var querystring = require("querystring");
var cookieParser = require("cookie-parser");
var axios = require("axios");

var client_id = process.env.SPOTIFY_CLIENT_ID;
var client_secret = process.env.SPOTIFY_CLIENT_SECRET;
var redirect_uri = process.env.SPOTIFY_REDIRECT_URI;


var generateRandomString = function (length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = "spotify_auth_state";

var app = express();

app
  .use(express.static(__dirname + "/public"))
  .use(cors())
  .use(cookieParser());

app.get("/login", function (req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = "user-read-private user-read-email user-top-read";
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
      })
  );
});

app.get("/callback", function (req, res) {
  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect(
      "/#" +
        querystring.stringify({
          error: "state_mismatch",
        })
    );
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: "https://accounts.spotify.com/api/token",
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: "authorization_code",
      },
      headers: {
        Authorization:
          "Basic " +
          new Buffer.from(client_id + ":" + client_secret).toString("base64"),
      },
      json: true,
    };

    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var accessToken = body.access_token,
          refreshToken = body.refresh_token;

        // we can also pass the token to the browser to make requests from there
        res.redirect(
          "/#" +
            querystring.stringify({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
        );
      } else {
        res.redirect(
          "/#" +
            querystring.stringify({
              error: "invalid_token",
            })
        );
      }
    });
  }
});

app.get("/refresh_token", function (req, res) {
  // requesting access token from refresh token
  var refreshToken = req.query.refresh_token;
  var authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      Authorization:
        "Basic " +
        new Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
    form: {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    },
    json: true,
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        access_token: access_token,
      });
    }
  });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

app.get("/aotd", async function (req, res) {
  const accessToken = req.query["accessToken"];
  const candidateArtistIds = await getCandidateArtistsIds(accessToken);
const artistId = candidateArtistIds[Math.floor(Math.random() * candidateArtistIds.length)]

  const topAlbums = await getArtistAlbums(accessToken, artistId)

  const aotd = topAlbums[Math.floor(Math.random() * topAlbums.length)];

  res.send(aotd);
});


async function getCandidateArtistsIds(accessToken) {

  const longTermArtistsPromise = getTopArtists(accessToken, "long_term")
  const mediumTermArtistsPromise = getTopArtists(accessToken, "medium_term")
  const shortTermArtistsPromise = getTopArtists(accessToken, "short_term")

  const resolvedPromises = await Promise.all([longTermArtistsPromise, mediumTermArtistsPromise, shortTermArtistsPromise])

  const longTermArtistIds = resolvedPromises[0].map(artists => artists.id)
  const mediumTermArtistIds = resolvedPromises[1].map(artists => artists.id)
  const shortTermArtistIds = resolvedPromises[2].map(artists => artists.id)

  const candidates = new Set(longTermArtistIds);
  mediumTermArtistIds.forEach(id => candidates.add(id));
  shortTermArtistIds.forEach(id => candidates.add(id));

  // const candidateIds = differenceSet(candidates, shortTermArtistIds)
  
  return Array.from(candidates);
}

function differenceSet(setA, setB) {
  let _difference = new Set(setA)
  for (let elem of setB) {
      _difference.delete(elem)
  }
  return _difference
}

async function getTopArtists(accessToken, time_range) {
  try {
    const res = await getSpotifyApi("me/top/artists?time_range=" + time_range + "&limit=50", accessToken)
    return res.data['items'];
  } catch (error) {
    console.error(error.response)
  }
}

async function getArtistAlbums(accessToken, artistId) {
  try {
    //todo paginate through all the albums
    const res = await getSpotifyApi("artists/" + artistId + "/albums?include_groups=album&limit=50", accessToken)
    return res.data['items'];
  } catch (error) {
    console.error(error.response)
  }
}

function getSpotifyApi(url, accessToken){
  return axios.get("https://api.spotify.com/v1/" + url, {
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    });
}
