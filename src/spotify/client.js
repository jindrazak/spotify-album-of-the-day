import axios from "axios";

export async function getAlbumOfTheDay(accessToken) {
  const candidateArtistIds = await getCandidateArtistsIds(accessToken);
  const artistId = candidateArtistIds[Math.floor(Math.random() * candidateArtistIds.length)]

  const topAlbums = await getArtistAlbums(accessToken, artistId)

  return topAlbums[Math.floor(Math.random() * topAlbums.length)];
}

export async function getCandidateArtistsIds(accessToken) {
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

  return Array.from(candidates);
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

function getSpotifyApi(url, accessToken) {
  return axios.get("https://api.spotify.com/v1/" + url, {
    headers: {
      Authorization: "Bearer " + accessToken,
    },
  });
}
