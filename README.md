# Spotify Album of the Day

[![Google Cloud Run](https://github.com/jindrazak/spotify-album-of-the-day/actions/workflows/gcp-cloud-run.yaml/badge.svg?branch=gcp-cloud-run)](https://github.com/jindrazak/spotify-album-of-the-day/actions/workflows/gcp-cloud-run.yaml)

A simple web app that picks a random album based on your previous listening tastes on Spotify. 

# Secrets

In order to make the communication with Spotify API work, you need to provide these secrets to the Docker container:

* `SPOTIFY_CLIENT_ID `
* `SPOTIFY_CLIENT_SECRET`
* `SPOTIFY_REDIRECT_URI`

# Development
Simply start the Node.js container using `docker-compose`:

```bash
docker-compose up
```
