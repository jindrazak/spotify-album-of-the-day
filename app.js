var express = require("express"); // Express web server framework
var request = require("request"); // "Request" library
var cors = require("cors");
var querystring = require("querystring");
var cookieParser = require("cookie-parser");
var axios = require("axios");

var client_id = "22ed2875d3ff4ee2bc8ffae6a4f26475"; // Your client id
var client_secret = "21c020cdd8cf4665888e513be32ded16"; // Your secret
var redirect_uri = "http://localhost:8888/callback"; // Your redirect uri

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
          new Buffer(client_id + ":" + client_secret).toString("base64"),
      },
      json: true,
    };

    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token,
          refresh_token = body.refresh_token;

        var options = {
          url: "https://api.spotify.com/v1/me",
          headers: { Authorization: "Bearer " + access_token },
          json: true,
        };

        // use the access token to access the Spotify Web API
        request.get(options, function (error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect(
          "/#" +
            querystring.stringify({
              access_token: access_token,
              refresh_token: refresh_token,
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
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      Authorization:
        "Basic " +
        new Buffer(client_id + ":" + client_secret).toString("base64"),
    },
    form: {
      grant_type: "refresh_token",
      refresh_token: refresh_token,
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

console.log("Listening on 8888");
app.listen(8888);

app.get("/aotd", async function (req, res) {
  const accessToken = req.query["accessToken"];
  const candidateArtistIds = await getCandidateArtistsIds(accessToken);
const artistId = candidateArtistIds[Math.floor(Math.random() * candidateArtistIds.size)]

  const topAlbums = await getArtistAlbums(accessToken, artistId)

  const aotd = topAlbums[Math.floor(Math.random() * topAlbums.length)];

  res.send(aotd);
});


async function getCandidateArtistsIds(access_token) {

  const longTermArtistsPromise = getTopArtists(access_token, "long_term")
  const mediumTermArtistsPromise = getTopArtists(access_token, "medium_term")
  const shortTermArtistsPromise = getTopArtists(access_token, "short_term")

  const resolvedPromises = await Promise.all([longTermArtistsPromise, mediumTermArtistsPromise, shortTermArtistsPromise])

  const longTermArtistIds = resolvedPromises[0].map(artists => artists.id)
  const mediumTermArtistIds = resolvedPromises[1].map(artists => artists.id)
  const shortTermArtistIds = resolvedPromises[2].map(artists => artists.id)

  const candidates = new Set(longTermArtistIds);
  mediumTermArtistIds.forEach(id => candidates.add(id));

  const candidateIds = differenceSet(candidates, shortTermArtistIds)
  
  return Array.from(candidateIds);
}

function differenceSet(setA, setB) {
  let _difference = new Set(setA)
  for (let elem of setB) {
      _difference.delete(elem)
  }
  return _difference
}

async function getTopArtists(access_token, time_range) {
  try {
    const res = await axios.get("https://api.spotify.com/v1/me/top/artists?time_range=" + time_range + "&limit=50", {
      headers: {
        Authorization: "Bearer " + access_token,
      },
    });
    return res.data['items'];
  } catch (error) {
    console.error(error)
  }
}

async function getArtistAlbums(access_token, artistId) {
  try {
    //todo paginate through all the albums
    const res = await axios.get("https://api.spotify.com/v1/artists/" + artistId + "/albums?include_groups=album&limit=50", {
      headers: {
        Authorization: "Bearer " + access_token,
      },
    });
    return res.data['items'];
  } catch (error) {
    console.error(error)
  }
}